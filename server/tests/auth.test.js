'use strict';

const request = require('supertest');
const mongoose = require('mongoose');

// Load env before app
process.env.NODE_ENV = 'test';
process.env.PORT = '5001';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/tether_test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_that_is_long_enough_for_testing_purposes';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_that_is_long_enough_for_testing_purposes';
process.env.ACCESS_TOKEN_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.R2_ACCOUNT_ID = 'test_account';
process.env.R2_ACCESS_KEY_ID = 'test_key';
process.env.R2_SECRET_ACCESS_KEY = 'test_secret';
process.env.R2_BUCKET_NAME = 'test_bucket';
process.env.R2_PUBLIC_URL = 'https://test.r2.dev';
process.env.CLIENT_URL = 'http://localhost:5173';

const app = require('../../src/app');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function signupUser(overrides = {}) {
  const payload = {
    name: 'Test User',
    email: `test_${Date.now()}_${Math.random()}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/signup').send(payload);
  return { res, payload };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────

describe('POST /api/auth/signup', () => {
  it('should create a user, couple, and return tokens', async () => {
    const { res } = await signupUser();
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.coupleId).toBeDefined();
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('should reject duplicate email', async () => {
    const email = 'dup@example.com';
    await signupUser({ email });
    const { res } = await signupUser({ email });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('should reject short password', async () => {
    const { res } = await signupUser({ password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid email', async () => {
    const { res } = await signupUser({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const { payload } = await signupUser();
    const res = await request(app).post('/api/auth/login').send({ email: payload.email, password: payload.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject wrong password', async () => {
    const { payload } = await signupUser();
    const res = await request(app).post('/api/auth/login').send({ email: payload.email, password: 'wrongpass' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('should reject nonexistent email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ghost@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('should return user info with valid token', async () => {
    const { res: signup } = await signupUser();
    const token = signup.body.data.accessToken;
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBeDefined();
  });

  it('should reject missing token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('should reject invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

// ─── Pairing Tests ────────────────────────────────────────────────────────────

describe('POST /api/couples/join', () => {
  it('should pair two users successfully', async () => {
    const { res: r1 } = await signupUser({ email: 'userA@example.com' });
    const { res: r2 } = await signupUser({ email: 'userB@example.com' });

    const inviteCode = r1.body.data.user.couple.inviteCode;
    const tokenB = r2.body.data.accessToken;

    const res = await request(app)
      .post('/api/couples/join')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ inviteCode });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.couple.memberCount).toBe(2);
  });

  it('should reject joining own couple', async () => {
    const { res: r1 } = await signupUser();
    const inviteCode = r1.body.data.user.couple.inviteCode;
    const token = r1.body.data.accessToken;

    const res = await request(app)
      .post('/api/couples/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ inviteCode });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('CANNOT_JOIN_OWN_COUPLE');
  });

  it('should reject invalid invite code', async () => {
    const { res: r1 } = await signupUser();
    const token = r1.body.data.accessToken;

    const res = await request(app)
      .post('/api/couples/join')
      .set('Authorization', `Bearer ${token}`)
      .send({ inviteCode: 'BADCODE' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('INVALID_INVITE_CODE');
  });

  it('should reject joining a full couple', async () => {
    const { res: r1 } = await signupUser({ email: 'a@example.com' });
    const { res: r2 } = await signupUser({ email: 'b@example.com' });
    const { res: r3 } = await signupUser({ email: 'c@example.com' });

    const inviteCode = r1.body.data.user.couple.inviteCode;
    // B joins
    await request(app)
      .post('/api/couples/join')
      .set('Authorization', `Bearer ${r2.body.data.accessToken}`)
      .send({ inviteCode });

    // C tries to join the same couple
    const res = await request(app)
      .post('/api/couples/join')
      .set('Authorization', `Bearer ${r3.body.data.accessToken}`)
      .send({ inviteCode });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('COUPLE_ALREADY_FULL');
  });
});

// ─── Authorization Tests ──────────────────────────────────────────────────────

describe('Data isolation — couple A cannot access couple B data', () => {
  let tokenA, tokenB, coupleAId;

  beforeEach(async () => {
    const { res: r1 } = await signupUser({ email: 'coupleA1@example.com' });
    const { res: r2 } = await signupUser({ email: 'coupleA2@example.com' });
    tokenA = r1.body.data.accessToken;
    coupleAId = r1.body.data.user.coupleId;

    // Pair couple A
    await request(app)
      .post('/api/couples/join')
      .set('Authorization', `Bearer ${r2.body.data.accessToken}`)
      .send({ inviteCode: r1.body.data.user.couple.inviteCode });

    // Re-fetch token for couple A member after pairing
    const login1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'coupleA1@example.com', password: 'password123' });
    tokenA = login1.body.data.accessToken;

    // Couple B — separate pair
    const { res: r3 } = await signupUser({ email: 'coupleB1@example.com' });
    const { res: r4 } = await signupUser({ email: 'coupleB2@example.com' });
    await request(app)
      .post('/api/couples/join')
      .set('Authorization', `Bearer ${r4.body.data.accessToken}`)
      .send({ inviteCode: r3.body.data.user.couple.inviteCode });

    const login3 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'coupleB1@example.com', password: 'password123' });
    tokenB = login3.body.data.accessToken;
  });

  it('couple B cannot read couple A memories', async () => {
    // A creates a memory
    const memRes = await request(app)
      .post('/api/memories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Our first trip', description: 'Amazing!' });
    expect(memRes.status).toBe(201);
    const memId = memRes.body.data._id;

    // B tries to delete it
    const delRes = await request(app)
      .delete(`/api/memories/${memId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(delRes.status).toBe(404);
  });

  it('couple B cannot read couple A categories', async () => {
    const catRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Date nights', icon: '🌙' });
    expect(catRes.status).toBe(201);
    const catId = catRes.body.data._id;

    const delRes = await request(app)
      .delete(`/api/categories/${catId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(delRes.status).toBe(404);
  });
});
