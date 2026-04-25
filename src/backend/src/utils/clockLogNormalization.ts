/**
 * Canonical log type for clock logs — only IN or OUT.
 */
export type CanonicalLogType = 'IN' | 'OUT';

/**
 * All recognized variants that map to IN.
 */
const IN_TYPES = new Set([
  'in', 'entrada', 'entry', 'start', 'check_in', 'checkin',
  'almuerzo_entrada', 'lunch_in', 'break_in', 'entrada almuerzo',
  'almuerzo in', 'almuerzo_in', 'regreso almuerzo', 'vuelta almuerzo'
]);

/**
 * All recognized variants that map to OUT.
 */
const OUT_TYPES = new Set([
  'out', 'salida', 'exit', 'end', 'check_out', 'checkout',
  'salida final', 'fin turno',
  'almuerzo', 'almuerzo_salida', 'lunch_out', 'break_out', 'salida almuerzo',
  'almuerzo out', 'almuerzo_out'
]);

/**
 * Normalizes any clock log type variant to canonical IN/OUT.
 * @param value - Raw log type from any source (Excel, Java, manual)
 * @returns 'IN' | 'OUT'
 * @throws Error if value cannot be normalized to a canonical type
 */
export function normalizeLogType(value: string): CanonicalLogType {
  const v = value.toLowerCase().trim();
  if (IN_TYPES.has(v)) return 'IN';
  if (OUT_TYPES.has(v)) return 'OUT';
  throw new Error(`Tipo de marca desconocido: "${value}". Valores aceptados: IN, OUT, ENTRADA, SALIDA`);
}

/**
 * Validates that a value is already a canonical IN/OUT.
 * Use after normalization to enforce strict type checking.
 * @param value - String to validate
 * @returns true if value is 'IN' or 'OUT'
 */
export function isValidCanonicalType(value: string): value is CanonicalLogType {
  return value === 'IN' || value === 'OUT';
}

/**
 * InferLogTypeRow - Input row for type inference (without log_type).
 */
export type InferLogTypeRow = {
  employee_id: number;
  timestamp: Date;
  remarks?: string | null;
};

/**
 * InferLogTypeResult - Row with inferred log_type.
 */
export type InferLogTypeResult = {
  employee_id: number;
  timestamp: Date;
  log_type: CanonicalLogType;
  remarks?: string | null;
};

export interface TimeWindowConfig {
  time_window_name: string;
  time_window_type: string;
  time_window_start_hour: string;
  time_window_end_hour: string;
}

function toMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  return hours * 60 + minutes;
}

/**
 * Infers IN/OUT log type by matching against configured time windows.
 * If no windows match, falls back to chronological sequence assignment.
 * Groups rows by (employee_id, UTC date), sorts each group by timestamp ascending.
 *
 * @param rows - Array of resolved rows without log_type
 * @param windows - Array of configured time windows
 * @returns Same rows with log_type inferred as 'IN' | 'OUT'
 */
export function inferLogTypeByTimeWindow(
  rows: InferLogTypeRow[],
  windows: TimeWindowConfig[] = []
): InferLogTypeResult[] {
  if (rows.length === 0) return [];

  // Group by (employee_id, YYYY-MM-DD UTC date)
  const grouped = new Map<string, InferLogTypeRow[]>();

  for (const row of rows) {
    const dateStr = row.timestamp.toISOString().split('T')[0];
    const key = `${row.employee_id}|${dateStr}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(row);
  }

  const result: InferLogTypeResult[] = [];

  for (const group of grouped.values()) {
    // Sort ascending by timestamp within each group
    group.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    for (let i = 0; i < group.length; i++) {
      const row = group[i];
      let inferredType: CanonicalLogType | null = null;
      
      // Try to match time window
      if (windows.length > 0) {
        // We use local hour of the timestamp, assuming UTC corresponds to local time for these calculations
        // (If timestamp is stored in UTC but represents local time, substring(11,16) gets the time)
        const hhmm = row.timestamp.toISOString().substring(11, 16);
        const markMinutes = toMinutes(hhmm);
        
        const matching = windows.filter((w) => {
          const start = toMinutes(w.time_window_start_hour);
          const end = toMinutes(w.time_window_end_hour);
          if (start <= end) {
            return markMinutes >= start && markMinutes < end;
          } else {
            return markMinutes >= start || markMinutes < end;
          }
        });
        
        if (matching.length > 0) {
          // If matches multiple, just use the first one's type
          inferredType = matching[0].time_window_type.toUpperCase() === 'OUT' ? 'OUT' : 'IN';
        }
      }
      
      // Fallback to sequence if no window matched
      if (!inferredType) {
         inferredType = i % 2 === 0 ? 'IN' : 'OUT';
      }

      result.push({
        employee_id: row.employee_id,
        timestamp: row.timestamp,
        log_type: inferredType,
        remarks: row.remarks,
      });
    }
  }

  return result;
}
