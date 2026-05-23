import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';

jest.mock('../../lib/prisma', () => {
  const mock = mockDeep<PrismaClient>();
  return { prisma: mock };
});

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const { prisma } = require('../../lib/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const MOCK_DB_USER = {
  user_id: 1,
  user_username: 'admin',
  user_password: '$2b$10$hashedpassword',
  user_first_name: 'Admin',
  user_last_name: 'User',
  user_middle_name: '',
  user_national_id: '1-2345-6789',
  user_email: 'admin@test.com',
  user_role: 'admin',
  user_version: 1,
};

describe('Auth lifecycle integration: login → refresh → logout → reuse denied', () => {
  let app: any;
  const blocklistedTokens = new Set<string>();

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    process.env.JWT_EXPIRES_IN = '86400';
    app = (await import('../../index')).default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    blocklistedTokens.clear();

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    (jwt.sign as jest.Mock).mockImplementation((payload: { id: number }) => {
      if (payload.id === 1) {
        return 'access-token-new';
      }

      return 'access-token';
    });

    (jwt.verify as jest.Mock).mockImplementation((token: string) => {
      if (token === 'refresh-token-valid') {
        return { id: 1, username: 'admin', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600, type: 'refresh' };
      }

      if (token === 'access-token' || token === 'access-token-new') {
        return { id: 1, username: 'admin', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 };
      }

      if (token === 'expired-token') {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      }

      throw new Error('invalid token');
    });

    prisma.vpg_users.findFirst.mockImplementation(async ({ where }: { where: { user_username: string } }) => {
      if (where.user_username === 'admin') {
        return MOCK_DB_USER;
      }
      return null;
    });

    prisma.vpg_users.findUnique.mockImplementation(async ({ where }: { where: { user_id: number } }) => {
      if (where.user_id === 1) {
        return MOCK_DB_USER;
      }
      return null;
    });

    prisma.vpg_users.update.mockResolvedValue(MOCK_DB_USER);

    prisma.vpg_token_blocklist.findFirst.mockImplementation(async ({ where }: { where: { blocklist_token: string } }) => {
      if (blocklistedTokens.has(where.blocklist_token)) {
        return { blocklist_token: where.blocklist_token };
      }
      return null;
    });

    prisma.vpg_token_blocklist.create.mockImplementation(async ({ data }: { data: { blocklist_token: string } }) => {
      blocklistedTokens.add(data.blocklist_token);
      return data;
    });
  });

  it('allows valid login, refreshes token, logs out, then denies reuse with 401 revoked', async () => {
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body).toHaveProperty('token');

    const refreshRes = await request(app)
      .post('/api/refresh')
      .send({ refresh_token: 'refresh-token-valid' });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body).toHaveProperty('token');
    expect(refreshRes.body.token).toBe('access-token-new');

    const logoutRes = await request(app)
      .post('/api/logout')
      .set('Authorization', 'Bearer access-token')
      .send({});

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    const reuseRes = await request(app)
      .get('/api/me')
      .set('Authorization', 'Bearer access-token');

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.success).toBe(false);
    expect(reuseRes.body.error).toEqual(
      expect.objectContaining({
        code: 'AUTH_TOKEN_REVOKED',
        status: 401,
      }),
    );
  });

  it('handles second logout idempotently: controlled 401, never 500', async () => {
    const firstLogoutRes = await request(app)
      .post('/api/logout')
      .set('Authorization', 'Bearer access-token')
      .send({});

    expect(firstLogoutRes.status).toBe(200);

    const secondLogoutRes = await request(app)
      .post('/api/logout')
      .set('Authorization', 'Bearer access-token')
      .send({});

    expect([200, 401]).toContain(secondLogoutRes.status);
    expect(secondLogoutRes.status).not.toBe(500);
  });
});
