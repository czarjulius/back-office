import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialSignUpState = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirmation: '',
};

const initialSignInState = {
  email: '',
  password: '',
};

export function AuthPage() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [form, setForm] = useState({ ...initialSignInState, ...initialSignUpState });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';
    return <Navigate to={destination} replace />;
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'signup') {
        await signUp({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          passwordConfirmation: form.passwordConfirmation,
        });
      } else {
        await signIn({
          email: form.email,
          password: form.password,
        });
      }

      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setError('');
  };

  return (
    <main className="page-shell auth-shell">
      <section className="auth-card">
        <div className="auth-header">
          <span className="eyebrow">Access portal</span>
          <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
        </div>

        <div className="auth-toggle" role="tablist" aria-label="Authentication mode">
          <button type="button" className={mode === 'signin' ? 'active' : ''} onClick={() => switchMode('signin')}>
            Sign in
          </button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>
            Sign up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <>
              <label>
                First name
                <input
                  name="firstName"
                  type="text"
                  value={form.firstName}
                  onChange={handleInputChange}
                  placeholder="Jane"
                  autoComplete="given-name"
                  required
                />
              </label>

              <label>
                Last name
                <input
                  name="lastName"
                  type="text"
                  value={form.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  autoComplete="family-name"
                  required
                />
              </label>
            </>
          )}

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleInputChange}
              placeholder="Minimum 8 characters"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {mode === 'signup' && (
            <label>
              Confirm password
              <input
                name="passwordConfirmation"
                type="password"
                value={form.passwordConfirmation}
                onChange={handleInputChange}
                placeholder="Repeat your password"
                autoComplete="new-password"
                required
              />
            </label>
          )}

          {error && <div className="error-banner">{error}</div>}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  );
}
