import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from './app.js';

describe('API app', () => {
  it('returns a healthy status from the root endpoint', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('exposes the API welcome message', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('Back-office API');
  });
});
