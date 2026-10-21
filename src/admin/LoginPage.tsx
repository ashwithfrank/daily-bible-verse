import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

export function LoginPage() {
  const { signIn, status, configError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useDocumentMeta({ title: 'Admin sign in — AlphaOmega Studio', noindex: true });

  if (status === 'admin' || status === 'notAdmin') return <Navigate to="/admin" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    setError('');
    const problem = await signIn(email, password);
    setBusy(false);
    if (problem) setError(problem);
    else navigate((location.state as { from?: string } | null)?.from ?? '/admin', { replace: true });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <img src={`${import.meta.env.BASE_URL}aos-mark-small.png`} alt="" width={56} height={53} className="logo-mark mb-4 h-14 w-auto" />
      <h1 className="text-2xl font-bold">Administrator sign in</h1>
      {configError && <p className="mt-3 text-danger" role="alert">{configError}</p>}
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="error-text">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy || !!configError}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
