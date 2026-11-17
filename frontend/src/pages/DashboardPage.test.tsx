import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DashboardPage } from './DashboardPage';

const logout = vi.fn();
const listUsers = vi.fn();

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
  },
  authApi: {
    logout: vi.fn(),
  },
}));

describe('DashboardPage', () => {
  beforeEach(() => {
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
});
