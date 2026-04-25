import { prisma } from '../lib/prisma';
import { ClockAlias } from '../model/clockAlias';

/**
 * Normalizes an alias name for consistent storage and lookup.
 * Must match the normalizeAliasName function in ClockAliasSchema.ts exactly.
 */
function normalizeAliasName(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Maps a raw Prisma vpg_clock_aliases row to the ClockAlias interface.
 */
function mapAlias(row: {
  aliases_id: number;
  aliases_employee_id: number;
  aliases_name: string;
  aliases_created_at: Date;
  aliases_version: number;
}): ClockAlias {
  return {
    id: row.aliases_id,
    employee_id: row.aliases_employee_id,
    name: row.aliases_name,
    created_at: row.aliases_created_at,
    version: row.aliases_version,
  };
}

export class ClockAliasService {
  /**
   * Creates a new clock alias for an employee.
   * @param employeeId - Employee ID (from URL param, already validated as positive int)
   * @param aliasName - Raw alias name — will be normalized before storage
   * @returns Created ClockAlias
   * @throws Error('ALIAS_DUPLICATE') if alias already registered for this employee
   */
  static async create(employeeId: number, aliasName: string): Promise<ClockAlias> {
    const normalized = normalizeAliasName(aliasName);

    const existing = await prisma.vpg_clock_aliases.findFirst({
      where: { aliases_employee_id: employeeId, aliases_name: normalized },
    });
    if (existing) {
      throw new Error('ALIAS_DUPLICATE');
    }

    const created = await prisma.vpg_clock_aliases.create({
      data: {
        aliases_employee_id: employeeId,
        aliases_name: normalized,
        aliases_version: 1,
      },
    });
    return mapAlias(created);
  }

  /**
   * Gets all aliases for a given employee.
   * @param employeeId - Employee ID to filter by
   * @returns Array of ClockAlias sorted by name ascending
   */
  static async getAll(employeeId: number): Promise<ClockAlias[]> {
    const rows = await prisma.vpg_clock_aliases.findMany({
      where: { aliases_employee_id: employeeId },
      orderBy: { aliases_name: 'asc' },
    });
    return rows.map(mapAlias);
  }

  /**
   * Gets a single alias by its ID.
   * @param aliasId - Alias primary key
   * @returns ClockAlias or null if not found
   */
  static async getById(aliasId: number): Promise<ClockAlias | null> {
    const row = await prisma.vpg_clock_aliases.findUnique({
      where: { aliases_id: aliasId },
    });
    return row ? mapAlias(row) : null;
  }

  /**
   * Hard-deletes an alias.
   * @param aliasId - Alias primary key
   * @throws Error('ALIAS_NOT_FOUND') if the alias does not exist
   */
  static async delete(aliasId: number): Promise<void> {
    const existing = await prisma.vpg_clock_aliases.findUnique({
      where: { aliases_id: aliasId },
    });
    if (!existing) {
      throw new Error('ALIAS_NOT_FOUND');
    }
    await prisma.vpg_clock_aliases.delete({
      where: { aliases_id: aliasId },
    });
  }

  /**
   * Resolves an employee ID by their alias name.
   * Used by ClockLogsImportService.resolveEmployeeId() as second lookup step.
   * @param aliasName - Raw name from import (will be normalized before lookup)
   * @returns employee_id or null if no alias matches
   */
  static async resolveEmployeeByAlias(aliasName: string): Promise<number | null> {
    const normalized = normalizeAliasName(aliasName);
    const alias = await prisma.vpg_clock_aliases.findFirst({
      where: { aliases_name: normalized },
      select: { aliases_employee_id: true },
    });
    return alias?.aliases_employee_id ?? null;
  }
}