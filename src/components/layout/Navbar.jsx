import Button from '../ui/Button';

export default function Navbar({ user, onLogout, title }) {
  return (
    <header className="navbar">
      <div>
        <h1 className="navbar-title">{title}</h1>
      </div>
      <div className="navbar-actions">
        <div className="navbar-user">
          <div className="navbar-avatar">
            {user?.nama?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.nama}</span>
            <span className="navbar-user-role">{user?.role === 'admin' ? 'Administrator' : 'Karyawan'}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout}>
          Keluar
        </Button>
      </div>
    </header>
  );
}
