import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, getSession } from '../utils/auth';
import Button from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existing = getSession();
    if (existing) {
      navigate(existing.role === 'admin' ? '/admin' : '/user', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const user = login(username.trim(), password);
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/user', { replace: true });
    } else {
      setError('Username atau password salah');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">RRI</div>
          <h1>BudgetFlow</h1>
          <p>Sistem Pengajuan Anggaran</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin atau user"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk ke Dashboard'}
          </Button>
        </form>

        <div className="login-demo">
          <p className="login-demo-title">Akun Demo</p>
          <div className="login-demo-grid">
            <button
              type="button"
              className="demo-chip"
              onClick={() => {
                setUsername('admin');
                setPassword('admin123');
              }}
            >
              <strong>Admin</strong>
              <span>admin / admin123</span>
            </button>
            <button
              type="button"
              className="demo-chip"
              onClick={() => {
                setUsername('user');
                setPassword('user123');
              }}
            >
              <strong>Karyawan</strong>
              <span>user / user123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
