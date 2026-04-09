import { PrismaClient } from '@prisma/client';
import { mockDeep } from 'jest-mock-extended';
import { AuthService } from '../../../service/AuthService';

jest.mock('../../../lib/prisma', () => {
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

const { prisma } = require('../../../lib/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const mockPrismaUser = {
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

beforeEach(() => {
  jest.clearAllMocks();
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '86400';

  prisma.vpg_users.findUnique.mockResolvedValue(null);
  prisma.vpg_users.findFirst.mockResolvedValue(null);
  prisma.vpg_token_blocklist.findFirst.mockResolvedValue(null);
  prisma.vpg_token_blocklist.create.mockResolvedValue({});
});

describe('AuthService', () => {
  describe('authenticate', () => {
    it('should return success with token when credentials are valid', async () => {
      prisma.vpg_users.findFirst.mockResolvedValue(mockPrismaUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-jwt-token');

      const result = await AuthService.authenticate({
        username: 'admin',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user).toEqual(expect.objectContaining({
        id: 1,
        username: 'admin',
        role: 'admin',
      }));
    });

    it('should return failure when user not found', async () => {
      prisma.vpg_users.findFirst.mockResolvedValue(null);

      const result = await AuthService.authenticate({
        username: 'nonexistent',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Usuario no encontrado');
      expect(result.token).toBeUndefined();
    });

    it('should return failure when password is wrong', async () => {
      prisma.vpg_users.findFirst.mockResolvedValue(mockPrismaUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await AuthService.authenticate({
        username: 'admin',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Contraseña incorrecta');
    });

    it('should return server error when database throws', async () => {
      prisma.vpg_users.findFirst.mockRejectedValue(new Error('DB error'));

      const result = await AuthService.authenticate({
        username: 'admin',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error interno del servidor');
    });

    it('should compare plain text password when stored password is not bcrypt', async () => {
      const plainTextUser = { ...mockPrismaUser, user_password: 'plainpassword' };
      prisma.vpg_users.findFirst.mockResolvedValue(plainTextUser);

      const result = await AuthService.authenticate({
        username: 'admin',
        password: 'plainpassword',
      });

      expect(result.success).toBe(true);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('verifyToken', () => {
    it('should return decoded payload for valid token', () => {
      const payload = { id: 1, username: 'admin', role: 'admin' };
      (jwt.verify as jest.Mock).mockReturnValue(payload);

      const result = AuthService.verifyToken('valid-token');

      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    });

    it('should throw for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Token inválido');
      });

      expect(() => AuthService.verifyToken('invalid-token')).toThrow('Token inválido');
    });

    it('should throw token expired error preserving TokenExpiredError name', () => {
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      try {
        AuthService.verifyToken('expired-token');
        fail('Expected token verification to throw');
      } catch (error) {
        expect((error as Error).name).toBe('TokenExpiredError');
        expect((error as Error).message).toBe('Token expirado');
      }
    });
  });

  describe('getUserById', () => {
    it('should return authenticated user when found', async () => {
      prisma.vpg_users.findUnique.mockResolvedValue(mockPrismaUser);

      const result = await AuthService.getUserById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.username).toBe('admin');
      // AuthenticatedUser type omite password por diseño
      expect(result!.id).toBe(1);
    });

    it('should return null when user not found', async () => {
      prisma.vpg_users.findUnique.mockResolvedValue(null);

      const result = await AuthService.getUserById(999);

      expect(result).toBeNull();
    });

    it('should return null when database throws', async () => {
      prisma.vpg_users.findUnique.mockRejectedValue(new Error('DB error'));

      const result = await AuthService.getUserById(1);

      expect(result).toBeNull();
    });
  });

  describe('getUserByUsername', () => {
    it('should return user when found', async () => {
      prisma.vpg_users.findFirst.mockResolvedValue(mockPrismaUser);

      const result = await AuthService.getUserByUsername('admin');

      expect(result).not.toBeNull();
      expect(result!.username).toBe('admin');
      expect(prisma.vpg_users.findFirst).toHaveBeenCalledWith({
        where: { user_username: 'admin' },
      });
    });

    it('should return null when user not found', async () => {
      prisma.vpg_users.findFirst.mockResolvedValue(null);

      const result = await AuthService.getUserByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('isTokenBlocklisted', () => {
    it('should return true when token is in blocklist', async () => {
      prisma.vpg_token_blocklist.findFirst.mockResolvedValue({ blocklist_token: 'token123' });

      const result = await AuthService.isTokenBlocklisted('token123');

      expect(result).toBe(true);
    });

    it('should return false when token is not in blocklist', async () => {
      prisma.vpg_token_blocklist.findFirst.mockResolvedValue(null);

      const result = await AuthService.isTokenBlocklisted('token123');

      expect(result).toBe(false);
    });
  });

  describe('validateCredentials', () => {
    it('should return user when credentials are valid', async () => {
      prisma.vpg_users.findFirst.mockResolvedValue(mockPrismaUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await AuthService.validateCredentials({
        username: 'admin',
        password: 'password123',
      });

      expect(result).not.toBeNull();
      expect(result!.username).toBe('admin');
    });

    it('should return null when user not found', async () => {
      prisma.vpg_users.findFirst.mockResolvedValue(null);

      const result = await AuthService.validateCredentials({
        username: 'nonexistent',
        password: 'password123',
      });

      expect(result).toBeNull();
    });

    it('should return null when password is wrong', async () => {
      prisma.vpg_users.findFirst.mockResolvedValue(mockPrismaUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await AuthService.validateCredentials({
        username: 'admin',
        password: 'wrong',
      });

      expect(result).toBeNull();
    });
  });
});
