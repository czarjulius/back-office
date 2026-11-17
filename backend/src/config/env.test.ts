import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

describe('env config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it('loads the required env values', async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '4100';
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/backoffice_test';

    const { env } = await import('./env.js');

    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(4100);
    expect(env.DATABASE_URL).toBe('postgresql://postgres:postgres@localhost:5432/backoffice_test');
  });

  it('throws when DATABASE_URL is blank', async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '4100';
    process.env.DATABASE_URL = '';

    await expect(import('./env.js')).rejects.toThrow();
  });
});
