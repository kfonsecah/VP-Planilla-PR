import { isoToDisplay, parseDisplayToISO, getClockLogViewModel } from '../clockLogPresenter';

describe('clockLogPresenter', () => {
  describe('isoToDisplay', () => {
    it('should format valid ISO string to dd/mm/yy', () => {
      expect(isoToDisplay('2024-03-15T10:30:00')).toBe('15/03/24');
      expect(isoToDisplay('2023-12-01')).toBe('01/12/23');
    });

    it('should return empty string for empty input', () => {
      expect(isoToDisplay('')).toBe('');
    });

    it('should return empty string for invalid dates', () => {
      expect(isoToDisplay('not-a-date')).toBe('');
    });
  });

  describe('parseDisplayToISO', () => {
    it('should format dd/mm/yy to YYYY-MM-DD', () => {
      expect(parseDisplayToISO('15/03/24')).toBe('2024-03-15');
      expect(parseDisplayToISO('01/12/23')).toBe('2023-12-01');
    });

    it('should handle full year format dd/mm/yyyy', () => {
      expect(parseDisplayToISO('15/03/2024')).toBe('2024-03-15');
    });

    it('should return empty string for short input', () => {
      expect(parseDisplayToISO('1/1/2')).toBe('');
    });

    it('should return empty string for invalid date strings', () => {
      expect(parseDisplayToISO('99/99/99')).toBe('');
    });
  });

  describe('getClockLogViewModel', () => {
    const baseLog = {
      id: 1,
      employee_id: 101,
      timestamp: '2024-03-15T08:00:00.000Z',
      log_type: 'IN',
      source: 'java_import',
      status: 'valid'
    };

    it('should correctly format basic properties', () => {
      const vm = getClockLogViewModel(baseLog);
      expect(vm.displaySource).toBe('Java');
      expect(vm.statusText).toBe('Valida');
      expect(vm.isProblematic).toBe(false);
      expect(vm.actionButtonLabel).toBe('Ver');
    });

    it('should identify problematic logs', () => {
      const anomalyLog = { ...baseLog, status: 'anomaly' };
      const orphanLog = { ...baseLog, status: 'orphan' };
      
      expect(getClockLogViewModel(anomalyLog).isProblematic).toBe(true);
      expect(getClockLogViewModel(orphanLog).isProblematic).toBe(true);
      expect(getClockLogViewModel(anomalyLog).actionButtonLabel).toBe('Corregir');
    });

    it('should handle different log types with correct classes', () => {
      const inLog = getClockLogViewModel({ ...baseLog, log_type: 'IN' });
      const outLog = getClockLogViewModel({ ...baseLog, log_type: 'OUT' });
      
      expect(inLog.typeBadgeClasses).toContain('bg-green-100');
      expect(outLog.typeBadgeClasses).toContain('bg-orange-100');
    });

    it('should fallback for unknown sources or statuses', () => {
      const weirdLog = { ...baseLog, source: 'unknown', status: 'weird' };
      const vm = getClockLogViewModel(weirdLog);
      
      expect(vm.displaySource).toBe('unknown');
      expect(vm.statusText).toBe('weird');
    });
  });
});
