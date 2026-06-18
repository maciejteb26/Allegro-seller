import request from 'supertest';
import { app } from '../../src/app';
import { resetDb } from './helpers/db';
import { uniqueEmail, cookieHeader } from './helpers/fixtures';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
});

describe('auth flow', () => {
  it('registers, logs in, fetches /me, refreshes and logs out', async () => {
    const email = uniqueEmail('auth');
    const password = 'password123';

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name: 'Auth Tester' });
    expect(registerRes.status).toBe(201);
    const registerCookie = cookieHeader(registerRes);
    expect(registerCookie).toContain('accessToken');

    const meRes = await request(app).get('/api/auth/me').set('Cookie', registerCookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe(email);

    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(200);
    const loginCookie = cookieHeader(loginRes);

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', loginCookie);
    expect(refreshRes.status).toBe(200);
    const refreshedCookie = cookieHeader(refreshRes);

    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', refreshedCookie);
    expect(logoutRes.status).toBe(200);
  });

  it('rejects login with a wrong password without throwing a 500', async () => {
    const email = uniqueEmail('auth-bad');
    await request(app).post('/api/auth/register').send({ email, password: 'password123', name: 'Auth Tester' });

    const res = await request(app).post('/api/auth/login').send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('rejects requests to protected routes without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
