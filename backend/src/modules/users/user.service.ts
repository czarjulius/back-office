import { prisma } from '../../lib/prisma.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../../lib/errors.js';
import { type UserWithCredentials, userRepository } from './user.repository.js';

export type CreateUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export type UpdateUserPayload = {
  firstName?: string;
  lastName?: string;
  status?: 'ACTIVE' | 'INACTIVE';
};

export const userService = {
  listUsers: async ({ page, limit, search }: { page: number; limit: number; search?: string }) => {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      userRepository.list({ skip, take: limit, search }),
      userRepository.count(search),
    ]);

    return {
      data: users.map((user: UserWithCredentials) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        loginCount: user.loginCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        email: user.credentials?.email ?? null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  getUserById: async (id: string) => {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      loginCount: user.loginCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.credentials?.email ?? null,
    };
  },

  createUser: async (payload: CreateUserPayload) => {
    const existing = await prisma.credential.findUnique({
      where: { email: payload.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const created = await userRepository.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      status: payload.status ?? 'ACTIVE',
      email: payload.email.toLowerCase(),
      passwordHash: await import('bcryptjs').then(({ default: bcrypt }) => bcrypt.hash(payload.password, 10)),
    });

    return {
      id: created.id,
      firstName: created.firstName,
      lastName: created.lastName,
      status: created.status,
      email: created.credentials?.email ?? null,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },

  updateUser: async (id: string, payload: UpdateUserPayload) => {
    const current = await userRepository.findById(id);

    if (!current) {
      throw new NotFoundError('User not found');
    }

    const isNameChange = payload.firstName !== undefined || payload.lastName !== undefined;

    if (current.status === 'INACTIVE' && isNameChange) {
      throw new ForbiddenError('Cannot update the name of an inactive user');
    }

    const updated = await userRepository.update(id, {
      firstName: payload.firstName,
      lastName: payload.lastName,
      status: payload.status,
    });

    return {
      id: updated.id,
      firstName: updated.firstName,
      lastName: updated.lastName,
      status: updated.status,
      loginCount: updated.loginCount,
      email: updated.credentials?.email ?? null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  },

  deleteUser: async (id: string) => {
    const existing = await userRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await userRepository.remove(id);

    return { deleted: true, id };
  },
};
