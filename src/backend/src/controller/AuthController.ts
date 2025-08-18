import { Request, Response } from 'express';
import { AuthService, LoginCredentials } from '../service/AuthService';

export class AuthController {
  
  /**
   * Login de usuario
   * POST /auth/login
   */
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const credentials: LoginCredentials = {
        username: req.body.username || req.query.username as string,
        password: req.body.password || req.query.password as string
      };

      console.log('Login attempt received:', {
        username: credentials.username,
        hasPassword: !!credentials.password
      });

      // Validar que se envíen username y password
      if (!credentials.username || !credentials.password) {
        return res.status(400).json({
          success: false,
          message: 'Usuario y contraseña son requeridos',
          type: 'validation_error'
        });
      }

      // Validar que no estén vacíos
      if (credentials.username.trim() === '' || credentials.password.trim() === '') {
        return res.status(400).json({ 
          success: false,
          message: 'Usuario y contraseña no pueden estar vacíos',
          type: 'validation_error'
        });
      }

      console.log('Attempting authentication for user:', credentials.username);

      // Autenticar usuario
      const result = await AuthService.authenticate(credentials);

      console.log('Authentication result:', {
        success: result.success,
        message: result.message
      });

      if (!result.success) {
        // Mensajes más específicos según el tipo de error
        if (result.message?.includes('Usuario no encontrado')) {
          return res.status(401).json({
            success: false,
            message: 'El usuario ingresado no existe en nuestro sistema',
            type: 'user_not_found'
          });
        } else if (result.message?.includes('Contraseña incorrecta')) {
          return res.status(401).json({
            success: false,
            message: 'La contraseña ingresada es incorrecta',
            type: 'invalid_password'
          });
        } else {
          return res.status(401).json({
            success: false,
            message: 'Usuario o contraseña incorrectos',
            type: 'invalid_credentials'
          });
        }
      }

      // Actualizar último login (opcional)
      if (result.user) {
        console.log('Authentication successful for user ID:', result.user.id);
        await AuthService.updateLastLogin(result.user.id);
      }

      return res.status(200).json({
        success: true,
        user: result.user,
        token: result.token,
        message: 'Autenticación exitosa'
      });

    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        type: 'server_error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Obtener información del usuario actual
   * GET /auth/me
   */
  static async getCurrentUser(req: Request, res: Response): Promise<Response> {
    try {
      // El usuario ya está disponible por el middleware de autenticación
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      return res.status(200).json({
        success: true,
        user: req.user,
        message: 'Información del usuario obtenida exitosamente'
      });
    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Logout 
   * POST /auth/logout
   */
  static async logout(req: Request, res: Response): Promise<Response> {
    try {
      // En un sistema JWT stateless, el logout se maneja del lado del cliente
      // eliminando el token del localStorage/sessionStorage
      
      return res.status(200).json({
        success: true,
        message: 'Logout exitoso. Token debe ser eliminado del cliente.'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Validar token
   * POST /auth/validate
   */
  static async validateToken(req: Request, res: Response): Promise<Response> {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token es requerido'
        });
      }

      try {
        const decoded = AuthService.verifyToken(token);
        const user = await AuthService.getUserById(decoded.id);

        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'Usuario no encontrado'
          });
        }

        return res.status(200).json({
          success: true,
          valid: true,
          user: user,
          message: 'Token válido'
        });

      } catch (tokenError) {
        return res.status(401).json({
          success: false,
          valid: false,
          message: 'Token inválido o expirado'
        });
      }

    } catch (error) {
      console.error('Error validando token:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Refresh token (opcional)
   * POST /auth/refresh
   */
  static async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json({
        success: true,
        message: 'Refresh token funcionando (pendiente implementar)'
      });
    } catch (error) {
      console.error('Error en refresh token:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Cambiar contraseña
   * POST /auth/change-password
   */
  static async changePassword(req: Request, res: Response): Promise<Response> {
    try {
      return res.status(200).json({
        success: true,
        message: 'Change password funcionando (pendiente implementar)'
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}