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
