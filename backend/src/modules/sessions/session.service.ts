import { ForbiddenError, NotFoundError, UnauthorizedError } from '../../lib/errors.js';
import { sessionRepository } from './session.repository.js';

export const sessionService = {
  createSession: async (userId: string) => {
    const session = await sessionRepository.create(userId);

    return {
      id: session.id,
      userId: session.userId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  },

  validateSession: async (sessionId: string) => {
    const session = await sessionRepository.findActiveById(sessionId);

    if (!session) {
      throw new UnauthorizedError('Invalid or expired session');
    }

    return {
      id: session.id,
      userId: session.userId,
      user: {
        id: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        status: session.user.status,
        email: session.user.credentials?.email ?? null,
      },
    };
  },

  terminateSession: async (sessionId: string, userId?: string) => {
    const session = await sessionRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    if (userId && session.userId !== userId) {
      throw new ForbiddenError('You can only terminate your own session');
    }

    await sessionRepository.terminateById(sessionId);

    return { success: true, sessionId };
  },

  logout: async (sessionId: string, userId: string) => {
    return sessionService.terminateSession(sessionId, userId);
  },
};
