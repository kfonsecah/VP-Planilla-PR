import { z } from 'zod';
import { MinuteRoundingPolicy, ShiftType } from '@prisma/client';

export const updateEnterpriseSchema = z.object({
  enterprise_name: z.string().max(50).optional(),
  enterprise_minute_rounding_policy: z.nativeEnum(MinuteRoundingPolicy).optional(),
  enterprise_rounding_policy_acknowledged: z.boolean().optional(),
  enterprise_is_commercial_activity: z.boolean().optional(),
  enterprise_ordinary_shift_type: z.nativeEnum(ShiftType).optional(),
  enterprise_pay_unworked_holidays: z.boolean().optional(),
  enterprise_aguinaldo_period_start_month: z.number().int().min(1).max(12).optional(),
  enterprise_aguinaldo_period_start_day: z.number().int().min(1).max(31).optional(),
  enterprise_aguinaldo_payment_deadline_day: z.number().int().min(1).max(31).optional(),
});

export type UpdateEnterpriseInput = z.infer<typeof updateEnterpriseSchema>;
