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
   * Middleware para verificar JWT token
   */
  static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Token de acceso requerido'
        });
      }

      const token = authHeader.split(' ')[1]; // Bearer TOKEN
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token de acceso requerido'
        });
      }

      // Verificar token
      const decoded = AuthService.verifyToken(token);
      
      // Obtener información completa del usuario
      const user = await AuthService.getUserById(decoded.id);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Agregar usuario al request
      req.user = user as User;
      next();

    } catch (error) {
      console.error('Error en middleware de autenticación:', error);
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  }

  /**
   * Middleware para verificar roles específicos
   */
  static requireRole(allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): Response | void => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso'
        });
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