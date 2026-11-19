import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  findActiveById: vi.fn(),
  findById: vi.fn(),
  terminateById: vi.fn(),
  terminateAllForUser: vi.fn(),
}));

vi.mock('./session.repository.js', () => ({
  sessionRepository: mocks,
}));

import { sessionService } from './session.service.js';

describe('sessionService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a session', async () => {
    mocks.create.mockResolvedValue({ id: 's1', userId: 'u1', createdAt: new Date(), expiresAt: null });
    await expect(sessionService.createSession('u1')).resolves.toMatchObject({ id: 's1', userId: 'u1' });
  });

  it('validates an active session and returns its user', async () => {
    mocks.findActiveById.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      user: {
        id: 'u1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        status: 'ACTIVE',
        credentials: { email: 'ada@example.com' },
      },
    });

    await expect(sessionService.validateSession('s1')).resolves.toMatchObject({ user: { email: 'ada@example.com' } });
  });

  it('returns null email for a session user without credentials', async () => {
    mocks.findActiveById.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      user: { id: 'u1', firstName: 'Ada', lastName: 'Lovelace', status: 'ACTIVE', credentials: null },
    });

    expect((await sessionService.validateSession('s1')).user.email).toBeNull();
  });

  it('rejects invalid or expired sessions', async () => {
    mocks.findActiveById.mockResolvedValue(null);
    await expect(sessionService.validateSession('expired')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('terminates an owned session', async () => {
    mocks.findById.mockResolvedValue({ id: 's1', userId: 'u1' });
    await expect(sessionService.terminateSession('s1', 'u1')).resolves.toEqual({ success: true, sessionId: 's1' });
    expect(mocks.terminateById).toHaveBeenCalledWith('s1');
  });

  it('allows terminating by id without ownership context', async () => {
    mocks.findById.mockResolvedValue({ id: 's1', userId: 'u1' });
    await expect(sessionService.terminateSession('s1')).resolves.toEqual({ success: true, sessionId: 's1' });
  });

  it('rejects termination of a missing session', async () => {
    mocks.findById.mockResolvedValue(null);
    await expect(sessionService.terminateSession('missing', 'u1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('rejects termination of another user session', async () => {
    mocks.findById.mockResolvedValue({ id: 's1', userId: 'u2' });
    await expect(sessionService.terminateSession('s1', 'u1')).rejects.toMatchObject({ statusCode: 403 });
  });

  it('logout delegates to session termination', async () => {
    mocks.findById.mockResolvedValue({ id: 's1', userId: 'u1' });
    await expect(sessionService.logout('s1', 'u1')).resolves.toEqual({ success: true, sessionId: 's1' });
  });
});
