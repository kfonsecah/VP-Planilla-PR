import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../model/user';
import { EmailService } from './EmailService';

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
   * Genera un JWT token para el usuario
   */
  static issueAccessToken(user: Pick<AuthenticatedUser, 'id' | 'username' | 'role'>): string {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    const secret = process.env.JWT_SECRET || 'your-default-secret-key';
    const options: jwt.SignOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN ? Number(process.env.JWT_EXPIRES_IN) : 24 * 60 * 60 // 24 horas por defecto
    };

    return jwt.sign(payload, secret, options) as string;
  }

  /**
   * Verifica si un JWT token es válido
   */
  static verifyToken(token: string): { id: number; username?: string; role?: string; exp: number; iat?: number } {
    try {
      const secret = process.env.JWT_SECRET || 'your-default-secret-key';
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
      subject: 'Codigo de verificacion para cambio de contrasena',
      html: `<p>Su codigo de verificacion es: <strong>${code}</strong></p>
             <p>Este codigo expira en 15 minutos.</p>
             <p>Si no solicito este cambio, ignore este correo.</p>`
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
