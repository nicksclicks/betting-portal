import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, isLocalMockMode } from '../lib/supabase';

export type ProfileRole = 'admin' | 'user';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
}

const MOCK_PROFILE: Profile = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'demo@local.test',
  name: 'Demo (local mock)',
  role: 'admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileLoading: boolean;
  isLocalMock: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null; needsEmailConfirm?: boolean }>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
      if (error || !data) {
        setProfile(null);
        return;
      }
      setProfile(data as Profile);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (isLocalMockMode) {
      setProfile(MOCK_PROFILE);
      return;
    }
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s?.user) {
      setProfile(null);
      return;
    }
    await loadProfile(s.user.id);
  }, [loadProfile]);

  useEffect(() => {
    if (isLocalMockMode) {
      setSession(null);
      setProfile(MOCK_PROFILE);
      setLoading(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      const { data: { session: initial } } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(initial);
      if (initial?.user) await loadProfile(initial.user.id);
      else setProfile(null);
      setLoading(false);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next?.user) void loadProfile(next.user.id);
      else setProfile(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (isLocalMockMode) {
      return { error: 'Sign-in is disabled in local mock mode.' };
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    if (isLocalMockMode) {
      return { error: 'Sign-up is disabled in local mock mode.' };
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), role: 'user' } },
    });
    if (error) return { error: error.message };
    if (data.user && !data.session) {
      return { error: null, needsEmailConfirm: true };
    }
    return { error: null };
  }, []);

  const sendPasswordResetEmail = useCallback(async (email: string) => {
    if (isLocalMockMode) {
      return { error: 'Password reset is disabled in local mock mode.' };
    }
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    if (isLocalMockMode) {
      return { error: 'Password update is disabled in local mock mode.' };
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (isLocalMockMode) return;
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      profileLoading,
      isLocalMock: isLocalMockMode,
      isAuthenticated: isLocalMockMode || !!session,
      isAdmin: profile?.role === 'admin',
      signIn,
      signUp,
      sendPasswordResetEmail,
      updatePassword,
      signOut,
      refreshProfile,
    }),
    [session, profile, loading, profileLoading, signIn, signUp, sendPasswordResetEmail, updatePassword, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// useAuth is intentionally co-located with AuthProvider for a single import surface.
// eslint-disable-next-line react-refresh/only-export-components -- hook must live next to provider
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
