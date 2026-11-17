import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { sessionService } from './session.service.js';

export const sessionRoutes = Router();

sessionRoutes.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const session = await sessionService.createSession(req.user.id);
    return res.status(201).json({ sessionId: session.id });
  }),
);

sessionRoutes.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const sessionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await sessionService.terminateSession(sessionId, req.user.id);
    return res.status(200).json(result);
  }),
);
