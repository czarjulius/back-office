import express from 'express';
import cors from 'cors';
import { authRoutes } from './modules/auth/auth.routes.js';
import { sessionRoutes } from './modules/sessions/session.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({ message: 'Back-office API is running!!!.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);

app.use(errorHandler);
