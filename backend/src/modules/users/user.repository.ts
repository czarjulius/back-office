import { prisma } from '../../lib/prisma.js';

export type UserWithCredentials = Awaited<ReturnType<typeof prisma.user.findMany>>[number];

export const userRepository = {
  list: async ({ skip, take, search }: { skip: number; take: number; search?: string }) => {
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { credentials: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

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
    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { credentials: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

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
