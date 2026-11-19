import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type UserWithCredentials = Prisma.UserGetPayload<{
  include: {
    credentials: {
      select: { email: true };
    };
  };
}>;

function buildUserSearchWhere(search?: string): Prisma.UserWhereInput | undefined {
  if (!search) {
    return undefined;
  }

  return {
    OR: [
      { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
      { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
      {
        credentials: {
          is: {
            email: { contains: search, mode: Prisma.QueryMode.insensitive },
          },
        },
      },
    ],
  };
}

export const userRepository = {
  list: async ({ skip, take, search }: { skip: number; take: number; search?: string }) => {
    const where = buildUserSearchWhere(search);

    return prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        credentials: {
          select: { email: true },
        },
      },
    });
  },

  count: async (search?: string) => {
    const where = buildUserSearchWhere(search);
    return prisma.user.count({ where });
  },

  findById: async (id: string) =>
    prisma.user.findUnique({
      where: { id },
      include: {
        credentials: {
          select: { email: true },
        },
      },
    }),

  create: async (data: {
    firstName: string;
    lastName: string;
    status: 'ACTIVE' | 'INACTIVE';
    email: string;
    passwordHash: string;
  }) =>
    prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        status: data.status,
        credentials: {
          create: {
            email: data.email,
            passwordHash: data.passwordHash,
          },
        },
      },
      include: {
        credentials: {
          select: { email: true },
        },
      },
    }),

  update: async (id: string, data: { firstName?: string; lastName?: string; status?: 'ACTIVE' | 'INACTIVE' }) =>
    prisma.user.update({
      where: { id },
      data,
      include: {
        credentials: {
          select: { email: true },
        },
      },
    }),

  remove: async (id: string) => prisma.user.delete({ where: { id } }),
};
