import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { NotFound } from './pages/NotFound';

const AdminApp = lazy(() => import('./admin/AdminApp'));

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin/*" element={<Suspense fallback={<p className="p-6 text-muted">Loading…</p>}><AdminApp /></Suspense>} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/:date" element={<HomePage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
