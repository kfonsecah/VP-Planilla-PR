import { MinuteRoundingPolicy } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { CreateLegalParamDto, VpgLegalParam } from '../model/VpgLegalParam';
import { LegalParamSet } from '../types/payroll.types';

export class LegalParamService {
  /**
   * Get the mapped LegalParamSet at a given date.
   * Throws an error if critical parameters are missing from the DB.
   * @param date - Target date
   */
  static async getParamSetAtDate(date: Date): Promise<LegalParamSet> {
    const rawParams = await this.getParamsAtDate(date);

    // Cargar política de redondeo desde la configuración de la empresa
    const enterprise = await prisma.vpg_enterprise.findFirst({
      select: { enterprise_minute_rounding_policy: true }
    });
    const roundingPolicy = enterprise?.enterprise_minute_rounding_policy ?? MinuteRoundingPolicy.EXACT;
    
    const getParamValue = (key: string): number => {
      const val = rawParams[key];
      if (val === undefined || val === null) {
        throw new Error(`Critical parameter missing from database: ${key}`);
      }
      return Number(val);
    };

    return {
      regularHoursPerDay: 8, // TODO: Phase 66
      regularHoursPerWeek: 48, // TODO: Phase 66
      otFactor: getParamValue('OT_FACTOR'),
      holidayMandatoryFactor: getParamValue('HOLIDAY_MANDATORY_FACTOR'),
      holidayTripleFactor: getParamValue('HOLIDAY_TRIPLE_FACTOR'),
      ccssObreroSalud: getParamValue('CCSS_OBRERO_SALUD'),
      ccssObrerosPension: getParamValue('CCSS_OBRERO_PENSION'),
      ccssObreroBP: getParamValue('CCSS_OBRERO_BP'),
      minuteRoundingPolicy: roundingPolicy,
    };
  }
  /**
   * Get the effective Decimal value of a parameter at a given date.
   * @param key - Parameter key (e.g., "OT_FACTOR")
   * @param date - Target date; defaults to today
   * @returns The Decimal value, or null if no active parameter exists
   * @throws Error if the Prisma query fails
   */
  static async getParam(key: string, date: Date = new Date()): Promise<Decimal | null> {
    const param = await LegalParamService.getParamAtDate(key, date);
    return param?.value ?? null;
  }

  /**
   * Get the full VpgLegalParam record in effect at a given date.
   * Uses effective-date rule: most recent record where validFrom <= date and isActive = true.
   * @param key - Parameter key
   * @param date - Target date
   * @returns The VpgLegalParam record, or null if not found
   * @throws Error if the Prisma query fails
   */
  static async getParamAtDate(key: string, date: Date): Promise<VpgLegalParam | null> {
    const param = await prisma.vpgLegalParam.findFirst({
      where: {
        key,
        validFrom: { lte: date },
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    });
    return param ?? null;
  }

  /**
   * Get all active parameters as a key→value map at a given date.
   * Deduplicates by key — only the most recent validFrom record per key is included.
   * @param date - Target date
   * @returns Record<string, Decimal> mapping each key to its effective value
   * @throws Error if the Prisma query fails
   */
  static async getParamsAtDate(date: Date): Promise<Record<string, Decimal>> {
    const allParams = await prisma.vpgLegalParam.findMany({
      where: {
        validFrom: { lte: date },
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    });

    const recent: Record<string, VpgLegalParam> = {};
    for (const param of allParams) {
      if (!recent[param.key]) {
        recent[param.key] = param as VpgLegalParam;
      }
    }

    return Object.entries(recent).reduce(
      (acc, [key, param]) => {
        acc[key] = param.value;
        return acc;
      },
      {} as Record<string, Decimal>,
    );
  }

  /**
   * Get all legal parameters ordered by key ASC, validFrom DESC.
   * Returns all records (active and inactive) for admin visibility.
   * @returns Array of all VpgLegalParam records
   * @throws Error if the Prisma query fails
   */
  static async getAllParams(): Promise<VpgLegalParam[]> {
    const params = await prisma.vpgLegalParam.findMany({
      orderBy: [{ key: 'asc' }, { validFrom: 'desc' }],
    });
    return params as VpgLegalParam[];
  }

  /**
   * Get all active parameters for a specific category at a given date.
   * Returns only the most recent record per key within that category.
   * @param category - Category name (WORKDAY | OVERTIME | CCSS | MIN_WAGE | FEATURE_FLAG)
   * @param date - Target date; defaults to today
   * @returns Array of active VpgLegalParam records for the category (one per key)
   * @throws Error if the Prisma query fails
   */
  static async getAllParamsByCategory(
    category: string,
    date: Date = new Date(),
  ): Promise<VpgLegalParam[]> {
    const allParams = await prisma.vpgLegalParam.findMany({
      where: {
        category,
        validFrom: { lte: date },
        isActive: true,
      },
      orderBy: { validFrom: 'desc' },
    });

    const recent: Record<string, VpgLegalParam> = {};
    for (const param of allParams) {
      if (!recent[param.key]) {
        recent[param.key] = param as VpgLegalParam;
      }
    }
    return Object.values(recent);
  }

  /**
   * Get the full history for a single parameter key, ordered by validFrom DESC.
   * Returns all records (active and inactive) to support audit trail visibility.
   * @param key - Parameter key
   * @returns Array of VpgLegalParam records for that key
   * @throws Error if the Prisma query fails
   */
  static async getParamHistory(key: string): Promise<VpgLegalParam[]> {
    const params = await prisma.vpgLegalParam.findMany({
      where: { key },
      orderBy: { validFrom: 'desc' },
    });
    return params as VpgLegalParam[];
  }

  /**
   * Create a new legal parameter record (insert-only, never update).
   * If an existing open-ended record for this key exists, its validUntil is set
   * to the day before the new record's validFrom.
   * @param data - DTO with key, value, category, description, validFrom, isCritical, source_decree
   * @param userId - JWT user ID of the admin performing the action
   * @returns The newly created VpgLegalParam record
   * @throws Error if input is invalid or the Prisma transaction fails
   */
  static async upsertParam(data: CreateLegalParamDto, userId: string): Promise<VpgLegalParam> {
    const newValidFrom = data.validFrom instanceof Date ? data.validFrom : new Date(data.validFrom);

    // Close the most recent open-ended record for this key (validUntil = null)
    const existing = await prisma.vpgLegalParam.findFirst({
      where: { key: data.key, isActive: true, validUntil: null },
      orderBy: { validFrom: 'desc' },
    });

    if (existing) {
      const dayBefore = new Date(newValidFrom);
      dayBefore.setDate(dayBefore.getDate() - 1);
      await prisma.vpgLegalParam.update({
        where: { id: existing.id },
        data: { validUntil: dayBefore, updatedBy: userId },
      });
    }

    const created = await prisma.vpgLegalParam.create({
      data: {
        key: data.key,
        value: data.value,
        description: data.description,
        category: data.category,
        validFrom: newValidFrom,
        validUntil: null,
        isActive: true,
        isCritical: data.isCritical ?? false,
        source_decree: data.source_decree ?? null,
        createdBy: userId,
        updatedBy: null,
      },
    });

    return created as VpgLegalParam;
  }
}
