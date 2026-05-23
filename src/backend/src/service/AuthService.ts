import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../model/user';
import { EmailService } from './EmailService';
import { env } from '../config/env';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthenticatedUser {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  role: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthenticatedUser;
  token?: string;
  message?: string;
}

export class AuthService {
  
  /**
   * Autentica un usuario con username y password
   */
  static async authenticate(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { username, password } = credentials;

      console.log('Authenticating user:', username);

      // Buscar usuario por username usando el modelo User
      const dbUser = await prisma.vpg_users.findFirst({
        where: {
          user_username: username
        }
      });

      console.log('User found:', dbUser ? 'Yes' : 'No');

      // Verificar si el usuario existe
      if (!dbUser) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      // Mapear campos de snake_case a camelCase para el modelo User
      const user: User = {
        id: dbUser.user_id,
        first_name: dbUser.user_first_name,
        last_name: dbUser.user_last_name,
        middle_name: dbUser.user_middle_name,
        national_id: dbUser.user_national_id,
        email: dbUser.user_email,
        username: dbUser.user_username,
        password: dbUser.user_password,
        role: dbUser.user_role,
        version: dbUser.user_version
      };

      console.log('Verifying password for user:', user.username);

      // Verificar la contraseña
      const isPasswordValid = await this.verifyPassword(password, user.password);
      
      console.log('Password valid:', isPasswordValid);

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Contraseña incorrecta'
        };
      }

      // Crear datos del usuario autenticado (sin password) usando el modelo
      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        middle_name: user.middle_name,
        role: user.role
      };

      console.log('Generating token for user:', authenticatedUser.username);

      // Generar JWT token
      const token = this.issueAccessToken(authenticatedUser);

      return {
        success: true,
        user: authenticatedUser,
        token: token,
        message: 'Autenticación exitosa'
      };

    } catch (error) {
      console.error('Error en autenticación:', error);
      return {
        success: false,
        message: 'Error interno del servidor'
      };
    }
  }

  /**
   * Verifica la contraseña - soporta tanto bcrypt como texto plano
   */
  private static async verifyPassword(inputPassword: string, storedPassword: string): Promise<boolean> {
    try {
      // Verificar si la contraseña almacenada es un hash de bcrypt
      // Los hashes de bcrypt siempre empiezan con $2a$, $2b$, $2x$, o $2y$
      const isBcryptHash = /^\$2[abxy]?\$/.test(storedPassword);
      
      if (isBcryptHash) {
        // Es un hash de bcrypt, usar bcrypt.compare
        console.log('Using bcrypt verification');
        return await bcrypt.compare(inputPassword, storedPassword);
      } else {
        // Es texto plano, comparar directamente
        console.log('Using plain text verification');
        return inputPassword === storedPassword;
      }
    } catch (error) {
      console.error('Error verificando contraseña:', error);
      return false;
    }
  }

  /**
   * Genera un JWT access token para el usuario
   */
  static issueAccessToken(user: Pick<AuthenticatedUser, 'id' | 'username' | 'role'>): string {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    const secret = env.JWT_SECRET;
    const options: jwt.SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as any
    };

    return jwt.sign(payload, secret, options) as string;
  }

  /**
   * Genera un JWT refresh token para el usuario (expiración larga, secret separado)
   * @param user - Datos mínimos del usuario autenticado
   * @returns Refresh token firmado con JWT_REFRESH_SECRET
   */
  static issueRefreshToken(user: Pick<AuthenticatedUser, 'id' | 'username' | 'role'>): string {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      type: 'refresh',
    };

    const secret = env.JWT_REFRESH_SECRET ?? env.JWT_SECRET + ':refresh';
    const options: jwt.SignOptions = {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    };

    return jwt.sign(payload, secret, options) as string;
  }

  /**
   * Verifica un refresh token y retorna su payload decodificado
   * @param token - Refresh token a verificar
   * @returns Payload decodificado con id, username, role y exp
   * @throws TokenExpiredError si expiró, Error genérico si es inválido o no es refresh token
   */
  static verifyRefreshToken(token: string): { id: number; username?: string; role?: string; exp: number } {
    try {
      const secret = env.JWT_REFRESH_SECRET ?? env.JWT_SECRET + ':refresh';
      const decoded = jwt.verify(token, secret) as { id: number; username?: string; role?: string; exp: number; type?: string };

      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido');
      }

      return decoded;
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        const tokenExpiredError = new Error('Token expirado');
        tokenExpiredError.name = 'TokenExpiredError';
        throw tokenExpiredError;
      }
      throw new Error('Token inválido');
    }
  }

  /**
   * Verifica si un JWT token es válido
   */
  static verifyToken(token: string): { id: number; username?: string; role?: string; exp: number; iat?: number } {
    try {
      const secret = env.JWT_SECRET;
      return jwt.verify(token, secret) as { id: number; username?: string; role?: string; exp: number; iat?: number };
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        const tokenExpiredError = new Error('Token expirado');
        tokenExpiredError.name = 'TokenExpiredError';
        throw tokenExpiredError;
      }

      throw new Error('Token inválido');
    }
  }

  /**
   * Verifies that the supplied plain-text password matches the stored hash for the given user.
   * Used to enforce step-up authentication before mutating critical legal parameters.
   *
   * @param userId - The numeric user ID whose password to verify
   * @param plainPassword - The password supplied by the caller (never logged)
   * @returns true if the password matches, false otherwise (including if user not found)
   * @throws Never — all DB errors are caught and return false to avoid leaking user existence
   */
  static async verifyPasswordForUser(userId: string, plainPassword: string): Promise<boolean> {
    try {
      const user = await prisma.vpg_users.findUnique({
        where: { user_id: parseInt(userId, 10) },
        select: { user_password: true },
      });
      if (!user?.user_password) return false;
      return await bcrypt.compare(plainPassword, user.user_password);
    } catch {
      // Do NOT include plainPassword in any error log
      return false;
    }
  }

  /**
   * Obtiene información del usuario por ID (para middleware de autenticación)
   */
  static async getUserById(id: number): Promise<AuthenticatedUser | null> {
    try {
      const dbUser = await prisma.vpg_users.findUnique({
        where: { user_id: id }
      });

      if (!dbUser) {
        return null;
      }

      // Mapear campos de snake_case a camelCase para el modelo User
      const user: User = {
        id: dbUser.user_id,
        first_name: dbUser.user_first_name,
        last_name: dbUser.user_last_name,
        middle_name: dbUser.user_middle_name,
        national_id: dbUser.user_national_id,
        email: dbUser.user_email,
        username: dbUser.user_username,
        password: dbUser.user_password,
        role: dbUser.user_role,
        version: dbUser.user_version
      };

      // Convertir User a AuthenticatedUser (sin password)
      return {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        middle_name: user.middle_name,
        role: user.role
      };

    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }
  }

  /**
   * Obtiene usuario por username
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const dbUser = await prisma.vpg_users.findFirst({
        where: { user_username: username }
      });

      if (!dbUser) {
        return null;
      }

      const user: User = {
        id: dbUser.user_id,
        first_name: dbUser.user_first_name,
        last_name: dbUser.user_last_name,
        middle_name: dbUser.user_middle_name,
        national_id: dbUser.user_national_id,
        email: dbUser.user_email,
        username: dbUser.user_username,
        password: dbUser.user_password,
        role: dbUser.user_role,
        version: dbUser.user_version
      };

      return user;
    } catch (error) {
      console.error('Error obteniendo usuario por username:', error);
      return null;
    }
  }

  /**
   * Hash de contraseña para crear usuarios
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Valida las credenciales sin generar token (útil para validaciones)
   */
  static async validateCredentials(credentials: LoginCredentials): Promise<User | null> {
    try {
      const { username, password } = credentials;

      const user: User | null = await this.getUserByUsername(username);

      if (!user) {
        return null;
      }

      const isPasswordValid = await this.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error validando credenciales:', error);
      return null;
    }
  }

  /**
   * Actualiza la última fecha de login del usuario
   */
  static async updateLastLogin(userId: number): Promise<void> {
    await prisma.vpg_users.update({
      where: { user_id: userId },
      data: { user_last_login: new Date() },
    });
  }

  /**
   * Cierra la conexión a la base de datos
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }

  /**
   * Agrega un token a la blocklist de logout
   */
  static async addTokenToBlocklist(token: string, expiresAt: Date): Promise<void> {
    try {
      await prisma.vpg_token_blocklist.create({
        data: {
          blocklist_token: token,
          blocklist_expires: expiresAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }

      throw error;
    }
  }

  /**
   * Verifica si un token está en la blocklist
   */
  static async isTokenBlocklisted(token: string): Promise<boolean> {
    const found = await prisma.vpg_token_blocklist.findFirst({
      where: {
        blocklist_token: token,
        blocklist_expires: {
          gt: new Date(),
        },
      },
    });
    return !!found;
  }

  /**
   * Limpia tokens expirados de la blocklist
   */
  static async cleanupExpiredTokens(): Promise<void> {
    await prisma.vpg_token_blocklist.deleteMany({
      where: {
        blocklist_expires: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Request password change - generates 6-digit code and sends via email
   */
  static async requestPasswordChange(email: string): Promise<{ success: boolean; message: string }> {
    // Find user by email (using findFirst since email is not unique)
    const user = await prisma.vpg_users.findFirst({
      where: { user_email: email }
    });

    if (!user) {
      // Return success even if user not found (prevent email enumeration)
      return { success: true, message: 'If the email exists, a code has been sent' };
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash code with bcrypt (cost 3 for speed since codes are short-lived)
    const hashedCode = await bcrypt.hash(code, 3);

    // Set expiration to 15 minutes from now
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Store in DB
    await prisma.vpg_password_change_request.create({
      data: {
        pcr_user_id: user.user_id,
        pcr_code: hashedCode,
        pcr_expires: expires
      }
    });

    // Send email with code using EmailService
    const emailService = new EmailService();
    await emailService.sendEmail({
      to: user.user_email,
      subject: 'Código de verificación - Verde Gestión',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #FCF1D5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF1D5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(59, 77, 54, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3B4D36 0%, #2D3A28 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: #D4BD80; margin: 0; font-size: 24px; font-weight: bold;">VERDE GESTIÓN</h1>
              <p style="color: #8B7D5E; margin: 5px 0 0 0; font-size: 12px;">Sistema de Planilla</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #3B4D36; margin: 0 0 20px 0; font-size: 18px;">Código de verificación</h2>
              <p style="color: #4A5D3A; font-size: 14px; line-height: 1.6;">
                Has solicitado un código para cambiar tu contraseña. Utiliza el siguiente código:
              </p>
              <div style="background-color: #FCF1D5; border: 2px dashed #D4C89A; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #3B4D36; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #8B7D5E; font-size: 12px;">
                Este código <strong>expira en 15 minutos</strong>.
              </p>
              <p style="color: #8B7D5E; font-size: 12px; margin-top: 20px;">
                Si no solicitaste este cambio, puedes ignorar este correo.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="color: #8B7D5E; font-size: 11px; margin: 0;">
                © ${new Date().getFullYear()} Verde Gestión — Control de planilla
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
    });

    return { success: true, message: 'Code sent to email' };
  }

  /**
   * Confirm password change with verification code
   */
  static async confirmPasswordChange(code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Validate inputs
    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return { success: false, message: 'Invalid code format' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters' };
    }

    // Find valid (not used, not expired) request
    const request = await prisma.vpg_password_change_request.findFirst({
      where: {
        pcr_used: false,
        pcr_expires: { gt: new Date() }
      },
      orderBy: { pcr_created: 'desc' }
    });

    if (!request) {
      return { success: false, message: 'Invalid or expired code' };
    }

    // Verify code
    const isValid = await bcrypt.compare(code, request.pcr_code);
    if (!isValid) {
      return { success: false, message: 'Invalid code' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.vpg_users.update({
      where: { user_id: request.pcr_user_id },
      data: { user_password: hashedPassword }
    });

    // Mark code as used
    await prisma.vpg_password_change_request.update({
      where: { pcr_id: request.pcr_id },
      data: { pcr_used: true }
    });

    return { success: true, message: 'Password changed successfully' };
  }
}
