import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function AdminGuard() {
  const { status, signOut, configError } = useAuth();
  const location = useLocation();
  if (configError) return <p className="p-6" role="alert">{configError}</p>;
  if (status === 'loading') return <p className="p-6 text-muted" role="status">Checking your session…</p>;
  if (status === 'signedOut') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (status === 'notAdmin') {
    return (
      <main className="mx-auto max-w-md p-6" role="alert">
        <h1 className="text-xl font-semibold">This account is not an administrator</h1>
        <p className="mt-2 text-muted">Sign in with an account that has been added to the administrator list.</p>
        <button className="btn mt-4" onClick={() => void signOut()}>Sign out</button>
      </main>
    );
  }
  return <Outlet />;
}
