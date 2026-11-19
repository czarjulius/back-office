import { describe, expect, it } from 'vitest';
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './errors.js';

describe('application errors', () => {
  it('creates a base application error', () => {
    const error = new AppError('Failure', 418);
    expect(error.message).toBe('Failure');
    expect(error.statusCode).toBe(418);
  });

  it('creates not-found errors', () => {
    expect(new NotFoundError().statusCode).toBe(404);
    expect(new NotFoundError('Missing').message).toBe('Missing');
  });

  it('creates conflict errors', () => {
    expect(new ConflictError().statusCode).toBe(409);
  });

  it('creates unauthorized errors', () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
  });

  it('creates forbidden errors', () => {
    expect(new ForbiddenError().statusCode).toBe(403);
  });

  it('creates validation errors', () => {
    expect(new ValidationError().statusCode).toBe(400);
  });
});
