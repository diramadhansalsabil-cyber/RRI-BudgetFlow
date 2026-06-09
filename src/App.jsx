import { Routes, Route, Navigate } from 'react-router-dom';
import { getSession } from './utils/auth';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import UserDashboard from './pages/user/UserDashboard';
import PengajuanForm from './pages/user/PengajuanForm';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPengajuanList from './pages/admin/AdminPengajuanList';
import PengajuanDetail from './pages/admin/PengajuanDetail';
import TemplateManager from './pages/admin/TemplateManager';

function ProtectedRoute({ children, role }) {
  const session = getSession();
  if (!session) return <Navigate to="/login" replace />;
  if (role && session.role !== role) {
    return <Navigate to={session.role === 'admin' ? '/admin' : '/user'} replace />;
  }
  return children;
}

function AppRoutes() {
  const session = getSession();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          session ? (
            <Navigate to={session.role === 'admin' ? '/admin' : '/user'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/user"
        element={
          <ProtectedRoute role="user">
            <Layout user={getSession()} title="Dashboard Karyawan" />
          </ProtectedRoute>
        }
      >
        <Route index element={<UserDashboard user={getSession()} />} />
        <Route path="pengajuan/baru" element={<PengajuanForm user={getSession()} />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Layout user={getSession()} title="Dashboard Admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="pengajuan" element={<AdminPengajuanList />} />
        <Route path="pengajuan/:id" element={<PengajuanDetail />} />
        <Route path="templates" element={<TemplateManager />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <AppRoutes />;
}
