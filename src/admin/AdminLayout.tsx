import { NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useDocumentMeta } from '../hooks/useDocumentMeta';

const links = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/verses', label: 'Verses', end: false },
  { to: '/admin/calendar', label: 'Calendar', end: false },
  { to: '/admin/import', label: 'Import', end: false },
];

export function AdminLayout() {
  const { signOut, email } = useAuth();
  useDocumentMeta({ title: 'Admin — AlphaOmega Studio', noindex: true });
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/aos-mark-small.png" alt="" width={32} height={30} className="logo-mark h-8 w-auto" />
            <span className="font-bold">AlphaOmega Studio Admin</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            {email && <span className="hidden sm:inline">{email}</span>}
            <button className="btn" onClick={() => void signOut()}><LogOut size={16} aria-hidden /> Sign out</button>
          </div>
        </div>
        <nav aria-label="Admin" className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 pb-2">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-brand text-on-brand' : 'text-muted hover:bg-brand-soft'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
