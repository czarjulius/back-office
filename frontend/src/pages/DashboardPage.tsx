import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [navigate, user]);

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  return (
    <main className="page-shell dashboard-shell">
      <section className="dashboard-card">
        <header className="dashboard-header">
          <div>
            <span className="eyebrow">Protected dashboard</span>
            <h1>
              Hello, {user.firstName} {user.lastName}
            </h1>
          </div>

          <button type="button" className="secondary-button" onClick={handleLogout}>
            Log out
          </button>
        </header>

        <div className="stat-grid">
          <article className="stat-tile">
            <span>Status</span>
            <strong>{user.status}</strong>
          </article>
          <article className="stat-tile">
            <span>User ID</span>
            <strong>{user.id.slice(0, 8)}</strong>
          </article>
          <article className="stat-tile">
            <span>Email</span>
            <strong>{user.email}</strong>
          </article>
        </div>

        <div className="card-panel">
          <h2>Session ready</h2>
          <p>
            This page is protected by the backend session middleware and requires a valid Bearer token for every
            authenticated request.
          </p>
        </div>
      </section>
    </main>
  );
}
