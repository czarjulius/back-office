import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';

const app = express();
const port = env.PORT;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.json({ message: 'Back-office API is running.' });
});

app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
