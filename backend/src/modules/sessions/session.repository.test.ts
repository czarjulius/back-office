import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    session: {
      findUnique: mocks.findUnique,
      findFirst: mocks.findFirst,
      create: mocks.create,
      update: mocks.update,
      updateMany: mocks.updateMany,
    },
  },
}));

import { sessionRepository } from './session.repository.js';

describe('sessionRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('finds a session by id with its user', async () => {
    mocks.findUnique.mockResolvedValue({ id: 's1' });
    await expect(sessionRepository.findById('s1')).resolves.toEqual({ id: 's1' });
  });

  it('finds active sessions and excludes expired sessions', async () => {
    mocks.findFirst.mockResolvedValue({ id: 's1' });
    await sessionRepository.findActiveById('s1');

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 's1',
          terminatedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }],
        }),
      }),
    );
  });

  it('creates a session', async () => {
    mocks.create.mockResolvedValue({ id: 's1', userId: 'u1' });
    await expect(sessionRepository.create('u1')).resolves.toMatchObject({ id: 's1' });
  });

  it('terminates a session', async () => {
    mocks.update.mockResolvedValue({ id: 's1', terminatedAt: new Date() });
    await expect(sessionRepository.terminateById('s1')).resolves.toMatchObject({ id: 's1' });
  });

  it('terminates all active sessions for a user', async () => {
    mocks.updateMany.mockResolvedValue({ count: 2 });
    await expect(sessionRepository.terminateAllForUser('u1')).resolves.toEqual({ count: 2 });
  });
});
