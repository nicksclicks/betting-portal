import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'signin' | 'signup';

export function LoginPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { signIn, signUp, isLocalMock } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await signIn(email, password);
        if (err) setError(err);
      } else {
        if (!name.trim()) {
          setError('Please enter your name.');
          return;
        }
        const res = await signUp(email, password, name);
        if (res.error) setError(res.error);
        else if (res.needsEmailConfirm) {
          setMessage('Check your email to confirm your account, then sign in.');
          setMode('signin');
        } else {
          setMessage('Account created. You can sign in.');
          setMode('signin');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  if (isLocalMock) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-black">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-white mb-2">Local mock mode</h1>
          <p className="text-neutral-400 text-sm">
            Authentication is skipped. Turn off <code className="text-neutral-300">VITE_LOCAL_MOCK</code> and configure
            Supabase to use login.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-black py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-lg border border-neutral-700 items-center justify-center bg-neutral-950 mb-4">
            <span className="text-white font-serif text-xl font-bold">N</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nick&apos;s Bets</h1>
          <p className="text-neutral-500 text-sm mt-2">
            {mode === 'signin' ? 'Sign in to continue' : 'Create a basic account'}
          </p>
        </div>

        <div className="card">
          <div className="flex rounded-lg border border-neutral-800 p-0.5 mb-6">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'signin' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); setMessage(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === 'signup' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label" htmlFor="auth-name">
                  Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Your name"
                />
              </div>
            )}
            <div>
              <label className="label" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder={mode === 'signup' ? 'Choose a password' : '••••••••'}
                required
              />
              {mode === 'signin' && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => onNavigate('/forgot-password')}
                    className="text-sm text-neutral-400 hover:text-white underline-offset-2 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {message && (
              <p className="text-sm text-lime-400 bg-lime-500/10 border border-lime-500/20 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            <button type="submit" disabled={busy} className="btn-primary w-full flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
