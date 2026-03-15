import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { prisma } from '@pension-analyzer/database';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

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

describe('AuthService', () => {
  let service: AuthService;
  let jwtSign: jest.SpyInstance;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '$2a$10$hashed',
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const toUser = (row: typeof mockUser) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });

  beforeEach(async () => {
    (prisma.user.findUnique as jest.Mock).mockReset();
    (prisma.user.create as jest.Mock).mockReset();
    (bcrypt.compare as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtSign = module.get(JwtService).sign as jest.Mock;
  });

  describe('register', () => {
    it('should create user and return accessToken and user when email is new', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register('test@example.com', 'password123', 'Test User');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: expect.any(String),
          name: 'Test User',
        },
      });
      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toEqual(toUser(mockUser));
      expect(jwtSign).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email });
    });

    it('should throw ConflictException when email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register('test@example.com', 'password123')).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register('test@example.com', 'password123')).rejects.toThrow(
        'User with this email already exists',
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user when email and password match', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toEqual(toUser(mockUser));
    });

    it('should return null when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('unknown@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('should return null when password is wrong', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return accessToken and user', async () => {
      const user = toUser(mockUser);
      const result = await service.login(user);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toEqual(user);
      expect(jwtSign).toHaveBeenCalledWith({ sub: user.id, email: user.email });
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getUserById('user-1');

      expect(result).toEqual(toUser(mockUser));
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('should return null when user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getUserById('unknown-id');

      expect(result).toBeNull();
    });
  });
});
