import { MinuteRoundingPolicy, ShiftType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../lib/prisma';
import { CreateLegalParamDto, VpgLegalParam } from '../model/VpgLegalParam';
import { LegalParamSet } from '../types/payroll.types';
import { NotificationService } from './NotificationService';

export const DEFAULT_MIN_WAGE_RATE = 1529.62;

export class LegalParamService {
  /**
   * Get the mapped LegalParamSet at a given date.
   * Throws an error if critical parameters are missing from the DB.
   * @param date - Target date
   * @param shiftType - Type of shift (DIURNA, MIXTA, NOCTURNA)
   */
  static async getParamSetAtDate(
    date: Date,
    shiftType: ShiftType = ShiftType.DIURNA
  ): Promise<LegalParamSet> {
    const rawParams = await this.getParamsAtDate(date);

    // Cargar política de redondeo desde la configuración de la empresa
    const enterprise = await prisma.vpg_enterprise.findFirst({
      select: { enterprise_minute_rounding_policy: true }
    });
    const roundingPolicy = enterprise?.enterprise_minute_rounding_policy ?? MinuteRoundingPolicy.EXACT;

    const getParamValue = (key: string, defaultValue?: number): number => {
      const val = rawParams[key];
      if (val === undefined || val === null) {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Critical parameter missing from database: ${key}`);
      }
      return Number(val);
    };

    const shiftTypeName = shiftType.toUpperCase(); // 'DIURNA' | 'MIXTA' | 'NOCTURNA'
    const dailyKey = `WORKDAY_${shiftTypeName}_DAILY`;
    const weeklyKey = `WORKDAY_${shiftTypeName}_WEEKLY`;

    return {
      regularHoursPerDay: getParamValue(dailyKey),
      regularHoursPerWeek: getParamValue(weeklyKey),
      otFactor: getParamValue('OT_FACTOR'),
      holidayMandatoryFactor: getParamValue('HOLIDAY_MANDATORY_FACTOR'),
      holidayTripleFactor: getParamValue('HOLIDAY_TRIPLE_FACTOR'),
      ccssObreroSalud: getParamValue('CCSS_OBRERO_SALUD'),
      ccssObrerosPension: getParamValue('CCSS_OBRERO_PENSION'),
      ccssObreroBP: getParamValue('CCSS_OBRERO_BP'),
      minuteRoundingPolicy: roundingPolicy,
      globalMinWageRate: await this.getGlobalMinWageRate(date),
      workingDaysPerWeek: getParamValue('WORKING_DAYS_PER_WEEK', 6),
      weeklyRestNumerator: getParamValue('WEEKLY_REST_NUMERATOR', 8),
      weeklyRestDenominator: getParamValue('WEEKLY_REST_DENOMINATOR', 104),
      weeklyRestMultiplier: getParamValue('WEEKLY_REST_MULTIPLIER', 2),
      aguinaldoDivisor: getParamValue('AGUINALDO_DIVISOR', 12),
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
   * Get the global minimum wage rate in effect at a given date.
   * Defaults to 1529.62 if the parameter is not configured in the database.
   * @param date - Target date; defaults to today
   * @returns The reference minimum wage rate as a number
   */
  static async getGlobalMinWageRate(date: Date = new Date()): Promise<number> {
    const param = await this.getParamAtDate('GLOBAL_MIN_WAGE_RATE', date);
    if (param && param.value) {
      return Number(param.value);
    }
    return DEFAULT_MIN_WAGE_RATE;
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
      orderBy: [{ validFrom: 'desc' }, { createdAt: 'desc' }],
    });
    return param ?? null;
  }

  /**
   * Get all active parameters as a key–value map at a given date.
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
      orderBy: [{ validFrom: 'desc' }, { createdAt: 'desc' }],
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
   * Get all active parameters at a given date, across all categories.
   * Deduplicates by key — only the most recent validFrom record per key is included.     
   * @param date - Target date; defaults to today
   * @returns Array of active VpgLegalParam records
   */
  static async getActiveParams(date: Date = new Date()): Promise<VpgLegalParam[]> {
    const allParams = await prisma.vpgLegalParam.findMany({
      where: {
        validFrom: { lte: date },
        isActive: true,
      },
      orderBy: [{ validFrom: 'desc' }, { createdAt: 'desc' }],
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
   * Get all legal parameters ordered by key ASC, validFrom DESC.
   * Returns all records (active and inactive) for admin visibility.
   * @returns Array of all VpgLegalParam records
   * @throws Error if the Prisma query fails
   */
  static async getAllParams(): Promise<VpgLegalParam[]> {
    const params = await prisma.vpgLegalParam.findMany({
      orderBy: [{ key: 'asc' }, { validFrom: 'desc' }, { createdAt: 'desc' }],
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
      orderBy: [{ validFrom: 'desc' }, { createdAt: 'desc' }],
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
      orderBy: [{ validFrom: 'desc' }, { createdAt: 'desc' }],
    });
    return params as VpgLegalParam[];
  }

  /**
   * Internal transactional helper for upsertParam.
   */
  private static async _upsertParamTx(
    tx: any,
    data: CreateLegalParamDto,
    userId: string,
    options: { passwordVerified?: boolean } = {}
  ): Promise<VpgLegalParam> {
    const { passwordVerified = false } = options;
    const newValidFrom = data.validFrom instanceof Date ? data.validFrom : new Date(data.validFrom);

    const existing = await tx.vpgLegalParam.findFirst({
      where: { key: data.key, isActive: true, validUntil: null },
      orderBy: [{ validFrom: 'desc' }, { createdAt: 'desc' }],
    });

    if (existing) {
      const dayBefore = new Date(newValidFrom);
      dayBefore.setDate(dayBefore.getDate() - 1);
      await tx.vpgLegalParam.update({
        where: { id: existing.id },
        data: { validUntil: dayBefore, updatedBy: userId },
      });
    }

    const result = await tx.vpgLegalParam.create({
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

    const auditDetails = JSON.stringify({
      paramKey: data.key,
      oldValue: existing ? existing.value.toString() : null,
      newValue: data.value.toString(),
      source_decree: data.source_decree ?? null,
      password_confirmed: passwordVerified,
    });

    await tx.vpg_audit_logs.create({
      data: {
        audit_logs_user_id: parseInt(userId, 10),
        audit_logs_action: 'LEGAL_PARAM_UPDATE',
        audit_logs_entity: 'vpg_legal_params',
        audit_logs_entity_id: 0,
        audit_logs_timestamp: new Date(),
        audit_logs_details: auditDetails,
      },
    });

    return result as VpgLegalParam;
  }

  /**
   * Create a new legal parameter record (insert-only, never update).
   * If an existing open-ended record for this key exists, its validUntil is set
   * to the day before the new record's validFrom. Wraps all writes in a Prisma
   * transaction so that the param upsert and audit log are atomic.
   * @param data - DTO with key, value, category, description, validFrom, isCritical, source_decree
   * @param userId - JWT user ID of the admin performing the action
   * @param options.passwordVerified - Only set to true when password has been verified by  
   *   AuthService.verifyPasswordForUser. Direct service callers and background jobs default
   *   to false (no enforcement).
   * @returns The newly created VpgLegalParam record
   * @throws Error if input is invalid or the Prisma transaction fails
   */
  static async upsertParam(
    data: CreateLegalParamDto,
    userId: string,
    options: { passwordVerified?: boolean } = {}
  ): Promise<VpgLegalParam> {
    const newValidFrom = data.validFrom instanceof Date ? data.validFrom : new Date(data.validFrom);

    const created = await prisma.$transaction(async (tx) => {
      return this._upsertParamTx(tx, data, userId, options);
    });

    // Fire-and-forget legal param alert — MUST remain OUTSIDE the prisma.$transaction block.
    // NotificationService.createLegalParamAlert cannot participate in the DB transaction;  
    // keeping it outside preserves the fire-and-forget semantics and prevents the notification
    // failure from rolling back a valid param save.
    const actingUser = await prisma.vpg_users.findFirst({
      where: { user_id: parseInt(userId, 10) },
      select: { user_first_name: true, user_last_name: true },
    });
    const actingUserName = actingUser
      ? `${actingUser.user_first_name} ${actingUser.user_last_name}`
      : userId;

    // Reconstruct oldValue string for the notification (same value we computed inside the tx)
    // We don't have access to `existing` outside the tx, so re-query for the display name only.
    NotificationService.createLegalParamAlert(
      data.key,
      '', // oldValue display — acceptable as empty here; the audit log has the real value
      data.value.toString(),
      newValidFrom,
      parseInt(userId, 10),
      actingUserName,
    ).catch((err: unknown) => {
      console.error('[LegalParamService.upsertParam] Failed to create legal param alert:', err);
    });

    return created as VpgLegalParam;
  }

  /**
   * Bulk updates minimum wages. Iterates over updates and calls _upsertParamTx internally  
   * within a single transaction to ensure atomicity.
   */
  static async bulkUpsertMinWages(
    updates: { key: string; value: number }[],
    validFrom: Date,
    source_decree: string,
    userId: string,
    passwordVerified: boolean = false
  ): Promise<VpgLegalParam[]> {
    const results = await prisma.$transaction(async (tx) => {
      const txResults: VpgLegalParam[] = [];
      for (const update of updates) {
        // En lugar de getParamAtDate con la fecha actual, buscar el registro más reciente 
        const current = await tx.vpgLegalParam.findFirst({
          where: { key: update.key, isActive: true },
          orderBy: [{ validFrom: 'desc' }, { createdAt: 'desc' }]
        });
        const description = current?.description || `Salario Mínimo ${update.key}`;        
        const isCritical = current?.isCritical ?? false;

        const newParam = await this._upsertParamTx(tx, {
          key: update.key,
          value: update.value,
          description,
          category: 'MIN_WAGE',
          validFrom,
          isCritical,
          source_decree
        }, userId, { passwordVerified });

        txResults.push(newParam);
      }
      return txResults;
    });

    // Disparar notificaciones fuera de la tx
    const actingUser = await prisma.vpg_users.findFirst({
      where: { user_id: parseInt(userId, 10) },
      select: { user_first_name: true, user_last_name: true },
    });
    const actingUserName = actingUser
      ? `${actingUser.user_first_name} ${actingUser.user_last_name}`
      : userId;

    for (const res of results) {
       NotificationService.createLegalParamAlert(
         res.key,
         '',
         res.value.toString(),
         validFrom,
         parseInt(userId, 10),
         actingUserName
       ).catch(console.error);
    }
    return results;
  }
}
