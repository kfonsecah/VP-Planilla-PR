import { MinuteRoundingPolicy } from '@prisma/client';
import { applyMinuteRounding } from '../../utils/payrollUtils';

describe('applyMinuteRounding', () => {
  // Task 1 RED: Using MinuteRoundingPolicy enum in tests
  
  it('should round EXACT correctly (no rounding, just minutes/60)', () => {
    // 45 minutes = 0.75 hours
    expect(applyMinuteRounding(45, MinuteRoundingPolicy.EXACT)).toBe(0.75);
    expect(applyMinuteRounding(60, MinuteRoundingPolicy.EXACT)).toBe(1.0);
    expect(applyMinuteRounding(0, MinuteRoundingPolicy.EXACT)).toBe(0);
  });

  it('should round ALWAYS_UP to the next quarter hour', () => {
    // 1 minute -> 15 minutes = 0.25 hours
    expect(applyMinuteRounding(1, MinuteRoundingPolicy.ALWAYS_UP)).toBe(0.25);
    // 15 minutes -> 15 minutes = 0.25 hours
    expect(applyMinuteRounding(15, MinuteRoundingPolicy.ALWAYS_UP)).toBe(0.25);
    // 16 minutes -> 30 minutes = 0.5 hours
    expect(applyMinuteRounding(16, MinuteRoundingPolicy.ALWAYS_UP)).toBe(0.5);
    // 44 minutes -> 45 minutes = 0.75 hours
    expect(applyMinuteRounding(44, MinuteRoundingPolicy.ALWAYS_UP)).toBe(0.75);
  });

  it('should round NEAREST_QUARTER correctly', () => {
    // 7 minutes -> 0 minutes = 0 hours (0, 1, ..., 7 -> 0)
    expect(applyMinuteRounding(7, MinuteRoundingPolicy.NEAREST_QUARTER)).toBe(0);
    // 8 minutes -> 15 minutes = 0.25 hours (8, ..., 15, ..., 22 -> 15)
    expect(applyMinuteRounding(8, MinuteRoundingPolicy.NEAREST_QUARTER)).toBe(0.25);
    // 22 minutes -> 15 minutes = 0.25 hours
    expect(applyMinuteRounding(22, MinuteRoundingPolicy.NEAREST_QUARTER)).toBe(0.25);
    // 23 minutes -> 30 minutes = 0.5 hours
    expect(applyMinuteRounding(23, MinuteRoundingPolicy.NEAREST_QUARTER)).toBe(0.5);
    // 37 minutes -> 30 minutes = 0.5 hours
    expect(applyMinuteRounding(37, MinuteRoundingPolicy.NEAREST_QUARTER)).toBe(0.5);
    // 38 minutes -> 45 minutes = 0.75 hours
    expect(applyMinuteRounding(38, MinuteRoundingPolicy.NEAREST_QUARTER)).toBe(0.75);
  });

  it('should sanitize input to avoid floating point drift', () => {
    // 44.9999999 -> 45 -> 0.75 (EXACT)
    expect(applyMinuteRounding(44.9999999, MinuteRoundingPolicy.EXACT)).toBe(0.75);
    // 45.0000001 -> 45 -> 0.75 (EXACT)
    expect(applyMinuteRounding(45.0000001, MinuteRoundingPolicy.EXACT)).toBe(0.75);
  });

  it('should fallback to EXACT for unknown policy', () => {
    // @ts-ignore - testing runtime fallback
    expect(applyMinuteRounding(45, 'UNKNOWN')).toBe(0.75);
  });
});
