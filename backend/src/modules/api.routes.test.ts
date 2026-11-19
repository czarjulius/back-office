import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.headers.authorization?.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    req.user = {
      id: 'user-1',
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
    };
    next();
  }),
  signUp: vi.fn(),
  signIn: vi.fn(),
  authLogout: vi.fn(),
  getCurrentUser: vi.fn(),
  listUsers: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  createSession: vi.fn(),
  terminateSession: vi.fn(),
}));

vi.mock('../middleware/authenticate.js', () => ({ authenticate: mocks.authenticate }));
vi.mock('./auth/auth.service.js', () => ({
  authService: {
    signUp: mocks.signUp,
    signIn: mocks.signIn,
    logout: mocks.authLogout,
    getCurrentUser: mocks.getCurrentUser,
  },
}));
vi.mock('./users/user.service.js', () => ({
  userService: {
    listUsers: mocks.listUsers,
    getUserById: mocks.getUserById,
    createUser: mocks.createUser,
    updateUser: mocks.updateUser,
    deleteUser: mocks.deleteUser,
  },
}));
vi.mock('./sessions/session.service.js', () => ({
  sessionService: {
    createSession: mocks.createSession,
    terminateSession: mocks.terminateSession,
  },
}));

import { errorHandler } from '../middleware/errorHandler.js';
import { authRoutes } from './auth/auth.routes.js';
import { sessionRoutes } from './sessions/session.routes.js';
import { userRoutes } from './users/user.routes.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/sessions', sessionRoutes);
  app.use(errorHandler);
  return app;
}

const app = createTestApp();

describe('auth API routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST /api/auth/signup validates input and creates a session', async () => {
    mocks.signUp.mockResolvedValue({
      sessionId: 'session-1',
      user: { id: 'user-1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', status: 'ACTIVE' },
    });

    const response = await request(app).post('/api/auth/signup').send({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Password123!',
    });

    expect(response.status).toBe(201);
    expect(response.body.sessionId).toBe('session-1');
    expect(mocks.signUp).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Password123!',
    });
  });

  it('POST /api/auth/signup rejects mismatched passwords', async () => {
    const response = await request(app).post('/api/auth/signup').send({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      password: 'Password123!',
      passwordConfirmation: 'Different123!',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Passwords do not match');
  });

  it('POST /api/auth/signup rejects invalid email and short password', async () => {
    const response = await request(app).post('/api/auth/signup').send({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'not-an-email',
      password: 'short',
      passwordConfirmation: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
    expect(mocks.signUp).not.toHaveBeenCalled();
  });

  it('POST /api/auth/signin returns a session', async () => {
    mocks.signIn.mockResolvedValue({ sessionId: 'session-2', user: { id: 'user-1' } });

    const response = await request(app).post('/api/auth/signin').send({
      email: 'ada@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.sessionId).toBe('session-2');
  });

  it('GET /api/auth/me requires middleware and returns the current user', async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: 'user-1', email: 'ada@example.com' });

    const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer session-1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('user-1');
  });

  it('POST /api/auth/logout terminates the bearer session', async () => {
    mocks.authLogout.mockResolvedValue({ success: true, sessionId: 'session-1' });

    const response = await request(app).post('/api/auth/logout').set('Authorization', 'Bearer session-1');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

describe('user API routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('GET /api/users passes pagination and search values to the service', async () => {
    mocks.listUsers.mockResolvedValue({ data: [], pagination: { page: 2, limit: 6, total: 0, totalPages: 0 } });

    const response = await request(app)
      .get('/api/users?page=2&limit=6&search=ada')
      .set('Authorization', 'Bearer session-1');

    expect(response.status).toBe(200);
    expect(mocks.listUsers).toHaveBeenCalledWith({ page: 2, limit: 6, search: 'ada' });
  });

  it('GET /api/users/:id returns a user', async () => {
    mocks.getUserById.mockResolvedValue({ id: 'user-1', firstName: 'Ada' });

    const response = await request(app).get('/api/users/user-1').set('Authorization', 'Bearer session-1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe('user-1');
  });

  it('POST /api/users creates a user', async () => {
    mocks.createUser.mockResolvedValue({ id: 'user-2', firstName: 'Grace' });

    const response = await request(app).post('/api/users').set('Authorization', 'Bearer session-1').send({
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      password: 'Password123!',
      status: 'ACTIVE',
    });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe('user-2');
  });

  it('PATCH /api/users/:id updates a user', async () => {
    mocks.updateUser.mockResolvedValue({ id: 'user-1', firstName: 'Augusta Ada', status: 'ACTIVE' });

    const response = await request(app)
      .patch('/api/users/user-1')
      .set('Authorization', 'Bearer session-1')
      .send({ firstName: 'Augusta Ada', status: 'ACTIVE' });

    expect(response.status).toBe(200);
    expect(mocks.updateUser).toHaveBeenCalledWith('user-1', { firstName: 'Augusta Ada', status: 'ACTIVE' });
  });

  it('DELETE /api/users/:id deletes a user', async () => {
    mocks.deleteUser.mockResolvedValue({ deleted: true, id: 'user-1' });

    const response = await request(app).delete('/api/users/user-1').set('Authorization', 'Bearer session-1');

    expect(response.status).toBe(200);
    expect(response.body.deleted).toBe(true);
  });

  it('rejects protected routes when the Bearer header is missing', async () => {
    const response = await request(app).get('/api/users');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Authentication required');
  });

  it('rejects invalid pagination values', async () => {
    const response = await request(app).get('/api/users?page=0&limit=101').set('Authorization', 'Bearer session-1');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Validation failed');
  });
});

describe('session API routes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POST /api/sessions creates a session for the authenticated user', async () => {
    mocks.createSession.mockResolvedValue({ id: 'session-3' });

    const response = await request(app).post('/api/sessions').set('Authorization', 'Bearer session-1');

    expect(response.status).toBe(201);
    expect(response.body.sessionId).toBe('session-3');
  });

  it('DELETE /api/sessions/:id terminates a session', async () => {
    mocks.terminateSession.mockResolvedValue({ success: true, sessionId: 'session-2' });

    const response = await request(app).delete('/api/sessions/session-2').set('Authorization', 'Bearer session-1');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
