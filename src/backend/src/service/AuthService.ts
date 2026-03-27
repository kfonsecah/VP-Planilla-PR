import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../model/user';

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
      const token = this.generateToken(authenticatedUser);

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
  private static generateToken(user: AuthenticatedUser): string {
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
  static verifyToken(token: string): any {
    try {
      const secret = process.env.JWT_SECRET || 'your-default-secret-key';
      return jwt.verify(token, secret);
    } catch (error) {
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
    try {
      console.log(`Usuario ${userId} hizo login en ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error actualizando último login:', error);
    }
  }

  /**
   * Cierra la conexión a la base de datos
   */
  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }
}