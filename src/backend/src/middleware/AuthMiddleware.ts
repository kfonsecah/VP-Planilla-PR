import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../service/AuthService';
import { User } from '../model/user';

// Extender el tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export class AuthMiddleware {
  /**
   * Build canonical authentication/authorization error payload
   */
  private static buildAuthError(
    status: 401 | 403,
    code:
      | 'AUTH_TOKEN_MISSING'
      | 'AUTH_TOKEN_INVALID'
      | 'AUTH_TOKEN_REVOKED'
      | 'AUTH_TOKEN_EXPIRED'
      | 'AUTH_INSUFFICIENT_SCOPE',
    message: string,
  ): { success: false; error: { code: string; message: string; status: 401 | 403; retryable: boolean } } {
    return {
      success: false,
      error: {
        code,
        message,
        status,
        retryable: status === 401,
      },
    };
  }
  
  /**
   * Middleware para verificar JWT token
   */
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res
          .status(401)
          .json(AuthMiddleware.buildAuthError(401, 'AUTH_TOKEN_MISSING', 'Token de acceso requerido'));
      }

      const token = authHeader.split(' ')[1]; // Bearer TOKEN
      
      if (!token) {
        return res
          .status(401)
          .json(AuthMiddleware.buildAuthError(401, 'AUTH_TOKEN_MISSING', 'Token de acceso requerido'));
      }

      // Verificar token
      const decoded = AuthService.verifyToken(token);

      // Check if token is blocklisted
      const isBlocklisted = await AuthService.isTokenBlocklisted(token);
      if (isBlocklisted) {
        return res
          .status(401)
          .json(AuthMiddleware.buildAuthError(401, 'AUTH_TOKEN_REVOKED', 'Token ha sido invalidado'));
      }

      // Obtener información completa del usuario
      const user = await AuthService.getUserById(decoded.id);
      
      if (!user) {
        return res
          .status(401)
          .json(AuthMiddleware.buildAuthError(401, 'AUTH_TOKEN_INVALID', 'Usuario no encontrado'));
      }

      // Agregar usuario al request
      req.user = user as User;
      next();

    } catch (error) {
      console.error('Error en middleware de autenticación:', error);

      if (error instanceof Error && error.name === 'TokenExpiredError') {
        return res
          .status(401)
          .json(AuthMiddleware.buildAuthError(401, 'AUTH_TOKEN_EXPIRED', 'Token expirado'));
      }

      return res
        .status(401)
        .json(AuthMiddleware.buildAuthError(401, 'AUTH_TOKEN_INVALID', 'Token inválido'));
    }
  }

  /**
   * Middleware para verificar roles específicos
   */
  static requireRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): Response | void => {
      if (!req.user) {
        return res
          .status(401)
          .json(AuthMiddleware.buildAuthError(401, 'AUTH_TOKEN_INVALID', 'Usuario no autenticado'));
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res
          .status(403)
          .json(
            AuthMiddleware.buildAuthError(
              403,
              'AUTH_INSUFFICIENT_SCOPE',
              'No tienes permisos para acceder a este recurso',
            ),
          );
      }

      next();
    };
  }

  /**
   * Middleware opcional para verificar token (no falla si no hay token)
   */
  static async optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        
        if (token) {
          try {
            const decoded = AuthService.verifyToken(token);
            const user = await AuthService.getUserById(decoded.id);
            
            if (user) {
              req.user = user as User;
            }
          } catch (error) {
            // Token inválido, pero no fallar
            console.log('Token opcional inválido:', error);
          }
        }
      }

      next();
    } catch (error) {
      next();
    }
  }
}
