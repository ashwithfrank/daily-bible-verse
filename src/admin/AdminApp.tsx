import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { AdminGuard } from './AdminGuard';
import { AdminLayout } from './AdminLayout';
import { LoginPage } from './LoginPage';
import { DashboardPage } from './DashboardPage';
import { VersesPage } from './VersesPage';
import { VerseFormPage } from './VerseFormPage';
import { CalendarPage } from './CalendarPage';
import { ImportPage } from './ImportPage';

export default function AdminApp() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="verses" element={<VersesPage />} />
            <Route path="verses/new" element={<VerseFormPage />} />
            <Route path="verses/:id" element={<VerseFormPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="import" element={<ImportPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
