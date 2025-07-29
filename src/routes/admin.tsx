import { Route, Routes, Navigate } from 'react-router-dom';
import { Dashboard } from '@/components/admin/Dashboard';
import { ApplicationsPage } from '@/pages/admin/ApplicationsPage';
import { TeamSubmissions } from '@/components/admin/TeamSubmissions';
import { EventDayPage } from '@/pages/admin/EventDayPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { SettingsPage } from '@/pages/admin/SettingsPage';
import { UserManagementPage } from '@/pages/admin/UserManagementPage';

export function AdminRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="applications" element={<ApplicationsPage />} />
      <Route path="teams" element={<TeamSubmissions />} />
      <Route path="event-day" element={<EventDayPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="users" element={<UserManagementPage />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
