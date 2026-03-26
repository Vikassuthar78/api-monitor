import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TesterPage from './pages/TesterPage';
import LogsPage from './pages/LogsPage';
import ComparePage from './pages/ComparePage';
import SchedulerPage from './pages/SchedulerPage';
import AlertsPage from './pages/AlertsPage';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/"          element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
          <Route path="/tester"    element={<ProtectedLayout><TesterPage /></ProtectedLayout>} />
          <Route path="/logs"      element={<ProtectedLayout><LogsPage /></ProtectedLayout>} />
          <Route path="/compare"   element={<ProtectedLayout><ComparePage /></ProtectedLayout>} />
          <Route path="/scheduler" element={<ProtectedLayout><SchedulerPage /></ProtectedLayout>} />
          <Route path="/alerts"    element={<ProtectedLayout><AlertsPage /></ProtectedLayout>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
