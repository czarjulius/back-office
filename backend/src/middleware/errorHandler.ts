import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
    });
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      })),
    });
  }

  console.error(err);

  return res.status(500).json({
    message: 'Internal server error',
  });
};
