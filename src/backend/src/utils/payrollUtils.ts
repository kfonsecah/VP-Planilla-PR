/**
 * Payroll calculation utility functions
 * Contains pure helper functions for payroll processing
 */
import { MinuteRoundingPolicy } from "@prisma/client";
import { DayWork, LegalParamSet } from "../types/payroll.types";

export const DEFAULT_LEGAL_PARAMS: LegalParamSet = {
  regularHoursPerDay: 8,
  regularHoursPerWeek: 48,
  otFactor: 1.5,
  holidayMandatoryFactor: 2.0,
  holidayTripleFactor: 3.0,
  ccssObreroSalud: 5.5,
  ccssObrerosPension: 4.33,
  ccssObreroBP: 1.0,
  minuteRoundingPolicy: MinuteRoundingPolicy.EXACT,
  payUnworkedHolidays: true,
  workingDaysPerWeek: 6,
  weeklyRestNumerator: 8,
  weeklyRestDenominator: 104,
  weeklyRestMultiplier: 2,
  aguinaldoDivisor: 12,
};

// ── Costa Rica labor law constants ────────────────────────────────────────────

export interface PayrollHoliday {
  company_holidays_date: Date;
  company_holidays_is_mandatory: boolean;
  company_holidays_is_triple: boolean;
}

/**
 * Check if a date is a Costa Rica national holiday based on dynamic DB list
 * @param date - Date to check
 * @param holidays - Array of company holidays
 * @returns True if date is a holiday
 */
export function isCRHoliday(date: Date, holidays: PayrollHoliday[]): boolean {
  const dateStr = formatDateString(date);
  return holidays.some(h => formatDateString(new Date(h.company_holidays_date)) === dateStr);
}

export function getHolidayForDate(date: Date, holidays: PayrollHoliday[]): PayrollHoliday | undefined {
  const dateStr = formatDateString(date);
  return holidays.find(h => formatDateString(new Date(h.company_holidays_date)) === dateStr);
}



/**
 * Calculate working hours between two timestamps
 * @param startTime - Start timestamp
 * @param endTime - End timestamp
 * @returns Number of hours worked (rounded to 2 decimals)
 */
export function calculateHoursBetween(startTime: Date, endTime: Date): number {
  const diffMs = endTime.getTime() - startTime.getTime();
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

/**
 * Check if a date falls within a date range (inclusive)
 * @param date - Date to check
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns True if date is within range
 */
export function isDateInRange(
  date: Date,
  startDate: Date,
  endDate: Date,
): boolean {
  return date >= startDate && date <= endDate;
}

/**
 * Format date to YYYY-MM-DD string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Parse date string to Date object
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Date object or null if invalid
 */
export function parseDateString(dateStr: string): Date | null {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * Generate array of dates between start and end (inclusive)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of dates
 */
export function generateDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

/**
 * Round monetary amount to 2 decimal places
 * @param amount - Amount to round
 * @returns Rounded amount
 */
export function roundToMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Validate clock log pairs for inconsistencies
 * @param logs - Array of clock logs for a day
 * @returns Object with validation result and messages
 */
export function validateClockLogPairs(logs: any[]): {
  isValid: boolean;
  messages: string[];
  pairs: Array<{ in: any; out: any }>;
} {
  const messages: string[] = [];
  const pairs: Array<{ in: any; out: any }> = [];

  if (logs.length === 0) {
    return { isValid: true, messages: [], pairs: [] };
  }

  if (logs.length === 1) {
    messages.push("Solo una marca detectada");
    return { isValid: false, messages, pairs: [] };
  }

  if (logs.length % 2 !== 0) {
    messages.push(`Número impar de marcas (${logs.length})`);
    return { isValid: false, messages, pairs: [] };
  }

  // Sort logs by timestamp
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  let isValid = true;

  for (let i = 0; i < sortedLogs.length; i += 2) {
    const inLog = sortedLogs[i];
    const outLog = sortedLogs[i + 1];

    // Validate log_type sequence: first of each pair must be IN, second must be OUT
    const inType = (inLog.log_type || "").toUpperCase();
    const outType = (outLog.log_type || "").toUpperCase();

    if (inType !== "IN") {
      messages.push(
        `Se esperaba marcaje de entrada (IN) pero se encontró "${inLog.log_type}" en posición ${i + 1}`,
      );
      isValid = false;
      continue;
    }

    if (outType !== "OUT") {
      messages.push(
        `Se esperaba marcaje de salida (OUT) pero se encontró "${outLog.log_type}" en posición ${i + 2}`,
      );
      isValid = false;
      continue;
    }

    const inTime = new Date(inLog.timestamp);
    const outTime = new Date(outLog.timestamp);

    if (outTime <= inTime) {
      messages.push(`Hora de salida anterior o igual a entrada`);
      isValid = false;
      continue;
    }

    pairs.push({ in: inLog, out: outLog });
  }

  return { isValid, messages, pairs };
}

/**
 * Calculate total hours from valid clock log pairs
 * @param pairs - Array of valid in/out pairs
 * @returns Total hours worked
 */
export function calculateTotalHoursFromPairs(
  pairs: Array<{ in: any; out: any }>,
): number {
  let totalHours = 0;

  for (const pair of pairs) {
    const inTime = new Date(pair.in.timestamp);
    const outTime = new Date(pair.out.timestamp);
    const hours = calculateHoursBetween(inTime, outTime);
    totalHours += hours;
  }

  return roundToMoney(totalHours);
}

/**
 * Check for overlapping time periods within the same day
 * @param pairs - Array of time pairs
 * @returns True if there are overlaps
 */
export function hasOverlappingPairs(
  pairs: Array<{ in: any; out: any }>,
): boolean {
  for (let i = 0; i < pairs.length - 1; i++) {
    const currentOut = new Date(pairs[i].out.timestamp);
    const nextIn = new Date(pairs[i + 1].in.timestamp);

    if (currentOut > nextIn) {
      return true;
    }
  }

  return false;
}

/**
 * Apply percentage deduction to base amount
 * @param baseAmount - Base amount to apply percentage to
 * @param percentage - Percentage to apply (0-100)
 * @returns Calculated deduction amount
 */
export function applyPercentageDeduction(
  baseAmount: number,
  percentage: number,
): number {
  return roundToMoney((baseAmount * percentage) / 100);
}

/**
 * Calculate net salary ensuring it's never negative
 * @param grossSalary - Gross salary amount
 * @param totalDeductions - Total deductions amount
 * @returns Net salary (minimum 0)
 */
export function calculateNetSalary(
  grossSalary: number,
  totalDeductions: number,
): number {
  return Math.max(0, roundToMoney(grossSalary - totalDeductions));
}

/**
 * Validate date range for payroll period
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Validation result with messages
 */
export function validatePayrollPeriod(
  startDate: Date,
  endDate: Date,
): {
  isValid: boolean;
  messages: string[];
} {
  const messages: string[] = [];

  if (isNaN(startDate.getTime())) {
    messages.push("Fecha de inicio inválida");
  }

  if (isNaN(endDate.getTime())) {
    messages.push("Fecha de fin inválida");
  }

  if (startDate > endDate) {
    messages.push("La fecha de inicio debe ser anterior a la fecha de fin");
  }

  // Check if period is not too long (e.g., more than 1 year)
  const daysDiff =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    messages.push("El periodo no puede ser mayor a un año");
  }

  return {
    isValid: messages.length === 0,
    messages,
  };
}

// ── Hour split helpers ────────────────────────────────────────────────────────

/**
 * Sum of regular hours per day (capped at 8h/day).
 */
export function calculateRegularHours(days: DayWork[], params: LegalParamSet = DEFAULT_LEGAL_PARAMS): number {
  return roundToMoney(
    days.reduce(
      (sum, day) => sum + Math.min(day.hoursWorked, params.regularHoursPerDay),
      0,
    ),
  );
}

/**
 * Sum of overtime hours per day (hours beyond 8h/day).
 */
export function calculateOvertimeHours(days: DayWork[], params: LegalParamSet = DEFAULT_LEGAL_PARAMS): number {
  return roundToMoney(
    days.reduce(
      (sum, day) => sum + Math.max(0, day.hoursWorked - params.regularHoursPerDay),
      0,
    ),
  );
}

/**
 * Calculate overtime hours based on biweekly requirements.
 * Compares total hours worked vs total hours required for the period.
 * @param totalWorkedHours - Total hours worked in the period
 * @param requiredHours - Total hours required (e.g., from employee_required_hours_biweekly)
 * @returns Overtime hours (worked - required), or 0 if worked <= required
 */
export function calculateOvertimeHoursBiweekly(
  totalWorkedHours: number,
  requiredHours: number,
): number {
  return roundToMoney(Math.max(0, totalWorkedHours - requiredHours));
}

// ── Weekly rest (descanso semanal) ────────────────────────────────────────────

/**
 * Count weekly rest days owed (discrete, Mon–Sat only).
 * Kept for reference. Prefer calculateWeeklyRestHours for pay calculations.
 */
export function getWeeklyRestDays(days: DayWork[], params: LegalParamSet = DEFAULT_LEGAL_PARAMS): number {
  const workingDays = days.filter(
    (d) =>
      !d.isVacation && d.hoursWorked > 0 && new Date(d.date).getDay() !== 0,
  ).length;
  return Math.floor(workingDays / params.workingDaysPerWeek);
}

/**
 * Count all Sundays within the period.
 */
export function getSundaysInPeriod(startDate: Date, endDate: Date): Date[] {
  const sundays: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    if (current.getDay() === 0) sundays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return sundays;
}

/**
 * Count Mon–Sat working days in the full period, excluding CR national holidays.
 * Used both for weekly-rest denominator and scheduled hours.
 */
export function countWorkingDaysInPeriod(startDate: Date, endDate: Date, holidays: PayrollHoliday[] = []): number {
  let count = 0;
  const current = new Date(startDate);
  while (current <= endDate) {
    if (current.getUTCDay() !== 0 && !isCRHoliday(current, holidays)) {
      count++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return count;
}

/**
 * Scheduled (required) hours for a period: Mon–Sat days × 8.
 */
export function calculateScheduledHours(
  startDate: Date,
  endDate: Date,
  holidays: PayrollHoliday[] = [],
  params: LegalParamSet = DEFAULT_LEGAL_PARAMS
): number {
  return countWorkingDaysInPeriod(startDate, endDate, holidays) * params.regularHoursPerDay;
}

/**
 * Calculate weekly rest hours earned based on enterprise formula.
 * Standard proportional rest formula: regularHours × (numerator / denominator) × multiplier
 * Default CR: regularHours × 8 / 104 × 2
 * 
 * @param regularHours - Total regular hours worked in period
 * @param startDate - Period start
 * @param endDate - Period end
 * @param params - Legal parameter set
 * @returns Proportional rest hours
 */
export function calculateWeeklyRestHours(
  regularHours: number,
  startDate: Date,
  endDate: Date,
  params: LegalParamSet = DEFAULT_LEGAL_PARAMS
): number {
  return roundToMoney(((regularHours * params.weeklyRestNumerator) / params.weeklyRestDenominator) * params.weeklyRestMultiplier);
}

// ── Salary component helpers ──────────────────────────────────────────────────

/**
 * Overtime pay amount: overtime hours × base rate × 1.5.
 */
export function calculateOvertimePay(
  days: DayWork[],
  hourlyRate: number,
  holidays: PayrollHoliday[] = [],
  params: LegalParamSet = DEFAULT_LEGAL_PARAMS
): number {
  let totalOtPay = 0;
  days.forEach(day => {
    const dayOvertime = Math.max(0, day.hoursWorked - params.regularHoursPerDay);
    if (dayOvertime > 0) {
      const holiday = getHolidayForDate(new Date(day.date), holidays);
      const holidayFactor = holiday?.company_holidays_is_mandatory
        ? params.holidayMandatoryFactor  // 2.0
        : 1.0;
      const multiplier = holidayFactor * params.otFactor;  // 2.0 × 1.5 = 3.0 | 1.0 × 1.5 = 1.5
      totalOtPay += dayOvertime * hourlyRate * multiplier;
    }
  });
  return roundToMoney(totalOtPay);
}

/**
 * Weekly rest pay: proportional rest hours × hourly rate.
 * Needs period dates to compute the Sunday-to-working-day ratio.
 */
export function calculateWeeklyRestPay(
  days: DayWork[],
  hourlyRate: number,
  startDate: Date,
  endDate: Date,
  params: LegalParamSet = DEFAULT_LEGAL_PARAMS
): number {
  const regularHours = calculateRegularHours(days, params);
  const restHours = calculateWeeklyRestHours(regularHours, startDate, endDate);
  return roundToMoney(restHours * hourlyRate);
}

/**
/**
 * Returns the hours and pay owed for mandatory holidays NOT worked in the period.
 *
 * Behaviour controlled by params.payUnworkedHolidays (enterprise config):
 *   true  (default) — unworked mandatory holidays are paid. This is the standard
 *                     behavior under Costa Rica labor law for feriados de pago obligatorio.
 *   false           — unworked mandatory holidays are excluded from the calculation.
 *                     The employer has accepted the legal disclaimer for this setting.
 *
 * Holidays that WERE worked are always handled by calculateGrossSalary's regular-pay
 * loop, which applies the individual holiday multiplier (2× mandatory, 3× triple).
 *
 * @param days       - All DayWork records for the period
 * @param hourlyRate - Employee hourly rate
 * @param startDate  - Period start
 * @param endDate    - Period end
 * @param holidays   - Company holidays list
 * @param params     - Legal param set (payUnworkedHolidays defaults to true)
 * @returns { hours, pay }
 */
export function getMandatoryHolidayBreakdown(
  days: DayWork[],
  hourlyRate: number,
  startDate: Date,
  endDate: Date,
  holidays: PayrollHoliday[],
  params: LegalParamSet = DEFAULT_LEGAL_PARAMS
): { hours: number; pay: number } {
  // When the enterprise opts out, unworked holidays are not included
  if (params.payUnworkedHolidays === false) {
    return { hours: 0, pay: 0 };
  }

  let hours = 0;
  let pay = 0;

  for (const holiday of holidays) {
    if (!holiday.company_holidays_is_mandatory) continue;
    const hDate = new Date(holiday.company_holidays_date);
    if (hDate < startDate || hDate > endDate || hDate.getDay() === 0) continue;

    const workedDay = days.find(d => formatDateString(new Date(d.date)) === formatDateString(hDate));
    if (workedDay && workedDay.hoursWorked > 0) continue; // worked → handled in regular pay loop

    hours += params.regularHoursPerDay;
    pay   += params.regularHoursPerDay * hourlyRate;
  }

  return { hours: roundToMoney(hours), pay: roundToMoney(pay) };
}

/**
 * Full gross salary: regular pay + overtime pay + weekly rest pay + bonuses.
 */
export function calculateGrossSalary(
  days: DayWork[],
  hourlyRate: number,
  bonuses: number,
  startDate: Date,
  endDate: Date,
  holidays: PayrollHoliday[] = [],
  params: LegalParamSet = DEFAULT_LEGAL_PARAMS
): number {
  let regularPay = 0;
  
  // Calculate regular pay respecting holiday multipliers
  days.forEach(day => {
    const dayRegular = Math.min(day.hoursWorked, params.regularHoursPerDay);
    const holiday = getHolidayForDate(new Date(day.date), holidays);
    
    let multiplier = 1.0;
    if (holiday?.company_holidays_is_mandatory && day.hoursWorked > 0) {
      multiplier = params.holidayMandatoryFactor;
    }
    
    regularPay += dayRegular * hourlyRate * multiplier;
  });
  
  // Base pay for mandatory holidays not worked (Art. 148 eligibility check applied)
  const { pay: mandatoryHolidayBasePay } = getMandatoryHolidayBreakdown(days, hourlyRate, startDate, endDate, holidays, params);
  regularPay += mandatoryHolidayBasePay;

  const regular = roundToMoney(regularPay);
  const overtime = calculateOvertimePay(days, hourlyRate, holidays, params);
  // Exclude mandatory holiday days from the weekly rest base — they have their own salary treatment
  const nonHolidayDays = days.filter(
    day => !getHolidayForDate(new Date(day.date), holidays)?.company_holidays_is_mandatory
  );
  const weeklyRest = calculateWeeklyRestPay(
    nonHolidayDays,
    hourlyRate,
    startDate,
    endDate,
    params
  );
  return roundToMoney(regular + overtime + weeklyRest + bonuses);
}

// ── Labor event pay resolution ────────────────────────────────────────────────

/**
 * Determines which day within a labor event a given calendar date corresponds to.
 * Day 1 = the first day of the event (event start date itself).
 * Needed to enforce max_paid_days rules (e.g., incapacidad CCSS: days 1–3 paid by employer).
 *
 * @param eventStartDate - The date the labor event started (may be before period start)
 * @param currentDate    - The date being evaluated
 * @returns 1-based day number within the event
 */
export function getDayNumberWithinEvent(eventStartDate: Date, currentDate: Date): number {
  const diffMs = currentDate.getTime() - eventStartDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

export interface LaborEventForDay {
  name: string;
  payBehavior: 'FULL_PAY' | 'PARTIAL_PAY' | 'NO_PAY' | 'EXTERNAL_PAY';
  maxPaidDays: number | null;
  payPercentage: number | null;
  startDate: Date;
}

export interface EventPayResult {
  /** Hours to count toward the payroll for this day */
  hoursWorked: number;
  /** Message to attach to the day's work record */
  message: string;
}

/**
 * Resolve the pay outcome for a single day covered by a labor event.
 *
 * Rules:
 *  - If dayNumber > maxPaidDays → employer does not pay (EXTERNAL_PAY style)
 *  - FULL_PAY   → regularHoursPerDay at full rate
 *  - PARTIAL_PAY → regularHoursPerDay × (payPercentage / 100)
 *  - NO_PAY     → 0 hours
 *  - EXTERNAL_PAY → 0 hours (third party pays — informational message)
 *
 * @param event               - Labor event catalog entry with pay behavior fields
 * @param dayNumberWithinEvent - 1-based index of this calendar day within the event
 * @param regularHoursPerDay  - Normal hours per workday (from legal params)
 * @returns { hoursWorked, message }
 */
export function resolveEventPayForDay(
  event: LaborEventForDay,
  dayNumberWithinEvent: number,
  regularHoursPerDay: number,
): EventPayResult {
  const isWithinPaidLimit =
    event.maxPaidDays === null || dayNumberWithinEvent <= event.maxPaidDays;

  if (!isWithinPaidLimit) {
    return {
      hoursWorked: 0,
      message: `${event.name} — día ${dayNumberWithinEvent} (pago externo, no patronal)`,
    };
  }

  switch (event.payBehavior) {
    case 'FULL_PAY':
      return {
        hoursWorked: regularHoursPerDay,
        message: `${event.name} — con goce de salario`,
      };

    case 'PARTIAL_PAY': {
      const pct = (event.payPercentage ?? 0) / 100;
      return {
        hoursWorked: roundToMoney(regularHoursPerDay * pct),
        message: `${event.name} — ${event.payPercentage ?? 0}% del salario (día ${dayNumberWithinEvent})`,
      };
    }

    case 'NO_PAY':
      return {
        hoursWorked: 0,
        message: `${event.name} — sin goce de salario`,
      };

    case 'EXTERNAL_PAY':
      return {
        hoursWorked: 0,
        message: `${event.name} — pago gestionado externamente (CCSS/INS)`,
      };

    default:
      return {
        hoursWorked: 0,
        message: `${event.name} — sin goce de salario`,
      };
  }
}

export function hasAYear(hired_date: Date, end_date: Date) {
  const anniversary = new Date(hired_date);
  anniversary.setFullYear(anniversary.getFullYear() + 1);

  return end_date >= anniversary;
}

/**
 * Calculate the average of salaries for a period (e.g. for Aguinaldo).
 * @param salaries - Array of monthly/biweekly salaries
 * @param params - Legal parameter set (divisor defaults to 12)
 * @returns Average amount
 */
export function averageOfSalaries(salaries: number[], params: LegalParamSet = DEFAULT_LEGAL_PARAMS) {
  if (salaries.length === 0) {
    return 0;
  }

  let sum = 0;
  salaries.forEach((salary) => {
    sum += salary;
  });

  return roundToMoney(sum / params.aguinaldoDivisor);
}

/**
 * Apply minute rounding policy to a duration in minutes.
 * Returns proportional hours (number).
 * 
 * @param totalMinutes - Minutes to round
 * @param policy - Rounding policy (EXACT, ALWAYS_UP, NEAREST_QUARTER)
 * @returns Hours as decimal (e.g. 1.25, 1.5)
 */
export function applyMinuteRounding(totalMinutes: number, policy: MinuteRoundingPolicy = MinuteRoundingPolicy.EXACT): number {
  const sanitizedMinutes = Math.round(totalMinutes);
  
  switch (policy) {
    case MinuteRoundingPolicy.ALWAYS_UP:
      // Redondea al cuarto de hora superior (ceil(minutos/15) * 15 / 60)
      return (Math.ceil(sanitizedMinutes / 15) * 15) / 60;
      
    case MinuteRoundingPolicy.NEAREST_QUARTER:
      // Redondea al cuarto más cercano (round(minutos/15) * 15 / 60)
      return (Math.round(sanitizedMinutes / 15) * 15) / 60;
      
    case MinuteRoundingPolicy.EXACT:
    default:
      // EXACT: Retorna proporcional exacto (minutos / 60)
      return sanitizedMinutes / 60;
  }
}
