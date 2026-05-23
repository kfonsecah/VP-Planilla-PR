import { Request, Response } from 'express';
import { AuthService, LoginCredentials } from '../service/AuthService';

export class AuthController {

  private static buildAuthError(
    status: 400 | 401 | 403,
    code:
      | 'AUTH_TOKEN_MISSING'
      | 'AUTH_TOKEN_INVALID'
      | 'AUTH_TOKEN_EXPIRED'
      | 'AUTH_TOKEN_REVOKED',
    message: string,
  ): {
    success: false;
    error: { code: string; message: string; status: 400 | 401 | 403; retryable: boolean };
  } {
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
   * Login de usuario
   * POST /auth/login
   */
  static async login(req: Request, res: Response): Promise<Response> {
    try {
      const credentials: LoginCredentials = {
        username: req.body.username,
        password: req.body.password
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

      const refreshToken = result.user
        ? AuthService.issueRefreshToken({
            id: result.user.id,
            username: result.user.username,
            role: result.user.role,
          })
        : undefined;

      return res.status(200).json({
        success: true,
        user: result.user,
        token: result.token,
        refresh_token: refreshToken,
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
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

      if (!token) {
        return res
          .status(401)
          .json(AuthController.buildAuthError(401, 'AUTH_TOKEN_MISSING', 'Token de acceso requerido'));
      }

      try {
        const decoded = AuthService.verifyToken(token);
        const expiresAt = new Date(decoded.exp * 1000);

        await AuthService.addTokenToBlocklist(token, expiresAt);
      } catch (tokenError) {
        if (tokenError instanceof Error && tokenError.name === 'TokenExpiredError') {
          return res.status(200).json({
            success: true,
            message: 'Sesión cerrada exitosamente',
          });
        }

        return res
          .status(401)
          .json(AuthController.buildAuthError(401, 'AUTH_TOKEN_INVALID', 'Token inválido'));
      }

      return res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente'
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
      const { refresh_token } = req.body as { refresh_token?: string };

      if (!refresh_token || refresh_token.trim() === '') {
        return res
          .status(400)
          .json(AuthController.buildAuthError(400, 'AUTH_TOKEN_MISSING', 'refresh_token es requerido'));
      }

      let decoded: { id: number; username?: string; role?: string; exp: number };

      try {
        decoded = AuthService.verifyRefreshToken(refresh_token);
      } catch (tokenError) {
        if (tokenError instanceof Error && tokenError.name === 'TokenExpiredError') {
          return res
            .status(401)
            .json(AuthController.buildAuthError(401, 'AUTH_TOKEN_EXPIRED', 'Refresh token expirado'));
        }

        return res
          .status(401)
          .json(AuthController.buildAuthError(401, 'AUTH_TOKEN_INVALID', 'Refresh token inválido'));
      }

      // Rechazar refresh tokens ya usados (detectar reutilización de tokens rotados)
      const isBlocklisted = await AuthService.isTokenBlocklisted(refresh_token);
      if (isBlocklisted) {
        return res
          .status(401)
          .json(AuthController.buildAuthError(401, 'AUTH_TOKEN_REVOKED', 'Refresh token ya fue utilizado'));
      }

      const user = await AuthService.getUserById(decoded.id);

      if (!user) {
        return res
          .status(401)
          .json(AuthController.buildAuthError(401, 'AUTH_TOKEN_INVALID', 'Usuario no encontrado'));
      }

      // Invalidar el refresh token usado (rotación)
      await AuthService.addTokenToBlocklist(refresh_token, new Date(decoded.exp * 1000));

      const token = AuthService.issueAccessToken({
        id: user.id,
        username: user.username,
        role: user.role,
      });

      const newRefreshToken = AuthService.issueRefreshToken({
        id: user.id,
        username: user.username,
        role: user.role,
      });

      return res.status(200).json({
        success: true,
        token,
        refresh_token: newRefreshToken,
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
   * Request password change (step 1)
   * POST /api/auth/password-request
   */
  static async requestPasswordChange(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      // Validate email
      if (!email || typeof email !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Email es requerido'
        });
      }

      // Basic email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email invalido'
        });
      }

      const result = await AuthService.requestPasswordChange(email);

      // Always return 200 to prevent email enumeration
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error requesting password change:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Confirm password change (step 2)
   * POST /api/auth/password-confirm
   */
  static async confirmPasswordChange(req: Request, res: Response): Promise<Response> {
    try {
      const { code, new_password } = req.body;

      // Validate inputs
      if (!code || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'Codigo y nueva contrasena son requeridos'
        });
      }

      const result = await AuthService.confirmPasswordChange(code, new_password);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error confirming password change:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}
