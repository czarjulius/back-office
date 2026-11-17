import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { authenticate } from '../../middleware/authenticate.js';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from './user.schema.js';
import { userService } from './user.service.js';

export const userRoutes = Router();

userRoutes.use(authenticate);

userRoutes.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listUsersQuerySchema.parse(req.query);
    const result = await userService.listUsers(query);
    return res.status(200).json(result);
  }),
);

userRoutes.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.getUserById(userId);
    return res.status(200).json(user);
  }),
);

userRoutes.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createUserSchema.parse(req.body);
    const user = await userService.createUser(payload);
    return res.status(201).json(user);
  }),
);

userRoutes.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const payload = updateUserSchema.parse(req.body);
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.updateUser(userId, payload);
    return res.status(200).json(user);
  }),
);

userRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await userService.deleteUser(userId);
    return res.status(200).json(result);
  }),
);
