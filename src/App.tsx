import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import DayView from './pages/DayView';
import MomentDetail from './pages/MomentDetail';
import MomentForm from './pages/MomentForm';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Chat from './pages/Chat';
import Statistics from './pages/Statistics';
import Vacations from './pages/Vacations';

function ProtectedRoutes() {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <DataProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="kalender" element={<Calendar />} />
          <Route path="dag/:date" element={<DayView />} />
          <Route path="moment/:id" element={<MomentDetail />} />
          <Route path="meldingen" element={<Notifications />} />
          <Route path="chat" element={<Chat />} />
          <Route path="statistieken" element={<Statistics />} />
          <Route path="vakantie" element={<Vacations />} />
          <Route path="profiel" element={<Profile />} />
          {isAdmin && (
            <>
              <Route path="nieuw" element={<MomentForm />} />
              <Route path="bewerken/:id" element={<MomentForm />} />
              <Route path="gebruikers" element={<UserManagement />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
