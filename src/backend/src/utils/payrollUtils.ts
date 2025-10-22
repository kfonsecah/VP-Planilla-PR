/**
 * Payroll calculation utility functions
 * Contains pure helper functions for payroll processing
 */

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
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

/**
 * Format date to YYYY-MM-DD string
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDateString(date: Date): string {
  return date.toISOString().split('T')[0];
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
    messages.push('Solo una marca detectada');
    return { isValid: false, messages, pairs: [] };
  }
  
  if (logs.length % 2 !== 0) {
    messages.push(`Número impar de marcas (${logs.length})`);
    return { isValid: false, messages, pairs: [] };
  }
  
  // Sort logs by timestamp
  const sortedLogs = [...logs].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  let isValid = true;
  
  for (let i = 0; i < sortedLogs.length; i += 2) {
    const inLog = sortedLogs[i];
    const outLog = sortedLogs[i + 1];
    
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
export function calculateTotalHoursFromPairs(pairs: Array<{ in: any; out: any }>): number {
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
export function hasOverlappingPairs(pairs: Array<{ in: any; out: any }>): boolean {
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
export function applyPercentageDeduction(baseAmount: number, percentage: number): number {
  return roundToMoney((baseAmount * percentage) / 100);
}

/**
 * Calculate net salary ensuring it's never negative
 * @param grossSalary - Gross salary amount
 * @param totalDeductions - Total deductions amount
 * @returns Net salary (minimum 0)
 */
export function calculateNetSalary(grossSalary: number, totalDeductions: number): number {
  return Math.max(0, roundToMoney(grossSalary - totalDeductions));
}

/**
 * Validate date range for payroll period
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Validation result with messages
 */
export function validatePayrollPeriod(startDate: Date, endDate: Date): {
  isValid: boolean;
  messages: string[];
} {
  const messages: string[] = [];
  
  if (isNaN(startDate.getTime())) {
    messages.push('Fecha de inicio inválida');
  }
  
  if (isNaN(endDate.getTime())) {
    messages.push('Fecha de fin inválida');
  }
  
  if (startDate > endDate) {
    messages.push('La fecha de inicio debe ser anterior a la fecha de fin');
  }
  
  // Check if period is not too long (e.g., more than 1 year)
  const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysDiff > 365) {
    messages.push('El periodo no puede ser mayor a un año');
  }
  
  return {
    isValid: messages.length === 0,
    messages
  };
}