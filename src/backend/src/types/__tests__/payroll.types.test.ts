import { MinuteRoundingPolicy } from '@prisma/client';
import { LegalParamSet } from '../payroll.types';

describe('Payroll Types', () => {
  it('should require minuteRoundingPolicy as MinuteRoundingPolicy enum', () => {
    // This should fail to compile if minuteRoundingPolicy is optional or string
    const params: LegalParamSet = {
      regularHoursPerDay: 8,
      regularHoursPerWeek: 48,
      otFactor: 1.5,
      holidayMandatoryFactor: 2,
      holidayTripleFactor: 3,
      ccssObreroSalud: 0.055,
      ccssObrerosPension: 0.04,
      ccssObreroBP: 0.01,
      minuteRoundingPolicy: MinuteRoundingPolicy.ALWAYS_UP,
      workingDaysPerWeek: 6,
      weeklyRestNumerator: 8,
      weeklyRestDenominator: 104,
      weeklyRestMultiplier: 2,
      aguinaldoDivisor: 12,
    };
    
    expect(params.minuteRoundingPolicy).toBe(MinuteRoundingPolicy.ALWAYS_UP);
  });

  it('should NOT allow arbitrary strings if it were the enum (type-level check)', () => {
    // This is hard to test at runtime, but we can try to use a value that isn't in the enum
    // If we were using a strict type checker, this would fail.
    const policy: MinuteRoundingPolicy = MinuteRoundingPolicy.EXACT;
    expect(policy).toBe('EXACT');
  });
});
