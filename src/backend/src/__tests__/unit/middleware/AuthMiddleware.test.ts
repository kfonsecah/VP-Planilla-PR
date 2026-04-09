import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../../../middleware/AuthMiddleware';
import { AuthService } from '../../../service/AuthService';

jest.mock('../../../service/AuthService', () => ({
  AuthService: {
    verifyToken: jest.fn(),
    isTokenBlocklisted: jest.fn(),
    getUserById: jest.fn(),
  },
}));

type MockResponse = {
  status: jest.Mock;
  json: jest.Mock;
};

const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  return res;
};

describe('AuthMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('verifyToken', () => {
    it('returns AUTH_TOKEN_MISSING when authorization header is absent', async () => {
      const req = { headers: {} } as Request;
      const res = createMockResponse() as unknown as Response;
      const next = jest.fn() as NextFunction;

      await AuthMiddleware.verifyToken(req, res, next);

      expect((res as unknown as MockResponse).status).toHaveBeenCalledWith(401);
      expect((res as unknown as MockResponse).json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          status: 401,
          retryable: true,
          message: expect.any(String),
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns AUTH_TOKEN_REVOKED when token is blocklisted', async () => {
      const req = {
        headers: { authorization: 'Bearer revoked-token' },
      } as unknown as Request;
      const res = createMockResponse() as unknown as Response;
      const next = jest.fn() as NextFunction;

      (AuthService.verifyToken as jest.Mock).mockReturnValue({ id: 10 });
      (AuthService.isTokenBlocklisted as jest.Mock).mockResolvedValue(true);

      await AuthMiddleware.verifyToken(req, res, next);

      expect((res as unknown as MockResponse).status).toHaveBeenCalledWith(401);
      expect((res as unknown as MockResponse).json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_TOKEN_REVOKED',
          status: 401,
          retryable: true,
          message: expect.any(String),
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns canonical auth error shape', async () => {
      const req = { headers: {} } as Request;
      const res = createMockResponse() as unknown as Response;
      const next = jest.fn() as NextFunction;

      await AuthMiddleware.verifyToken(req, res, next);

      const payload = (res as unknown as MockResponse).json.mock.calls[0][0];
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('error');
      expect(payload.error).toEqual(
        expect.objectContaining({
          code: expect.any(String),
          message: expect.any(String),
          status: expect.any(Number),
          retryable: expect.any(Boolean),
        }),
      );
    });
  });

  describe('requireRole', () => {
    it('returns AUTH_INSUFFICIENT_SCOPE for authenticated user without role', () => {
      const req = {
        user: { role: 'employee' },
      } as unknown as Request;
      const res = createMockResponse() as unknown as Response;
      const next = jest.fn() as NextFunction;

      const middleware = AuthMiddleware.requireRole(['admin']);
      middleware(req, res, next);

      expect((res as unknown as MockResponse).status).toHaveBeenCalledWith(403);
      expect((res as unknown as MockResponse).json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_INSUFFICIENT_SCOPE',
          status: 403,
          retryable: false,
          message: expect.any(String),
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns AUTH_TOKEN_EXPIRED when verifyToken throws TokenExpiredError', async () => {
      const req = {
        headers: { authorization: 'Bearer expired-token' },
      } as unknown as Request;
      const res = createMockResponse() as unknown as Response;
      const next = jest.fn() as NextFunction;

      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';

      (AuthService.verifyToken as jest.Mock).mockImplementation(() => {
        throw expiredError;
      });

      await AuthMiddleware.verifyToken(req, res, next);

      expect((res as unknown as MockResponse).status).toHaveBeenCalledWith(401);
      expect((res as unknown as MockResponse).json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_TOKEN_EXPIRED',
          status: 401,
          retryable: true,
          message: expect.any(String),
        },
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('returns AUTH_TOKEN_INVALID for malformed token errors', async () => {
      const req = {
        headers: { authorization: 'Bearer invalid-token' },
      } as unknown as Request;
      const res = createMockResponse() as unknown as Response;
      const next = jest.fn() as NextFunction;

      (AuthService.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('invalid token');
      });

      await AuthMiddleware.verifyToken(req, res, next);

      expect((res as unknown as MockResponse).status).toHaveBeenCalledWith(401);
      expect((res as unknown as MockResponse).json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          status: 401,
          retryable: true,
          message: expect.any(String),
        },
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
