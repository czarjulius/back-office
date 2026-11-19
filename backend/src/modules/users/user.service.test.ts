import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserStatus } from '@prisma/client';

const mocks = vi.hoisted(() => ({
  findCredential: vi.fn(),
  list: vi.fn(),
  count: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  hash: vi.fn(),
}));

vi.mock('../../lib/prisma.js', () => ({
  prisma: { credential: { findUnique: mocks.findCredential } },
}));

vi.mock('./user.repository.js', () => ({
  userRepository: {
    list: mocks.list,
    count: mocks.count,
    findById: mocks.findById,
    create: mocks.create,
    update: mocks.update,
    remove: mocks.remove,
  },
}));

vi.mock('bcryptjs', () => ({
  default: { hash: mocks.hash },
}));

import { userService } from './user.service.js';

const baseUser = {
  id: 'u1',
  firstName: 'Ada',
  lastName: 'Lovelace',
  status: UserStatus.ACTIVE,
  loginCount: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  credentials: { email: 'ada@example.com' },
};

describe('userService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists users with pagination and search', async () => {
    mocks.list.mockResolvedValue([baseUser]);
    mocks.count.mockResolvedValue(7);

    const result = await userService.listUsers({ page: 2, limit: 6, search: 'ada' });

    expect(mocks.list).toHaveBeenCalledWith({ skip: 6, take: 6, search: 'ada' });
    expect(result.pagination).toEqual({ page: 2, limit: 6, total: 7, totalPages: 2 });
  });

  it('returns a user by id', async () => {
    mocks.findById.mockResolvedValue(baseUser);
    await expect(userService.getUserById('u1')).resolves.toMatchObject({ email: 'ada@example.com' });
  });

  it('rejects a missing user by id', async () => {
    mocks.findById.mockResolvedValue(null);
    await expect(userService.getUserById('missing')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('creates a normalized-lowercase user credential', async () => {
    mocks.findCredential.mockResolvedValue(null);
    mocks.hash.mockResolvedValue('hashed');
    mocks.create.mockResolvedValue({ ...baseUser, credentials: { email: 'grace@example.com' } });

    await userService.createUser({
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'GRACE@example.com',
      password: 'Password123!',
    });

    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'grace@example.com', status: UserStatus.ACTIVE, passwordHash: 'hashed' }),
    );
  });

  it('rejects duplicate credentials', async () => {
    mocks.findCredential.mockResolvedValue({ id: 'c1' });
    await expect(
      userService.createUser({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'Password123!',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('updates a user', async () => {
    mocks.findById.mockResolvedValue(baseUser);
    mocks.update.mockResolvedValue({ ...baseUser, firstName: 'Augusta Ada', status: UserStatus.INACTIVE });

    const result = await userService.updateUser('u1', { firstName: 'Augusta Ada', status: UserStatus.INACTIVE });

    expect(result.firstName).toBe('Augusta Ada');
    expect(mocks.update).toHaveBeenCalledWith('u1', {
      firstName: 'Augusta Ada',
      lastName: undefined,
      status: UserStatus.INACTIVE,
    });
  });

  it('rejects updating a missing user', async () => {
    mocks.findById.mockResolvedValue(null);
    await expect(userService.updateUser('missing', { status: UserStatus.INACTIVE })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('forbids name changes for inactive users', async () => {
    mocks.findById.mockResolvedValue({ ...baseUser, status: UserStatus.INACTIVE });
    await expect(userService.updateUser('u1', { firstName: 'Augusta Ada' })).rejects.toMatchObject({ statusCode: 403 });
  });

  it('deletes an existing user', async () => {
    mocks.findById.mockResolvedValue(baseUser);
    await expect(userService.deleteUser('u1')).resolves.toEqual({ deleted: true, id: 'u1' });
    expect(mocks.remove).toHaveBeenCalledWith('u1');
  });

  it('rejects deleting a missing user', async () => {
    mocks.findById.mockResolvedValue(null);
    await expect(userService.deleteUser('missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});
