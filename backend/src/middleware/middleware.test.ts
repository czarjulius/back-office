import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ validateSession: vi.fn() }));

vi.mock('../modules/sessions/session.service.js', () => ({
  sessionService: { validateSession: mocks.validateSession },
}));

import { authenticate } from './authenticate.js';
import { errorHandler } from './errorHandler.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.get('/protected', authenticate, (req, res) => res.json({ userId: req.user?.id }));
  app.post('/zod', (req, res, next) => {
    try {
      z.object({ email: z.string().email() }).parse(req.body);
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });
  app.get('/error', (_req, _res, next) => next(new Error('unexpected')));
  app.use(errorHandler);
  return app;
}

describe('authentication middleware', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects missing authorization headers', async () => {
    const response = await request(createTestApp()).get('/protected');
    expect(response.status).toBe(401);
  });

  it('rejects malformed authorization headers', async () => {
    const response = await request(createTestApp()).get('/protected').set('Authorization', 'Basic abc');
    expect(response.status).toBe(401);
  });

  it('attaches the authenticated user', async () => {
    mocks.validateSession.mockResolvedValue({
      user: { id: 'u1', email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' },
    });

    const response = await request(createTestApp()).get('/protected').set('Authorization', 'Bearer s1');

    expect(response.status).toBe(200);
    expect(response.body.userId).toBe('u1');
  });

  it('passes invalid session errors to the error handler', async () => {
    mocks.validateSession.mockRejectedValue(new Error('invalid session'));
    const response = await request(createTestApp()).get('/protected').set('Authorization', 'Bearer bad');
    expect(response.status).toBe(500);
  });
});

describe('errorHandler', () => {
  it('formats Zod validation errors', async () => {
    const response = await request(createTestApp()).post('/zod').send({ email: 'invalid' });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });

  it('formats unexpected errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await request(createTestApp()).get('/error');
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });

  it('formats application errors', async () => {
    const app = express();
    app.get('/conflict', (_req, _res, next) => {
      next(Object.assign(new Error('Duplicate'), { statusCode: 409 }));
    });
    app.use(errorHandler);

    const response = await request(app).get('/conflict');
    expect(response.status).toBe(500);
  });

  it('falls back to 500 for plain errors carrying non-AppError properties', async () => {
    const app = express();
    app.get('/plain-error', (_req, _res, next) => {
      next(new Error('A plain error'));
    });
    app.use(errorHandler);

    const response = await request(app).get('/plain-error');
    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal server error');
  });
});
