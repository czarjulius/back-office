import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserStatus } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  count: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: {
    user: {
      findMany: mocks.findMany,
      count: mocks.count,
      findUnique: mocks.findUnique,
      create: mocks.create,
      update: mocks.update,
      delete: mocks.delete,
    },
  },
}));

import { userRepository } from './user.repository.js';

describe('userRepository', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists users without search filters', async () => {
    mocks.findMany.mockResolvedValue([]);
    await userRepository.list({ skip: 0, take: 6 });

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: undefined,
        skip: 0,
        take: 6,
      }),
    );
  });

  it('lists users with an insensitive search across names and email', async () => {
    mocks.findMany.mockResolvedValue([]);
    await userRepository.list({ skip: 6, take: 6, search: 'Ada' });

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { firstName: { contains: 'Ada', mode: 'insensitive' } },
            { lastName: { contains: 'Ada', mode: 'insensitive' } },
            { credentials: { is: { email: { contains: 'Ada', mode: 'insensitive' } } } },
          ],
        },
        skip: 6,
        take: 6,
      }),
    );
  });

  it('counts users without search', async () => {
    mocks.count.mockResolvedValue(0);
    await expect(userRepository.count()).resolves.toBe(0);
  });

  it('counts users with search', async () => {
    mocks.count.mockResolvedValue(2);
    await expect(userRepository.count('Ada')).resolves.toBe(2);
  });

  it('finds a user by id with credentials', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'u1' });
    await expect(userRepository.findById('u1')).resolves.toEqual({ id: 'u1' });
  });

  it('creates a user and credential', async () => {
    mocks.create.mockResolvedValue({ id: 'u1' });

    await userRepository.create({
      firstName: 'Ada',
      lastName: 'Lovelace',
      status: UserStatus.ACTIVE,
      email: 'ada@example.com',
      passwordHash: 'hash',
    });

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          credentials: {
            create: { email: 'ada@example.com', passwordHash: 'hash' },
          },
        }),
      }),
    );
  });

  it('updates a user', async () => {
    mocks.update.mockResolvedValue({ id: 'u1', status: UserStatus.INACTIVE });
    await expect(userRepository.update('u1', { status: UserStatus.INACTIVE })).resolves.toMatchObject({
      status: UserStatus.INACTIVE,
    });
  });

  it('removes a user', async () => {
    mocks.delete.mockResolvedValue({ id: 'u1' });
    await expect(userRepository.remove('u1')).resolves.toEqual({ id: 'u1' });
  });
});
