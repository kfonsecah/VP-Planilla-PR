import { normalizeLogType, isValidCanonicalType, inferLogTypeByTimeWindow } from '../../../utils/clockLogNormalization';

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

  describe('inferLogTypeByTimeWindow', () => {
    it('should return empty array for empty input', () => {
      expect(inferLogTypeByTimeWindow([])).toEqual([]);
    });

    it('should assign IN to single row per employee+day', () => {
      const row = { employee_id: 1, timestamp: new Date('2026-04-01T08:00:00Z') };
      const result = inferLogTypeByTimeWindow([row]);
      expect(result[0].log_type).toBe('IN');
    });

    it('should assign IN then OUT for two rows same employee+day', () => {
      const rows = [
        { employee_id: 1, timestamp: new Date('2026-04-01T08:00:00Z') },
        { employee_id: 1, timestamp: new Date('2026-04-01T17:00:00Z') },
      ];
      const result = inferLogTypeByTimeWindow(rows);
      expect(result.find(r => r.timestamp.toISOString() === '2026-04-01T08:00:00.000Z')?.log_type).toBe('IN');
      expect(result.find(r => r.timestamp.toISOString() === '2026-04-01T17:00:00.000Z')?.log_type).toBe('OUT');
    });

    it('should assign IN, OUT, IN for three rows same employee+day', () => {
      const rows = [
        { employee_id: 1, timestamp: new Date('2026-04-01T08:00:00Z') },
        { employee_id: 1, timestamp: new Date('2026-04-01T12:00:00Z') },
        { employee_id: 1, timestamp: new Date('2026-04-01T13:00:00Z') },
      ];
      const result = inferLogTypeByTimeWindow(rows);
      const sorted = result.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      expect(sorted[0].log_type).toBe('IN');
      expect(sorted[1].log_type).toBe('OUT');
      expect(sorted[2].log_type).toBe('IN');
    });

    it('should handle two employees independently', () => {
      const rows = [
        { employee_id: 1, timestamp: new Date('2026-04-01T08:00:00Z') },
        { employee_id: 1, timestamp: new Date('2026-04-01T17:00:00Z') },
        { employee_id: 2, timestamp: new Date('2026-04-01T09:00:00Z') },
        { employee_id: 2, timestamp: new Date('2026-04-01T18:00:00Z') },
      ];
      const result = inferLogTypeByTimeWindow(rows);
      const emp1 = result.filter(r => r.employee_id === 1).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const emp2 = result.filter(r => r.employee_id === 2).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      expect(emp1[0].log_type).toBe('IN');
      expect(emp1[1].log_type).toBe('OUT');
      expect(emp2[0].log_type).toBe('IN');
      expect(emp2[1].log_type).toBe('OUT');
    });

    it('should treat different dates for same employee independently', () => {
      const rows = [
        { employee_id: 1, timestamp: new Date('2026-04-01T08:00:00Z') },
        { employee_id: 1, timestamp: new Date('2026-04-02T08:00:00Z') },
      ];
      const result = inferLogTypeByTimeWindow(rows);
      expect(result.every(r => r.log_type === 'IN')).toBe(true);
    });

    it('should sort by timestamp before assigning (handles reverse input)', () => {
      const rows = [
        { employee_id: 1, timestamp: new Date('2026-04-01T17:00:00Z') }, // arrives first but later time
        { employee_id: 1, timestamp: new Date('2026-04-01T08:00:00Z') }, // earlier time → should be IN
      ];
      const result = inferLogTypeByTimeWindow(rows);
      const early = result.find(r => r.timestamp.toISOString() === '2026-04-01T08:00:00.000Z');
      const late = result.find(r => r.timestamp.toISOString() === '2026-04-01T17:00:00.000Z');
      expect(early?.log_type).toBe('IN');
      expect(late?.log_type).toBe('OUT');
    });

    it('should use time windows if provided', () => {
      const rows = [
        { employee_id: 1, timestamp: new Date('2026-04-01T17:00:00Z') }, // OUT
        { employee_id: 1, timestamp: new Date('2026-04-01T08:00:00Z') }, // IN
        { employee_id: 1, timestamp: new Date('2026-04-01T16:00:00Z') } // also OUT! (missed punch)
      ];
      const windows = [
        { time_window_name: 'Morning', time_window_type: 'IN', time_window_start_hour: '06:00', time_window_end_hour: '10:00' },
        { time_window_name: 'Evening', time_window_type: 'OUT', time_window_start_hour: '15:00', time_window_end_hour: '19:00' }
      ];
      
      const result = inferLogTypeByTimeWindow(rows, windows);
      
      const early = result.find(r => r.timestamp.toISOString() === '2026-04-01T08:00:00.000Z');
      const late1 = result.find(r => r.timestamp.toISOString() === '2026-04-01T16:00:00.000Z');
      const late2 = result.find(r => r.timestamp.toISOString() === '2026-04-01T17:00:00.000Z');
      
      expect(early?.log_type).toBe('IN');
      expect(late1?.log_type).toBe('OUT'); // Correctly inferred as OUT instead of fallback IN
      expect(late2?.log_type).toBe('OUT'); // Correctly inferred as OUT
    });
  });
});
