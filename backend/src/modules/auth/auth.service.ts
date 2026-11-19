import bcrypt from 'bcryptjs';
import { Prisma, UserStatus } from '@prisma/client';
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../lib/errors.js';
import { prisma } from '../../lib/prisma.js';
import { sessionService } from '../sessions/session.service.js';

export const authService = {
  signUp: async (payload: { firstName: string; lastName: string; email: string; password: string }) => {
    const normalizedEmail = payload.email.toLowerCase();
    const existing = await prisma.credential.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const user = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const createdUser = await tx.user.create({
        data: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          status: UserStatus.ACTIVE,
        },
      });

      await tx.credential.create({
        data: {
          userId: createdUser.id,
          email: normalizedEmail,
          passwordHash: await bcrypt.hash(payload.password, 10),
        },
      });

      return createdUser;
    });

    const session = await sessionService.createSession(user.id);

    return {
      sessionId: session.id,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        email: normalizedEmail,
      },
    };
  },

  signIn: async (payload: { email: string; password: string }) => {
    const email = payload.email.toLowerCase();
    const credential = await prisma.credential.findUnique({
      where: { email },
      include: { user: true },
    });

    if (!credential) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValidPassword = await bcrypt.compare(payload.password, credential.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (credential.user.status === UserStatus.INACTIVE) {
      throw new ForbiddenError('Inactive users cannot sign in');
    }

    const session = await sessionService.createSession(credential.user.id);

    await prisma.user.update({
      where: { id: credential.user.id },
      data: { loginCount: { increment: 1 } },
    });

    return {
      sessionId: session.id,
      user: {
        id: credential.user.id,
        firstName: credential.user.firstName,
        lastName: credential.user.lastName,
        status: credential.user.status,
        email: credential.email,
      },
    };
  },

  logout: async (sessionId: string, userId: string) => {
    const session = await sessionService.terminateSession(sessionId, userId);
    return session;
  },

  getCurrentUser: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { credentials: { select: { email: true } } },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      loginCount: user.loginCount,
      email: user.credentials?.email ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
};
