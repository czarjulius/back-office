import { prisma } from '../../lib/prisma.js';

export const sessionRepository = {
  findById: async (id: string) =>
    prisma.session.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            credentials: {
              select: { email: true },
            },
          },
        },
      },
    }),

  findActiveById: async (id: string) =>
    prisma.session.findFirst({
      where: {
        id,
        terminatedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        user: {
          include: {
            credentials: {
              select: { email: true },
            },
          },
        },
      },
    }),

  create: async (userId: string) =>
    prisma.session.create({
      data: { userId },
      include: {
        user: {
          include: {
            credentials: {
              select: { email: true },
            },
          },
        },
      },
    }),

  terminateById: async (id: string) =>
    prisma.session.update({
      where: { id },
      data: { terminatedAt: new Date() },
    }),

  terminateAllForUser: async (userId: string) =>
    prisma.session.updateMany({
      where: {
        userId,
        terminatedAt: null,
      },
      data: {
        terminatedAt: new Date(),
      },
    }),
};
