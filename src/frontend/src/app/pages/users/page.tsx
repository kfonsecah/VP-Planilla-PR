"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RoleDefinition,
  UserAccountSummary,
  UserService,
} from "@/services/userService";
import {
  ArrowPathIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  supervisor: "bg-amber-100 text-amber-800",
  analyst: "bg-sky-100 text-sky-800",
  viewer: "bg-emerald-100 text-emerald-800",
};

export default function UsersPermissionsPage() {
  const [users, setUsers] = useState<UserAccountSummary[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, roleCatalog] = await Promise.all([
        UserService.getUsers(),
        UserService.getRoleCatalog(),
      ]);
      setUsers(usersResponse);
      setRoles(roleCatalog);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los usuarios y permisos"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }, [filter, users]);

  const handleRoleChange = async (userId: number, newRole: string) => {
    setSavingUserId(userId);
    setError(null);
    try {
      const updated = await UserService.updatePermissions(userId, {
        role: newRole,
      });
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? updated : user))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el rol del usuario"
      );
    } finally {
      setSavingUserId(null);
    }
  };

  const roleOptions = roles.length
    ? roles
    : [
        {
          key: "admin",
          label: "Administrador",
          description: "",
          permissions: [],
        },
      ];

  return (
    <div className="p-6 space-y-6">
      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 border border-neutral-100 dark:border-gray-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-gray-400">
              Seguridad
            </p>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Usuarios y accesos
            </h1>
            <p className="text-neutral-500 dark:text-gray-400">
              Define qué módulos puede utilizar cada persona del sistema.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full md:w-auto">
            <div className="flex rounded-xl border border-neutral-200 dark:border-gray-600 overflow-hidden">
              <input
                type="text"
                placeholder="Buscar por nombre, usuario o correo"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="flex-1 px-4 py-2 focus:outline-none dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => void fetchData()}
                className="px-4 py-2 bg-neutral-900 dark:bg-gray-600 text-white text-sm flex items-center gap-2"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Actualizar
              </button>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {roleOptions.map((role) => (
          <div
            key={role.key}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-neutral-100 dark:border-gray-700 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-gray-400">
                  Perfil
                </p>
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">
                  {role.label}
                </h2>
              </div>
              <ShieldCheckIcon className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-gray-400 mb-3">{role.description}</p>
            <ul className="text-sm text-neutral-700 dark:text-gray-300 space-y-1">
              {role.permissions.map((permission) => (
                <li key={permission} className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-neutral-100 dark:border-gray-700">
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-neutral-500 dark:text-gray-400" />
            <div>
              <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-gray-400">
                Usuarios
              </p>
              <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                {users.length} registrados
              </p>
            </div>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-100 dark:divide-gray-700">
            <thead className="bg-neutral-50 dark:bg-gray-700 text-left text-xs font-semibold uppercase text-neutral-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Colaborador</th>
                <th className="px-6 py-3">Usuario</th>
                <th className="px-6 py-3">Rol asignado</th>
                <th className="px-6 py-3">Permisos efectivos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td className="px-6 py-6 text-center text-sm text-neutral-500 dark:text-gray-400" colSpan={4}>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-center text-sm text-neutral-500 dark:text-gray-400" colSpan={4}>
                    No hay usuarios que coincidan con el criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-neutral-900 dark:text-white">
                        {user.fullName || "Sin nombre"}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-gray-400">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm text-neutral-700 dark:text-gray-300">
                        {user.username}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            ROLE_COLORS[user.role] ||
                            "bg-neutral-100 dark:bg-gray-700 text-neutral-700 dark:text-gray-300"
                          }`}
                        >
                          {user.roleLabel}
                        </span>
                        <select
                          className="border border-neutral-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:bg-gray-700 dark:text-white"
                          value={user.role}
                          onChange={(event) =>
                            void handleRoleChange(user.id, event.target.value)
                          }
                          disabled={savingUserId === user.id}
                        >
                          {roleOptions.map((role) => (
                            <option key={role.key} value={role.key}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                        {savingUserId === user.id && (
                          <p className="text-xs text-neutral-500 dark:text-gray-400">
                            Guardando cambios...
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.permissions.length === 0 ? (
                          <span className="text-sm text-neutral-400 dark:text-gray-500">
                            Sin catálogo de permisos
                          </span>
                        ) : (
                          user.permissions.map((permission) => (
                            <span
                              key={permission}
                              className="inline-flex items-center px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-gray-700 text-xs text-neutral-700 dark:text-gray-300"
                            >
                              {permission}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
