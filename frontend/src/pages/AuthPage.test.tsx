import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    signIn: mocks.signIn,
    signUp: mocks.signUp,
  }),
}));

function renderAuthPage() {
  return render(
    <MemoryRouter>
      <AuthPage />
    </MemoryRouter>,
  );
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs in with the submitted credentials', async () => {
    mocks.signIn.mockResolvedValue({ id: 'user-1' });
    renderAuthPage();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Minimum 8 characters'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign in' })[1]);

    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith({
        email: 'ada@example.com',
        password: 'Password123!',
      });
    });
  });

  it('switches to sign up and submits all account fields', async () => {
    mocks.signUp.mockResolvedValue({ id: 'user-2' });
    renderAuthPage();

    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Grace' } });
    fireEvent.change(screen.getByPlaceholderText('Doe'), { target: { value: 'Hopper' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'grace@example.com' } });

    const passwordFields = screen.getAllByPlaceholderText(/Minimum 8 characters|Repeat your password/);
    fireEvent.change(passwordFields[0], { target: { value: 'Password123!' } });
    fireEvent.change(passwordFields[1], { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(mocks.signUp).toHaveBeenCalledWith({
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.com',
        password: 'Password123!',
        passwordConfirmation: 'Password123!',
      });
    });
  });

  it('renders a backend error and stays on the auth page', async () => {
    mocks.signIn.mockRejectedValue(new Error('Invalid email or password'));
    renderAuthPage();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Minimum 8 characters'), { target: { value: 'WrongPassword!' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign in' })[1]);

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('clears stale errors when switching authentication modes', async () => {
    mocks.signIn.mockRejectedValue(new Error('Sign-in failed'));
    renderAuthPage();

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Minimum 8 characters'), { target: { value: 'WrongPassword!' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Sign in' })[1]);

    expect(await screen.findByText('Sign-in failed')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(screen.queryByText('Sign-in failed')).not.toBeInTheDocument();
  });
});
