/**
 * Utility functions for date parsing and manipulation in the backend.
 */

/**
 * Parses a YYYY-MM-DD string into a local Date object at 00:00:00.000.
 */
export function parseLocalDate(dateStr: string | undefined): Date | undefined {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
    return new Date(year, month - 1, day);
}

/**
 * Parses a YYYY-MM-DD string into a local Date object at 23:59:59.999.
 */
export function parseLocalDateEnd(dateStr: string | undefined): Date | undefined {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined;
    return new Date(year, month - 1, day, 23, 59, 59, 999);
}
