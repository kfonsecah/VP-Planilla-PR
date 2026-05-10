# Phase 59: Tarifa Mínima Global (Opcional) - Research

**Researched:** 2026-04-26
**Domain:** Database seeding + Backend service layer (Legal Parameters)
**Confidence:** HIGH

## Summary

Phase 59 introduces a global reference parameter for minimum hourly wages in Costa Rica. This replaces the complexity of a full occupational category catalog by providing a single, configurable "floor" for payroll warnings.

The primary implementation involves seeding the `GLOBAL_MIN_WAGE_RATE` key in the `vpg_legal_params` table and extending `LegalParamService` to retrieve this value based on the effective date.

**Primary recommendation:** Use **¢1,529.62** as the default reference rate (based on Costa Rica's 2025 MTSS decree for unskilled workers) and implement a dedicated getter in `LegalParamService` that fallbacks to this value if the database record is missing.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rate Storage | Database (Prisma) | — | Persistent storage in `vpg_legal_params` with effective dates. |
| Rate Retrieval | Backend Service | — | `LegalParamService` resolves the correct rate for a given period. |
| Compliance Config | Database Seed | — | Initial legal values from MTSS decrees (2024 and 2025). |
| Rate Management | API / Backend | — | Generic `upsertParam` (Phase 55) handles updates to this rate. |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Parameter Key:** `GLOBAL_MIN_WAGE_RATE` in `vpg_legal_params`.
- **Purpose:** Reference rate for payroll warnings (not a hard block in this phase).
- **Service Method:** `async getGlobalMinWageRate(date: Date): Promise<number>`.
- **Dependency:** Requires Phase 55 foundation.

### the agent's Discretion
- **Default value:** Recommendation provided based on MTSS 2025 Decree.
- **Seeding strategy:** Recommended to include historical 2024 value for testing date-effective logic.

### Deferred Ideas (OUT OF SCOPE)
- **Job Category Catalog:** Field `categoria_ocupacional` in `vpg_positions` is explicitly discarded.
- **Hard Blocking:** Payroll approval block is moved to Phase 60.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-24 | Añadir parámetro global `GLOBAL_MIN_WAGE_RATE` | MTSS 2025 decree verified: ¢1,529.62/hour. |
| PAY-24 | Método `getGlobalMinWageRate(date)` | `LegalParamService` patterns from Phase 55 verified. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.14.0 | ORM | Used for seeding and data retrieval. |
| TypeScript | 5.8.3 | Type Safety | Enforces `LegalParamSet` and DTO shapes. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Decimal.js | (via Prisma) | Precision | Handling currency values in the database. |

## Architecture Patterns

### Recommended Project Structure
```
src/backend/
├── prisma/
│   └── seed.ts                # Update to include GLOBAL_MIN_WAGE_RATE
├── src/
│   ├── service/
│   │   └── LegalParamService.ts  # Add getGlobalMinWageRate method
│   └── __tests__/
│       └── unit/
│           └── services/
│               └── LegalParamService.test.ts # Add tests for the new method
```

### Pattern 1: Date-Effective Retrieval
**What:** Retrieving the most recent parameter where `validFrom <= targetDate`.
**When to use:** All legal parameter lookups.
**Example:**
```typescript
// Pattern established in Phase 55
static async getParamAtDate(key: string, date: Date): Promise<VpgLegalParam | null> {
  return await prisma.vpgLegalParam.findFirst({
    where: {
      key,
      validFrom: { lte: date },
      isActive: true,
    },
    orderBy: { validFrom: 'desc' },
  });
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Wage Rate Math | Custom division for hourly rate | MTSS Decree hourly value | Decrees specify the hourly rate for non-monthly workers (jornaleros); manual division can vary by 0.01. |
| Parameter Storage | Local constants | `vpg_legal_params` table | Hardcoded values prevent legal compliance across period boundaries. |

**Key insight:** Always trust the official MTSS decree value for "Jornada No Calificada" as the absolute minimum reference.

## Common Pitfalls

### Pitfall 1: Missing Database Records
**What goes wrong:** `getGlobalMinWageRate` returns `null` or `0` if the seed wasn't run.
**Why it happens:** Local development database might not be up-to-date.
**How to avoid:** Implement a hardcoded fallback in the service method that matches the current year's legal minimum.

### Pitfall 2: Timezone Bias at Year Boundaries
**What goes wrong:** A payroll starting on Jan 1st might pick the Dec 31st rate if timezones aren't handled as UTC.
**Why it happens:** `validFrom` is stored as `DateTime`.
**How to avoid:** Use `Z` suffix in seed dates (e.g., `2025-01-01T00:00:00.000Z`).

## Code Examples

Verified patterns from official sources:

### Seeding (src/backend/prisma/seed.ts)
```typescript
// Source: MTSS Decreto N° 44756-MTSS (Costa Rica 2025)
const MIN_WAGE_2025 = 1529.62;
const MIN_WAGE_2024 = 1494.20;

const minWageParams = [
  {
    key: 'GLOBAL_MIN_WAGE_RATE',
    value: MIN_WAGE_2024,
    description: 'Tarifa mínima por hora (Referencia MTSS 2024)',
    category: 'MIN_WAGE',
    validFrom: new Date('2024-01-01T00:00:00.000Z'),
    isCritical: true,
  },
  {
    key: 'GLOBAL_MIN_WAGE_RATE',
    value: MIN_WAGE_2025,
    description: 'Tarifa mínima por hora (Referencia MTSS 2025)',
    category: 'MIN_WAGE',
    validFrom: new Date('2025-01-01T00:00:00.000Z'),
    isCritical: true,
  }
];
```

### Service Method (src/backend/src/service/LegalParamService.ts)
```typescript
/**
 * Get the global minimum wage rate (CRC per hour) effective at a given date.
 * Fallback to 1529.62 (2025 standard) if not found.
 * @param date - Date to check
 */
static async getGlobalMinWageRate(date: Date = new Date()): Promise<number> {
  const param = await this.getParamAtDate('GLOBAL_MIN_WAGE_RATE', date);
  // [VERIFIED: MTSS 2025] 1529.62 is the base rate for unskilled workers
  return param ? Number(param.value) : 1529.62;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded min wage | `vpg_legal_params` lookup | Phase 59 | Allows annual updates without code deployment. |
| Job-specific categories | Global reference rate | Phase 59 (Decision) | Simplifies admin; avoids MTSS catalog maintenance. |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ¢1,529.62 is the preferred reference | Summary | Minimal; it's the lowest possible legal rate (unskilled). |
| A2 | User expects 2024/2025 history | Seeding | Low; helps verify date-effective logic. |

## Open Questions (RESOLVED)

1. **Should the rate be included in `LegalParamSet`?**
   - Recommendation: [RESOLVED] Yes, to ensure the Motor (Phase 56) can access it without extra DB calls.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Prisma | Seeding | ✓ | ^6.14.0 | — |
| Database | Persistence | ✓ | PostgreSQL | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest |
| Quick run command | `npm test -- LegalParamService.test.ts` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| PAY-24 | Seeding exists | integration | `npx prisma db seed` (verification only) |
| PAY-24 | Correct rate for 2024 date | unit | `npm test` (with mocked Prisma) |
| PAY-24 | Correct rate for 2025 date | unit | `npm test` (with mocked Prisma) |

## Sources

### Primary (HIGH confidence)
- `59-CONTEXT.md` - Phase scope and requirements.
- `LegalParamService.ts` - Existing codebase patterns.
- [MTSS Costa Rica Decreto 44756](https://www.mtss.go.cr) - Verification of 2025 minimum wage (¢1,529.62/hr).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Standard Prisma patterns used.
- Architecture: HIGH - Consistent with Phase 55.
- Pitfalls: HIGH - Timezone and missing record issues identified.

**Research date:** 2026-04-26
**Valid until:** 2026-05-26
