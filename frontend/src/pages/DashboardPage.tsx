import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi, type UserRecord, type UserStatus } from '../lib/api';

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  status: UserStatus;
};

const EMPTY_FORM: UserFormState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  status: 'ACTIVE',
};

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  useEffect(() => {
    if (!user) {
      navigate('/auth', { replace: true });
    }
  }, [navigate, user]);

  const refreshUsers = useCallback(
    async (nextPage = page, nextSearch = search) => {
      try {
        setLoading(true);
        const result = await userApi.listUsers({
          page: nextPage,
          limit: 6,
          search: nextSearch,
        });

        setUsers(result.data);
        setTotalPages(result.pagination.totalPages || 1);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load users');
      } finally {
        setLoading(false);
      }
    },
    [page, search],
  );

  useEffect(() => {
    void refreshUsers(page, search);
  }, [page, refreshUsers, search]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth', { replace: true });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  const handleFormChange = (field: keyof UserFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingId) {
        await userApi.updateUser(editingId, {
          firstName: form.firstName,
          lastName: form.lastName,
          status: form.status,
        });
      } else {
        await userApi.createUser({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          status: form.status,
        });
      }

      resetForm();
      setPage(1);
      await refreshUsers(1, search);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save the user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (selectedUser: UserRecord) => {
    setEditingId(selectedUser.id);
    setForm({
      firstName: selectedUser.firstName,
      lastName: selectedUser.lastName,
      email: selectedUser.email ?? '',
      password: '',
      status: selectedUser.status,
    });
    setError('');
  };

  const handleDelete = async (selectedUser: UserRecord) => {
    if (!window.confirm(`Delete ${selectedUser.firstName} ${selectedUser.lastName}?`)) {
      return;
    }

    try {
      await userApi.deleteUser(selectedUser.id);
      const nextPage = users.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);
      await refreshUsers(nextPage, search);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete the user');
    }
  };

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  if (!user) {
    return null;
  }

  return (
    <main className="page-shell dashboard-shell">
      <section className="dashboard-card dashboard-wide">
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

        <div className="management-grid">
          <section className="card-panel user-form-panel">
            <div className="panel-header">
              <h2>{editingId ? 'Edit user' : 'Create user'}</h2>
              {editingId && (
                <button type="button" className="secondary-button light-button" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>

            <form className="user-form" onSubmit={handleSubmit}>
              <div className="field-row">
                <label>
                  First name
                  <input
                    value={form.firstName}
                    onChange={(event) => handleFormChange('firstName', event.target.value)}
                    required
                  />
                </label>
                <label>
                  Last name
                  <input
                    value={form.lastName}
                    onChange={(event) => handleFormChange('lastName', event.target.value)}
                    required
                  />
                </label>
              </div>

              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => handleFormChange('email', event.target.value)}
                  disabled={Boolean(editingId)}
                  required={!editingId}
                />
              </label>

              {!editingId && (
                <label>
                  Password
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => handleFormChange('password', event.target.value)}
                    minLength={8}
                    required
                  />
                </label>
              )}

              <label>
                Status
                <select value={form.status} onChange={(event) => handleFormChange('status', event.target.value as UserStatus)}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>

              {error && <div className="error-banner">{error}</div>}

              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update user' : 'Create user'}
              </button>
            </form>
          </section>

          <section className="card-panel table-panel">
            <div className="panel-header table-header">
              <h2>Users</h2>
              <div className="search-wrap">
                <input
                  aria-label="Search users"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search by name or email"
                />
              </div>
            </div>

            {loading ? (
              <div className="loading-panel slim">Loading users…</div>
            ) : (
              <>
                <div className="table-wrap">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Logins</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((selectedUser) => (
                        <tr key={selectedUser.id}>
                          <td>{selectedUser.firstName} {selectedUser.lastName}</td>
                          <td>{selectedUser.email ?? '—'}</td>
                          <td>
                            <span className={`status-badge ${selectedUser.status.toLowerCase()}`}>
                              {selectedUser.status}
                            </span>
                          </td>
                          <td>{selectedUser.loginCount ?? 0}</td>
                          <td>
                            <div className="action-group">
                              <button type="button" className="secondary-button small-button" onClick={() => handleEdit(selectedUser)}>
                                Edit
                              </button>
                              <button type="button" className="secondary-button small-button danger-button" onClick={() => handleDelete(selectedUser)}>
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {users.length === 0 && <div className="no-results">No users found.</div>}

                <div className="pagination">
                  <button type="button" className="secondary-button small-button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                    Previous
                  </button>

                  <div className="page-buttons">
                    {pageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={pageNumber === page ? 'page-button active' : 'page-button'}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>

                  <button type="button" className="secondary-button small-button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                    Next
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
