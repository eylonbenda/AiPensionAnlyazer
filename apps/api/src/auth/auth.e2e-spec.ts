process.env.JWT_SECRET = 'e2e-test-secret';

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { prisma } from '@pension-analyzer/database';
import * as bcrypt from 'bcryptjs';
import { AuthModule } from './auth.module';

jest.mock('@pension-analyzer/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn(),
}));

describe('Auth (e2e)', () => {
  let app: INestApplication;

  const mockUser = {
    id: 'user-e2e-1',
    email: 'e2e@example.com',
    passwordHash: 'hashed',
    name: 'E2E User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  beforeEach(() => {
    (prisma.user.findUnique as jest.Mock).mockReset();
    (prisma.user.create as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should return 201 with accessToken and user when email is new', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'e2e@example.com', password: 'password123', name: 'E2E User' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('e2e@example.com');
      expect(res.body.user.name).toBe('E2E User');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should return 409 when email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'e2e@example.com', password: 'password123' })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should return 201 with accessToken and user when credentials are valid', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@example.com', password: 'password123' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('e2e@example.com');
    });

    it('should return 401 when password is wrong', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@example.com', password: 'wrong' })
        .expect(401);
    });

    it('should return 401 when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'unknown@example.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 when no Authorization header', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should return 200 with user when valid Bearer token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'e2e@example.com', password: 'password123' })
        .expect(201);

      const token = loginRes.body.accessToken;
      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(meRes.body.email).toBe('e2e@example.com');
      expect(meRes.body).not.toHaveProperty('passwordHash');
    });
  });
});
