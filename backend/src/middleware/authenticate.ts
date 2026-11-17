import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../lib/errors.js';
import { sessionService } from '../modules/sessions/session.service.js';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication required');
    }

    const sessionId = authHeader.replace('Bearer ', '').trim();
    const session = await sessionService.validateSession(sessionId);

    req.user = {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
    };

    next();
  } catch (error) {
    next(error);
  }
};
