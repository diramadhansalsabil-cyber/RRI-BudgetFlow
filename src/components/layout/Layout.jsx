import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { clearSession } from '../../utils/auth';

const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/pengajuan', label: 'Pengajuan', icon: '📋' },
  { to: '/admin/templates', label: 'Template RAB', icon: '📝' },
];

const USER_NAV = [
  { to: '/user', label: 'Dashboard', icon: '📊', end: true },
  { to: '/user/pengajuan/baru', label: 'Pengajuan Baru', icon: '➕' },
];

export default function Layout({ user, title }) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const navItems = user?.role === 'admin' ? ADMIN_NAV : USER_NAV;

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <Sidebar
        items={navItems}
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className={`main-content ${collapsed ? 'main-expanded' : ''}`}>
        <Navbar user={user} onLogout={handleLogout} title={title} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
