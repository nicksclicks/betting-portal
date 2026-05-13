import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ResetPasswordPageProps {
  onNavigate: (path: string, replace?: boolean) => void;
}

export function ResetPasswordPage({ onNavigate }: ResetPasswordPageProps) {
  const { updatePassword, isLocalMock } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<'checking' | 'ready' | 'invalid'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLocalMock) {
      setPhase('invalid');
      return;
    }

    let cancelled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' && session) setPhase('ready');
    });

    const t = window.setTimeout(() => {
      if (cancelled) return;
      void supabase.auth.getSession().then(({ data: { session } }) => {
        if (cancelled) return;
        setPhase((prev) => (prev === 'checking' ? (session ? 'ready' : 'invalid') : prev));
      });
    }, 2500);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      subscription.unsubscribe();
    };
  }, [isLocalMock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await updatePassword(password);
      if (err) setError(err);
      else onNavigate('/', true);
    } finally {
      setBusy(false);
    }
  };

  if (isLocalMock) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-black">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Local mock mode</h1>
          <p className="text-neutral-400 text-sm">Password reset is not available in mock mode.</p>
        </div>
      </div>
    );
  }

  if (phase === 'checking') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-neutral-500" aria-label="Loading" />
        <p className="text-neutral-500 text-sm mt-4">Verifying reset link…</p>
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-black py-12">
        <div className="card max-w-md w-full text-center space-y-4">
          <h1 className="text-xl font-semibold text-white">Link invalid or expired</h1>
          <p className="text-neutral-400 text-sm">Request a new reset link from the sign-in page.</p>
          <button type="button" onClick={() => onNavigate('/')} className="btn-primary w-full">
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-black py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Choose a new password</h1>
          <p className="text-neutral-500 text-sm mt-2">Enter and confirm your new password.</p>
        </div>

        <div className="card">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="label" htmlFor="reset-password">
                New password
              </label>
              <input
                id="reset-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="label" htmlFor="reset-confirm">
                Confirm password
              </label>
              <input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
