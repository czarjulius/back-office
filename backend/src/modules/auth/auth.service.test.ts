import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserStatus } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  findCredential: vi.fn(),
  createCredential: vi.fn(),
  findUser: vi.fn(),
  updateUser: vi.fn(),
  transaction: vi.fn(),
  createSession: vi.fn(),
  terminateSession: vi.fn(),
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    credential: { findUnique: mocks.findCredential },
    user: { findUnique: mocks.findUser, update: mocks.updateUser },
    $transaction: mocks.transaction,
  },
}));

vi.mock('../sessions/session.service.js', () => ({
  sessionService: {
    createSession: mocks.createSession,
    terminateSession: mocks.terminateSession,
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: mocks.hash,
    compare: mocks.compare,
  },
}));

import { authService } from './auth.service.js';

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('signs up a new user and creates a session', async () => {
    mocks.findCredential.mockResolvedValue(null);
    mocks.hash.mockResolvedValue('hashed-password');
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback({
        user: {
          create: vi.fn().mockResolvedValue({ id: 'u1', firstName: 'Ada', lastName: 'Lovelace', status: UserStatus.ACTIVE }),
        },
        credential: { create: mocks.createCredential },
      }),
    );
    mocks.createSession.mockResolvedValue({ id: 's1' });

    const result = await authService.signUp({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ADA@example.com',
      password: 'Password123!',
    });

    expect(result.sessionId).toBe('s1');
    expect(result.user.email).toBe('ada@example.com');
  });

  it('rejects signup for an existing email', async () => {
    mocks.findCredential.mockResolvedValue({ id: 'c1' });
    await expect(
      authService.signUp({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'Password123!',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('signs in and increments login count', async () => {
    mocks.findCredential.mockResolvedValue({
      email: 'ada@example.com',
      passwordHash: 'hash',
      user: { id: 'u1', firstName: 'Ada', lastName: 'Lovelace', status: UserStatus.ACTIVE },
    });
    mocks.compare.mockResolvedValue(true);
    mocks.createSession.mockResolvedValue({ id: 's1' });

    const result = await authService.signIn({ email: 'ADA@example.com', password: 'Password123!' });

    expect(result.sessionId).toBe('s1');
    expect(mocks.updateUser).toHaveBeenCalled();
  });

  it('rejects unknown sign-in credentials', async () => {
    mocks.findCredential.mockResolvedValue(null);
    await expect(authService.signIn({ email: 'missing@example.com', password: 'Password123!' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('rejects an invalid password', async () => {
    mocks.findCredential.mockResolvedValue({
      email: 'ada@example.com',
      passwordHash: 'hash',
      user: { status: UserStatus.ACTIVE },
    });
    mocks.compare.mockResolvedValue(false);
    await expect(authService.signIn({ email: 'ada@example.com', password: 'wrong-password' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('rejects inactive users', async () => {
    mocks.findCredential.mockResolvedValue({
      email: 'ada@example.com',
      passwordHash: 'hash',
      user: { id: 'u1', status: UserStatus.INACTIVE },
    });
    mocks.compare.mockResolvedValue(true);
    await expect(authService.signIn({ email: 'ada@example.com', password: 'Password123!' })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it('gets the current user including credential email', async () => {
    mocks.findUser.mockResolvedValue({
      id: 'u1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      status: UserStatus.ACTIVE,
      loginCount: 2,
      credentials: { email: 'ada@example.com' },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.getCurrentUser('u1');
    expect(result.email).toBe('ada@example.com');
  });

  it('returns null email when credentials are absent', async () => {
    mocks.findUser.mockResolvedValue({
      id: 'u1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      status: UserStatus.ACTIVE,
      loginCount: 0,
      credentials: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect((await authService.getCurrentUser('u1')).email).toBeNull();
  });

  it('rejects a missing current user', async () => {
    mocks.findUser.mockResolvedValue(null);
    await expect(authService.getCurrentUser('missing')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('logs out by terminating the session', async () => {
    mocks.terminateSession.mockResolvedValue({ success: true, sessionId: 's1' });
    await expect(authService.logout('s1', 'u1')).resolves.toEqual({ success: true, sessionId: 's1' });
  });
});
