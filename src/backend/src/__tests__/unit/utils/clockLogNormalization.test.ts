import { normalizeLogType, isValidCanonicalType } from '../../../utils/clockLogNormalization';

describe('clockLogNormalization', () => {
  describe('normalizeLogType', () => {
    it('should normalize ENTRADA to IN', () => {
      expect(normalizeLogType('ENTRADA')).toBe('IN');
    });

    it('should normalize SALIDA to OUT', () => {
      expect(normalizeLogType('SALIDA')).toBe('OUT');
    });

    it('should normalize lowercase in to IN', () => {
      expect(normalizeLogType('in')).toBe('IN');
    });

    it('should normalize uppercase OUT to OUT', () => {
      expect(normalizeLogType('OUT')).toBe('OUT');
    });

    it('should normalize almuerzo_entrada to IN', () => {
      expect(normalizeLogType('almuerzo_entrada')).toBe('IN');
    });

    it('should normalize lunch_out to OUT', () => {
      expect(normalizeLogType('lunch_out')).toBe('OUT');
    });

    it('should throw Error with descriptive message for unknown values', () => {
      expect(() => normalizeLogType('UNKNOWN')).toThrow(/desconocido/i);
      expect(() => normalizeLogType('UNKNOWN')).toThrow(/UNKNOWN/);
    });

    it('should throw Error for empty string', () => {
      expect(() => normalizeLogType('')).toThrow();
    });

    it('should handle Spanish variants: entrada, salida', () => {
      expect(normalizeLogType('entrada')).toBe('IN');
      expect(normalizeLogType('salida')).toBe('OUT');
    });

    it('should handle English variants: entry, exit, start, end', () => {
      expect(normalizeLogType('entry')).toBe('IN');
      expect(normalizeLogType('exit')).toBe('OUT');
      expect(normalizeLogType('start')).toBe('IN');
      expect(normalizeLogType('end')).toBe('OUT');
    });

    it('should handle check_in/check_out variants', () => {
      expect(normalizeLogType('check_in')).toBe('IN');
      expect(normalizeLogType('check_out')).toBe('OUT');
      expect(normalizeLogType('checkin')).toBe('IN');
      expect(normalizeLogType('checkout')).toBe('OUT');
    });

    it('should handle lunch/break variants', () => {
      expect(normalizeLogType('almuerzo')).toBe('OUT');
      expect(normalizeLogType('almuerzo_salida')).toBe('OUT');
      expect(normalizeLogType('lunch_out')).toBe('OUT');
      expect(normalizeLogType('break_out')).toBe('OUT');
      expect(normalizeLogType('salida almuerzo')).toBe('OUT');
      expect(normalizeLogType('lunch_in')).toBe('IN');
      expect(normalizeLogType('break_in')).toBe('IN');
      expect(normalizeLogType('entrada almuerzo')).toBe('IN');
    });

    it('should handle values with whitespace', () => {
      expect(normalizeLogType('  ENTRADA  ')).toBe('IN');
      expect(normalizeLogType('  SALIDA  ')).toBe('OUT');
    });
  });

  describe('isValidCanonicalType', () => {
    it('should return true for IN', () => {
      expect(isValidCanonicalType('IN')).toBe(true);
    });

    it('should return true for OUT', () => {
      expect(isValidCanonicalType('OUT')).toBe(true);
    });

    it('should return false for ENTRADA', () => {
      expect(isValidCanonicalType('ENTRADA')).toBe(false);
    });

    it('should return false for arbitrary strings', () => {
      expect(isValidCanonicalType('unknown')).toBe(false);
      expect(isValidCanonicalType('')).toBe(false);
    });
  });
});
