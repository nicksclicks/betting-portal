import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ForgotPasswordPageProps {
  onNavigate: (path: string, replace?: boolean) => void;
}

export function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const { sendPasswordResetEmail, isLocalMock } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const { error: err } = await sendPasswordResetEmail(email);
      if (err) setError(err);
      else setMessage('If an account exists for that email, you will receive a reset link shortly.');
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

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-black py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">Reset password</h1>
          <p className="text-neutral-500 text-sm mt-2">We will email you a link to choose a new password.</p>
        </div>

        <div className="card space-y-4">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="label" htmlFor="forgot-email">
                Email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                required
              />
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
              Send reset link
            </button>
          </form>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="text-sm text-neutral-400 hover:text-white w-full text-center"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
