import { z } from 'zod';

export const userStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('A valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  status: userStatusSchema.optional().default('ACTIVE'),
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').optional(),
  lastName: z.string().trim().min(1, 'Last name is required').optional(),
  status: userStatusSchema.optional(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(6),
  search: z.string().trim().optional(),
});
