# Phase 58: Redondeo de Minutos en Motor - Research

**Researched:** 2026-04-27
**Domain:** Payroll Motor / Costa Rica Labor Law
**Confidence:** HIGH

## Summary

This phase implements the three minute-rounding modalities (EXACT, ALWAYS_UP, NEAREST_QUARTER) required by Costa Rica labor law and company policy. The core research focus was ensuring precision during the conversion from time marks to monetary value, avoiding cumulative floating-point errors.

**Primary recommendation:** Use integer minutes as the base unit for all daily work aggregations, applying the rounding policy only to the total daily minutes before converting to decimal hours for salary calculation.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Minute Rounding Logic | Backend (Util) | — | Pure mathematical conversion based on legal/enterprise parameters. |
| Policy Retrieval | Backend (Service) | DB | NomineeService loads the policy from `vpg_enterprise` via `LegalParamService`. |
| Rounding Execution | Backend (Service) | — | NomineeService applies the rounding during daily hour aggregation. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.8.3 | Type safety | Project standard. |
| Node.js | 22.14.0 | Runtime | Project standard. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Jest | 29.7.0 | Unit Testing | Exhaustive verification of rounding boundaries. |

**Installation:**
No new packages required. Use existing native math functions for precision control.

## Architecture Patterns

### System Architecture Diagram
Data flow for time-to-money conversion:
`Clock Logs (Date)` -> `Effective Marks (Date)` -> `Daily Minutes (Integer)` -> `Apply Policy` -> `Decimal Hours` -> `Rate Multiplication` -> `Gross Salary (Money)`

### Recommended Project Structure
- `src/backend/src/utils/payrollUtils.ts`: Host the pure rounding logic.
- `src/backend/src/types/payroll.types.ts`: Define the `MinuteRoundingPolicy` enum.
- `src/backend/src/service/NomineeService.ts`: Apply the rounding during the payroll calculation loop.

### Pattern 1: Integer-First Rounding
**What:** Convert all work duration intervals to minutes (integers) immediately and sum them before any division.
**When to use:** All payroll calculations involving time to prevent `0.1 + 0.2` IEEE 754 precision issues.
**Example:**
```typescript
// Calculation in minutes
const totalMinutes = Math.round(durationMs / (1000 * 60)); 
const roundedHours = applyMinuteRounding(totalMinutes, policy);
```

### Anti-Patterns to Avoid
- **Per-Interval Rounding:** Rounding each 2-hour work block separately can lead to significant daily discrepancies (e.g., losing 4 mins twice in NEAREST_QUARTER). Always round the daily total.
- **Float-Based Rounding:** Doing `Math.round(hours * 4) / 4` is prone to float precision errors. Use the minute-based formulas provided in Code Examples.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Precision Money Math | Custom `float` math | `roundToMoney` util | Already implemented and tested in `payrollUtils.ts`. |
| Date Difference | Custom MS math | `durationMs` logic | Native `Date.getTime()` is reliable for intervals. |

## Common Pitfalls

### Pitfall 1: NEAREST_QUARTER Boundary Issues
**What goes wrong:** `7.5` minutes rounding to `0` or `15` inconsistently.
**How to avoid:** Use `Math.round(minutes / 15)` which handles the `.5` case (tie-breaking) predictably in JS (rounds to nearest even in some languages, but JS rounds to +Infinity).
**Warning signs:** Tests for `7 min` (must be 0) vs `8 min` (must be 15) failing.

### Pitfall 2: Missing Policy Fallback
**What goes wrong:** Code crashes if `minuteRoundingPolicy` is null in DB.
**How to avoid:** Implement a strict fallback to `EXACT` in the service and utility layer.

## Code Examples

### Minute Rounding Implementation (Pure Function)
```typescript
/**
 * Source: Payroll.md §4.3
 * Applies the minute rounding policy to total daily minutes.
 */
export enum MinuteRoundingPolicy {
  EXACT = 'EXACT',
  ALWAYS_UP = 'ALWAYS_UP',
  NEAREST_QUARTER = 'NEAREST_QUARTER'
}

export function applyMinuteRounding(totalMinutes: number, policy: MinuteRoundingPolicy = MinuteRoundingPolicy.EXACT): number {
  switch (policy) {
    case MinuteRoundingPolicy.ALWAYS_UP:
      // Rounds to the next 15-minute interval
      return Math.ceil(totalMinutes / 15) * 15 / 60;
    case MinuteRoundingPolicy.NEAREST_QUARTER:
      // Rounds to the nearest 15-minute interval (bidirectional)
      return Math.round(totalMinutes / 15) * 15 / 60;
    case MinuteRoundingPolicy.EXACT:
    default:
      // Proportional calculation
      return totalMinutes / 60;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Float hours | Integer minutes | Phase 58 | Elimination of cumulative rounding errors in payroll. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Policy applies to daily sum | Anti-Patterns | Employee might be underpaid if rounded per mark. |
| A2 | EXACT is the default fallback | Common Pitfalls | Legal risk if a rounding that favors the employer is applied by mistake. |

## Open Questions

1. **How to handle overnight shifts?** 
   - Recommendation: The current `ClockLogEffectiveService.pairLogs` handles 24h windows. Rounding should be applied to the total hours assigned to the "Working Day" (usually the day the shift started).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 22.14.0 | — |
| Jest | Testing | ✓ | 29.7.0 | — |
| Prisma | DB Access | ✓ | 6.14.0 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest |
| Config file | `jest.config.js` |
| Quick run command | `npm test src/backend/src/__tests__/unit/payrollUtils.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RND-01 | EXACT (431m -> 7.1833h) | Unit | `npm test` | ❌ Wave 0 |
| RND-02 | ALWAYS_UP (431m -> 7.25h) | Unit | `npm test` | ❌ Wave 0 |
| RND-03 | NEAREST_Q (424m -> 7.00h) | Unit | `npm test` | ❌ Wave 0 |
| RND-04 | NEAREST_Q (438m -> 7.25h) | Unit | `npm test` | ❌ Wave 0 |
| RND-05 | Fallback to EXACT | Unit | `npm test` | ❌ Wave 0 |

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Use Enums and Zod validation for DB configuration. |
| V13 Business Logic | yes | Ensure rounding logic follows Art. 17 CT (in dubio pro operario). |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Integer Overflow (Minutes) | Tampering | Max minutes cap per day (1440). |
| Configuration Injection | Tampering | Restrict `vpg_enterprise` update to Admin role only. |

## Sources

### Primary (HIGH confidence)
- `Payroll.md` - Technical specification for the 3 rounding modalities.
- `src/backend/src/utils/payrollUtils.ts` - Existing codebase analysis.
- `PHASE_CONTRACT.md` - Execution rules and quality gates.

### Secondary (MEDIUM confidence)
- Costa Rica Labor Code (Art. 17, 162-169) - Legal context for rounding risks.
