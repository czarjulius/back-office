import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

const { logout, listUsers, createUser, updateUser, deleteUser } = vi.hoisted(() => ({
  logout: vi.fn(),
  listUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      status: 'ACTIVE',
      email: 'ada@example.com',
    },
    logout,
  }),
}));

vi.mock('../lib/api', () => ({
  userApi: {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
  },
  authApi: {
    logout: vi.fn(),
  },
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn());
    vi.mocked(window.confirm).mockReturnValue(false);
    vi.clearAllMocks();

    listUsers.mockResolvedValue({
      data: [
        {
          id: 'u-1',
          firstName: 'Grace',
          lastName: 'Hopper',
          email: 'grace@example.com',
          status: 'ACTIVE',
          loginCount: 7,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 6,
        total: 1,
        totalPages: 1,
      },
    });
  });

  it('renders the user list and fetches the first page', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(listUsers).toHaveBeenCalledWith({ page: 1, limit: 6, search: '' });
    });

    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('grace@example.com')).toBeInTheDocument();
  });

  it('renders an empty-state when no users match', async () => {
    listUsers.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 6, total: 0, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('No users found.')).toBeInTheDocument();
  });

  it('searches and resets to the first page', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await screen.findByText('Grace Hopper');
    fireEvent.change(screen.getByLabelText('Search users'), { target: { value: 'grace' } });

    await waitFor(() => {
      expect(listUsers).toHaveBeenCalledWith({ page: 1, limit: 6, search: 'grace' });
    });
  });

  it('creates a user and refreshes the first page', async () => {
    createUser.mockResolvedValue({ id: 'u-2', firstName: 'Grace', lastName: 'Hopper' });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await screen.findByText('Grace Hopper');
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Grace' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Hopper' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'grace@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }));

    await waitFor(() => {
      expect(createUser).toHaveBeenCalledWith({
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.com',
        password: 'Password123!',
        status: 'ACTIVE',
      });
    });
  });

  it('shows an API error and leaves the create form available', async () => {
    createUser.mockRejectedValue(new Error('Email already registered'));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await screen.findByText('Grace Hopper');
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Grace' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Hopper' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'grace@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create user' }));

    expect(await screen.findByText('Email already registered')).toBeInTheDocument();
  });

  it('edits a selected user without sending the disabled email field', async () => {
    updateUser.mockResolvedValue({ id: 'u-1', firstName: 'Katherine', status: 'INACTIVE' });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await screen.findByText('Grace Hopper');
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Katherine' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'INACTIVE' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update user' }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith('u-1', {
        firstName: 'Katherine',
        lastName: 'Hopper',
        status: 'INACTIVE',
      });
    });
  });

  it('does not delete when confirmation is cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await screen.findByText('Grace Hopper');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('deletes after confirmation and refreshes the current page', async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    deleteUser.mockResolvedValue({ deleted: true, id: 'u-1' });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await screen.findByText('Grace Hopper');
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith('u-1');
    });
  });
});
