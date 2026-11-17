import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authService } from './auth.service.js';

const signUpSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  passwordConfirmation: z.string().min(8, 'Password confirmation is required'),
});

const signInSchema = z.object({
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const authRoutes = Router();

authRoutes.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const payload = signUpSchema.parse(req.body);

    if (payload.password !== payload.passwordConfirmation) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const result = await authService.signUp({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
    });

    return res.status(201).json(result);
  }),
);

authRoutes.post(
  '/signin',
  asyncHandler(async (req, res) => {
    const payload = signInSchema.parse(req.body);
    const result = await authService.signIn(payload);
    return res.status(200).json(result);
  }),
);

authRoutes.post(
  '/logout',
  authenticate,
  asyncHandler(async (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '').trim();

    if (!sessionId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const result = await authService.logout(sessionId, req.user.id);
    return res.status(200).json(result);
  }),
);

authRoutes.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const result = await authService.getCurrentUser(req.user.id);
    return res.status(200).json(result);
  }),
);
