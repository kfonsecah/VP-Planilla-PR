import { prisma } from '../lib/prisma';
import type { vpg_users } from "@prisma/client";

export interface RoleDefinition {
  key: string;
  label: string;
  description: string;
  permissions: string[];
}

export interface UserPermissionSummary {
  id: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  roleLabel: string;
  roleDescription: string;
  permissions: string[];
}

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    key: "admin",
    label: "Administrador",
    description: "Acceso total al sistema y configuraciones globales.",
    permissions: [
      "Gestionar usuarios y permisos",
      "Configurar catálogos y parámetros",
      "Procesar planillas completas",
      "Consultar reportes y bitácoras",
    ],
  },
  {
    key: "supervisor",
    label: "Supervisor",
    description: "Supervisa procesos operativos sin acceso a ajustes críticos.",
    permissions: [
      "Aprobar vacaciones y ausencias",
      "Gestionar deducciones y bonos",
      "Consultar reportes oficiales",
      "Ver auditoría básica",
    ],
  },
  {
    key: "analyst",
    label: "Analista de Nómina",
    description: "Gestiona la operativa de nómina y reportes oficiales.",
    permissions: [
      "Procesar periodos de nómina",
      "Cargar marcaciones y novedades",
      "Generar reportes CCSS / Hacienda",
      "Ver empleados y posiciones",
    ],
  },
  {
    key: "viewer",
    label: "Consulta",
    description: "Solo lectura de módulos operativos y reportes.",
    permissions: [
      "Consultar empleados y posiciones",
      "Revisar planillas calculadas",
      "Descargar reportes asignados",
    ],
  },
];

const findRoleDefinition = (role?: string) =>
  ROLE_DEFINITIONS.find(
    (definition) => definition.key === (role || "").toLowerCase().trim()
  );

const buildFullName = (user: vpg_users) => {
  const parts = [
    user.user_first_name,
    user.user_middle_name,
    user.user_last_name,
  ].filter(Boolean);
  return parts.join(" ").replace(/\s+/g, " ").trim();
};

const fallbackRoleLabel = (role: string) => {
  if (!role) return "Sin rol";
  const sanitized = role.replace(/[_-]+/g, " ").toLowerCase();
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
};

export class UserService {
  static getRoleCatalog(): RoleDefinition[] {
    return ROLE_DEFINITIONS;
  }

  private static mapUser(user: vpg_users): UserPermissionSummary {
    const roleDef = findRoleDefinition(user.user_role);

    return {
      id: user.user_id,
      fullName: buildFullName(user),
      email: user.user_email,
      username: user.user_username,
      role: user.user_role,
      roleLabel: roleDef?.label ?? fallbackRoleLabel(user.user_role),
      roleDescription:
        roleDef?.description ?? "Rol personalizado sin catálogo definido.",
      permissions: roleDef?.permissions ?? [],
    };
  }

  static async listUsers(): Promise<UserPermissionSummary[]> {
    const users = await prisma.vpg_users.findMany({
      orderBy: [{ user_role: "asc" }, { user_first_name: "asc" }],
    });

    return users.map((user) => this.mapUser(user));
  }

  static async updatePermissions(
    userId: number,
    role: string,
    actorId?: number
  ): Promise<UserPermissionSummary> {
    const normalizedRole = (role || "").toLowerCase().trim();
    const roleDef = findRoleDefinition(normalizedRole);

    if (!roleDef) {
      const error: any = new Error("Rol inválido para asignar permisos");
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await prisma.vpg_users.findUnique({
      where: { user_id: userId },
    });

    if (!existingUser) {
      const error: any = new Error("Usuario no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const updatedUser = await prisma.vpg_users.update({
      where: { user_id: userId },
      data: {
        user_role: normalizedRole,
        user_version: { increment: 1 },
      },
    });

    if (actorId) {
      await prisma.vpg_audit_logs.create({
        data: {
          audit_logs_user_id: actorId,
          audit_logs_action: "UPDATE_PERMISSIONS",
          audit_logs_entity: "vpg_users",
          audit_logs_entity_id: userId,
          audit_logs_timestamp: new Date(),
          audit_logs_details: JSON.stringify({
            previousRole: existingUser.user_role,
            newRole: normalizedRole,
          }),
        },
      });
    }

    return this.mapUser(updatedUser);
  }
}
