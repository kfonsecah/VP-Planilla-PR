# Phase 18: Normalización y Trazabilidad - Research

**Researched:** 2026-04-05
**Domain:** Prisma enum migrations, type normalization layer, PostgreSQL aggregation queries
**Confidence:** HIGH

## Summary

This phase adds two new enum fields (`status`, `source`) to the `vpg_clock_logs` table and converts the existing `clock_logs_log_type` from a free-form VARCHAR to a canonical IN/OUT system. The normalization function already exists in `ClockLogsController.ts` but needs to be extracted to a shared utility and hardened to reject unknown values (NORM-03). The stats endpoint (TRACK-03) is a straightforward PostgreSQL `GROUP BY` aggregation that Prisma Client can handle with `groupBy`.

The key architectural decision is whether to use Prisma enums (PostgreSQL native enums) or keep VARCHAR with CHECK constraints. Prisma 6 fully supports native enums and provides type safety at the client level. However, PostgreSQL native enums have a known limitation: adding values requires `ALTER TYPE ... ADD VALUE` which Prisma Migrate handles but cannot roll back. For this use case, Prisma enums are the right choice — the enum values are stable and unlikely to change.

**Primary recommendation:** Use Prisma enums for `ClockLogType`, `ClockLogStatus`, and `ClockLogSource`. Extract normalization to a shared utility in `src/backend/src/utils/`. Add composite indexes for the stats query.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma ORM | 6.19.2 | Schema migration, type-safe queries | Already in use; native enum support for PostgreSQL |
| @prisma/client | 6.19.2 | Generated TypeScript client | Type-safe access to enum values |
| Express 5 | 5.1.0 | Stats endpoint routing | Existing backend framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest-mock-extended | (existing) | Mock Prisma in unit tests | Already used in ClockLogsService tests |
| Zod | ^4.0.17 | Validate stats query params | Existing validation layer |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma native enums | VARCHAR + CHECK constraint | More flexible at DB level, but loses Prisma type safety |
| Prisma `groupBy` | Raw SQL `$queryRaw` | More control but loses type safety; unnecessary for simple aggregations |

**Installation:** No new packages needed. All dependencies already present.

**Version verification:**
```bash
npm view @prisma/client version  # 6.19.2 (verified 2026-04-05)
npm view express version          # 5.1.0 (verified in package.json)
```

## Architecture Patterns

### Recommended Project Structure

```
src/backend/
├── prisma/
│   └── schema.prisma          # Add 3 enums, 2 new fields to vpg_clock_logs
├── src/
│   ├── utils/
│   │   └── clockLogNormalization.ts  # NEW: shared normalizeLogType + validateLogType
│   ├── service/
│   │   └── ClockLogsService.ts       # Add getStats method
│   ├── controller/
│   │   └── ClockLogsController.ts    # Use shared normalization, add stats handler
│   ├── routes/
│   │   └── ClockLogsRoute.ts         # Add GET /clock-logs/stats route
│   ├── model/
│   │   └── clockLog.ts               # Update ClockLogs interface with status, source
│   └── __tests__/
│       └── unit/
│           ├── utils/
│           │   └── clockLogNormalization.test.ts  # NEW: normalization tests
│           └── services/
│               └── ClockLogsService.test.ts       # Extend with getStats tests
```

### Pattern 1: Prisma Native Enums for PostgreSQL

**What:** Define enum types in Prisma schema that map to PostgreSQL native enums.

**When to use:** When enum values are stable, finite, and you want type safety at the Prisma Client level.

**⚠️ Critical: Existing data migration required**

When changing `clock_logs_log_type` from `String @db.VarChar(10)` to `ClockLogType`, PostgreSQL needs to cast existing values. The generated migration from Prisma will include:
```sql
ALTER TABLE "vpg_clock_logs" ALTER COLUMN "clock_logs_log_type" TYPE "ClockLogType" USING "clock_logs_log_type"::"ClockLogType";
```

This `USING` cast will **fail** if any existing value isn't exactly `'IN'` or `'OUT'` (case-sensitive). You MUST add a pre-step to the migration SQL:
```sql
-- Run BEFORE the ALTER COLUMN TYPE
UPDATE "vpg_clock_logs"
SET "clock_logs_log_type" = CASE
  WHEN LOWER("clock_logs_log_type") IN ('in', 'entrada', 'entry', 'start', 'check_in', 'checkin', 'almuerzo_entrada', 'lunch_in', 'break_in', 'entrada almuerzo') THEN 'IN'
  WHEN LOWER("clock_logs_log_type") IN ('out', 'salida', 'exit', 'end', 'check_out', 'checkout', 'salida final', 'fin turno', 'almuerzo', 'almuerzo_salida', 'lunch_out', 'break_out', 'salida almuerzo') THEN 'OUT'
  ELSE 'IN'
END;
```

**How to do this:** Run `npx prisma migrate dev --create-only` to generate the migration without applying it, then edit the generated SQL file to insert the UPDATE statement before the ALTER COLUMN line.

**Example:**
```prisma
// src/backend/prisma/schema.prisma

enum ClockLogType {
  IN
  OUT
}

enum ClockLogStatus {
  pending
  valid
  anomaly
  corrected
  orphan
}

enum ClockLogSource {
  java_import
  excel_import
  manual
}

model vpg_clock_logs {
  clock_logs_id          Int             @id @default(autoincrement())
  clock_logs_employee_id Int
  clock_logs_timestamp   DateTime        @db.Timestamp(6)
  clock_logs_log_type    ClockLogType    // Changed from String @db.VarChar(10)
  clock_logs_remarks     String?
  clock_logs_version     Int             @default(1)
  clock_logs_status      ClockLogStatus  @default(pending)  // NEW
  clock_logs_source      ClockLogSource  @default(manual)   // NEW
  vpg_employees          vpg_employees   @relation(fields: [clock_logs_employee_id], references: [employee_id], onDelete: NoAction, onUpdate: NoAction, map: "fk_vpg_clock_logs_employees_16")

  @@unique([clock_logs_employee_id, clock_logs_timestamp, clock_logs_log_type], map: "uq_vpg_clock_logs_emp_ts_type")
  @@index([clock_logs_employee_id], map: "idx_vpg_clock_logs_employee_id")
  @@index([clock_logs_timestamp], map: "idx_vpg_clock_logs_timestamp")
  @@index([clock_logs_status], map: "idx_vpg_clock_logs_status")       // NEW
  @@index([clock_logs_source], map: "idx_vpg_clock_logs_source")       // NEW
  @@index([clock_logs_status, clock_logs_source], map: "idx_vpg_clock_logs_status_source") // NEW: for stats query
}
```

### Pattern 2: Normalization Layer (Extracted Utility)

**What:** A pure function module that normalizes and validates clock log types from any origin.

**When to use:** When multiple entry points (Java import, Excel import, manual entry, existing controller) all need the same normalization logic.

**Example:**
```typescript
// src/backend/src/utils/clockLogNormalization.ts

export type CanonicalLogType = 'IN' | 'OUT';

const IN_TYPES = new Set([
  'in', 'entrada', 'entry', 'start', 'check_in', 'checkin',
  'almuerzo_entrada', 'lunch_in', 'break_in', 'entrada almuerzo'
]);

const OUT_TYPES = new Set([
  'out', 'salida', 'exit', 'end', 'check_out', 'checkout',
  'salida final', 'fin turno',
  'almuerzo', 'almuerzo_salida', 'lunch_out', 'break_out', 'salida almuerzo'
]);

/**
 * Normalizes any clock log type variant to canonical IN/OUT.
 * @param value - Raw log type from any source
 * @returns 'IN' | 'OUT'
 * @throws Error if value cannot be normalized
 */
export function normalizeLogType(value: string): CanonicalLogType {
  const v = value.toLowerCase().trim();
  if (IN_TYPES.has(v)) return 'IN';
  if (OUT_TYPES.has(v)) return 'OUT';
  throw new Error(`Tipo de marca desconocido: "${value}". Valores aceptados: IN, OUT, ENTRADA, SALIDA`);
}

/**
 * Validates that a value is already a canonical IN/OUT.
 * Use after normalization to enforce NORM-03.
 */
export function isValidCanonicalType(value: string): value is CanonicalLogType {
  return value === 'IN' || value === 'OUT';
}
```

### Pattern 3: Stats Aggregation with Prisma groupBy

**What:** Use Prisma's `groupBy` API to get counts grouped by status and source.

**When to use:** When you need aggregated counts across two dimensions with date range filtering.

**Example:**
```typescript
// In ClockLogsService.ts
async getStats(initDate: Date, endDate: Date): Promise<
  Array<{ clock_logs_status: string; clock_logs_source: string; _count: number }>
> {
  const stats = await prisma.vpg_clock_logs.groupBy({
    by: ['clock_logs_status', 'clock_logs_source'],
    where: {
      clock_logs_timestamp: { gte: initDate, lte: endDate }
    },
    _count: true
  });
  return stats;
}
```

### Anti-Patterns to Avoid

- **Don't keep normalization in the controller:** The current `normalizeLogType` in `ClockLogsController.ts` returns the original value uppercase for unknown types (line 18). This violates NORM-03. Extract to utility and throw on unknown values.
- **Don't use raw SQL for stats:** Prisma `groupBy` is type-safe and sufficient. Raw SQL adds maintenance burden.
- **Don't use VARCHAR for enum fields:** Loses Prisma type safety. The values are stable and finite.
- **Don't add indexes on every new field individually:** Add a composite index on `(status, source)` since the stats query filters on both.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Enum type safety | Manual string validation everywhere | Prisma native enums | Compile-time type safety, DB-level constraints, auto-generated TypeScript types |
| Type normalization | Ad-hoc normalization in each controller | Shared utility in `src/utils/` | Currently duplicated between controller and frontend; single source of truth prevents drift |
| Stats aggregation | Manual loops over all records | Prisma `groupBy` | O(n) in JS vs O(1) in DB; composite index makes it fast |
| Date range filtering | Manual date parsing in controller | `new Date()` with Prisma `gte`/`lte` | Existing pattern in ClockLogsService, already tested |
| Excel date parsing | Custom Excel serial date converter | ExcelJS library (already installed) | Already used in attendance page; handles timezone edge cases |

**Key insight:** The normalization function already exists in two places (controller + frontend page) with DIFFERENT mappings. The controller maps to `IN/OUT` while the frontend maps to `CHECK_IN/LUNCH_OUT/LUNCH_IN/CHECK_OUT`. Phase 18 must establish `IN/OUT` as the single canonical format in the database. The frontend's richer normalization (lunch breaks) should remain a display-layer concern, not a storage-layer concern.

## Common Pitfalls

### Pitfall 1: PostgreSQL Enum Migration Cannot Be Rolled Back
**What goes wrong:** `ALTER TYPE ... ADD VALUE` in PostgreSQL is a DDL operation that cannot be rolled back within a transaction. If a migration fails partway through, the enum may be partially modified.
**Why it happens:** PostgreSQL limitation, not Prisma bug.
**How to avoid:** Run `npx prisma migrate dev` in a development environment first. For production, use `npx prisma migrate deploy` with a backup. Prisma 6 handles enum additions correctly but always test migrations.
**Warning signs:** Migration error mentioning "cannot be executed inside a transaction block" — this is expected for enum additions, not a failure.

### Pitfall 1b: Enum Type Cast Failure on Existing Data
**What goes wrong:** When changing `clock_logs_log_type` from `String @db.VarChar(10)` to a Prisma enum, PostgreSQL attempts to cast existing values. Any value that isn't exactly `'IN'` or `'OUT'` (case-sensitive) causes the migration to fail with `invalid input value for enum`.
**Why it happens:** PostgreSQL enum casts are strict — they don't do case-insensitive matching or alias resolution. The current VARCHAR(10) field may contain legacy values like `ENTRADA`, `SALIDA`, or other variants.
**How to avoid:** Include a SQL `UPDATE` pre-step in the migration **before** the `ALTER COLUMN ... TYPE` statement. Use `prisma migrate dev --create-only` to generate the migration, then edit the SQL file to insert the data cleanup. Example:
```sql
UPDATE "vpg_clock_logs"
SET "clock_logs_log_type" = CASE
  WHEN LOWER("clock_logs_log_type") IN ('in', 'entrada', 'entry', 'start', 'check_in', 'checkin', 'almuerzo_entrada', 'lunch_in', 'break_in', 'entrada almuerzo') THEN 'IN'
  WHEN LOWER("clock_logs_log_type") IN ('out', 'salida', 'exit', 'end', 'check_out', 'checkout', 'salida final', 'fin turno', 'almuerzo', 'almuerzo_salida', 'lunch_out', 'break_out', 'salida almuerzo') THEN 'OUT'
  ELSE 'IN'
END;
```
**Warning signs:** `npx prisma migrate dev` fails with `P3018` error (migration failed to apply) or `invalid input value for enum "ClockLogType"`.

### Pitfall 2: Normalization Function Silently Passing Unknown Values
**What goes wrong:** The current `normalizeLogType()` in `ClockLogsController.ts` (line 18) returns `value.toUpperCase()` for unknown values. This means garbage data can be stored as-is, violating NORM-03.
**Why it happens:** The function was designed to be lenient for import compatibility, but NORM-03 requires strict rejection.
**How to avoid:** Change the fallback to `throw new Error(...)` with the rejected value in the message. Update the controller to catch and return 400 with descriptive error.
**Warning signs:** Database contains `log_type` values that are neither `'IN'` nor `'OUT'`.

### Pitfall 3: Frontend-Backend Normalization Mismatch
**What goes wrong:** The frontend attendance page normalizes to `CHECK_IN/LUNCH_OUT/LUNCH_IN/CHECK_OUT` while the backend normalizes to `IN/OUT`. After Phase 18, the frontend must be updated to expect `IN/OUT` from the API.
**Why it happens:** Different normalization layers evolved independently.
**How to avoid:** The frontend normalization should remain as a DISPLAY-ONLY concern. The API contract changes from returning raw `log_type` to returning canonical `IN/OUT`. Frontend can map `IN` → `CHECK_IN` for display purposes if needed.
**Warning signs:** Frontend TypeScript errors after schema change; `normalizeLogType` in frontend returns `null` for `IN`/`OUT` values.

### Pitfall 4: Frontend/Backend Normalization Drift
**What goes wrong:** The frontend `attendance/page.tsx` has its own `normalizeLogType()` function that maps to `CHECK_IN`/`LUNCH_OUT`/`LUNCH_IN`/`CHECK_OUT` — a different set of canonical values than the backend's `IN`/`OUT`.
**Why it happens:** Frontend normalization is for display purposes (4-state), backend normalization is for storage (2-state). They serve different purposes.
**How to avoid:** Keep them separate. Backend normalization (IN/OUT) is for persistence. Frontend normalization (CHECK_IN/etc.) is for display grouping. Document this distinction clearly. The backend should NOT adopt the 4-state model — that's a display concern.
**Warning signs:** Backend starts storing `CHECK_IN` or `LUNCH_OUT` as `log_type` values.

### Pitfall 5: Stats Query Performance on Large Tables
**What goes wrong:** Stats query becomes slow as clock_logs table grows without proper indexes.
**Why it happens:** `groupBy` on unindexed columns requires full table scan.
**How to avoid:** Add composite index `@@index([clock_logs_status, clock_logs_source])` and ensure the date range filter uses the existing `clock_logs_timestamp` index.
**Warning signs:** Query takes >100ms on tables with >10k records.

### Pitfall 6: Dead Code in Controller After Refactoring
**What goes wrong:** The `ClockLogsController.ts` has a dead variable `nomineeLogs` (line 81-92) that's assigned after a `return` statement and never used. TypeScript `--noEmit` doesn't catch this because the variable is typed.
**Why it happens:** Leftover from a previous refactor.
**How to avoid:** Clean it up as part of the controller refactoring in this phase.
**Warning signs:** Unreachable code after `return` statement.

### Pitfall 7: Default Values for Existing Records
**What goes wrong:** Adding `status` and `source` fields to existing records without defaults causes null constraint violations.
**Why it happens:** Existing `vpg_clock_logs` records don't have these fields.
**How to avoid:** Use `@default(pending)` for status and `@default(manual)` for source in the Prisma schema. Prisma Migrate will set these defaults for existing rows. Alternatively, use a data migration to set `source = 'java_import'` for records that came from the Java parser.

## Code Examples

Verified patterns from Prisma 6 documentation and existing codebase:

### Prisma Enum Definition
```prisma
// Source: Prisma 6 schema patterns
enum ClockLogType {
  IN
  OUT
}

enum ClockLogStatus {
  pending
  valid
  anomaly
  corrected
  orphan
}

enum ClockLogSource {
  java_import
  excel_import
  manual
}
```

### Normalization Function (Extracted Utility)
```typescript
// Source: Adapted from ClockLogsController.ts normalizeLogType (existing)
export type CanonicalLogType = 'IN' | 'OUT';

const IN_TYPES = new Set([
  'in', 'entrada', 'entry', 'start', 'check_in', 'checkin',
  'almuerzo_entrada', 'lunch_in', 'break_in', 'entrada almuerzo'
]);

const OUT_TYPES = new Set([
  'out', 'salida', 'exit', 'end', 'check_out', 'checkout',
  'salida final', 'fin turno',
  'almuerzo', 'almuerzo_salida', 'lunch_out', 'break_out', 'salida almuerzo'
]);

export function normalizeLogType(value: string): CanonicalLogType {
  const v = value.toLowerCase().trim();
  if (IN_TYPES.has(v)) return 'IN';
  if (OUT_TYPES.has(v)) return 'OUT';
  throw new Error(`Tipo de marca desconocido: "${value}". Valores aceptados: IN, OUT, ENTRADA, SALIDA`);
}
```

### Stats Aggregation Query
```typescript
// Source: Prisma 6 groupBy API pattern
async getStats(initDate: Date, endDate: Date) {
  const stats = await prisma.vpg_clock_logs.groupBy({
    by: ['clock_logs_status', 'clock_logs_source'],
    where: {
      clock_logs_timestamp: {
        gte: initDate,
        lte: endDate
      }
    },
    _count: true
  });
  // Returns: [{ clock_logs_status: 'pending', clock_logs_source: 'java_import', _count: 42 }, ...]
  return stats;
}
```

### Stats Endpoint Response Shape
```typescript
// Controller response for GET /api/clock-logs/stats
// {
//   success: true,
//   data: {
//     byStatus: { pending: 42, valid: 120, anomaly: 3, corrected: 5, orphan: 2 },
//     bySource: { java_import: 80, excel_import: 75, manual: 17 },
//     total: 172
//   }
// }
```

### Migration Order (Critical)
```bash
# Step 1: Data cleanup — normalize existing log_type values
# Step 2: Add enum types and new columns to schema.prisma
# Step 3: npx prisma migrate dev --name add_clock_log_enums_and_tracing
# Step 4: npx prisma generate
# Step 5: Update TypeScript types and services
# Step 6: Run tests
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| VARCHAR for enum-like fields | Prisma native enums | Prisma 5+ | Type safety at compile time, DB-level constraints |
| Manual aggregation in JS | Prisma `groupBy` | Prisma 4.0+ | Database-level aggregation, type-safe results |
| Normalization in controller | Shared utility module | Best practice | Single source of truth, testable in isolation |
| No tracing on records | Status + source fields | This phase | Enables orphan/anomaly detection in later phases |

**Deprecated/outdated:**
- Returning raw `log_type` from API: The current API returns whatever was stored (could be `ENTRADA`, `IN`, etc.). After Phase 18, the API MUST return canonical `IN/OUT`.
- Frontend normalization as storage concern: The frontend's `CHECK_IN/LUNCH_OUT/LUNCH_IN/CHECK_OUT` mapping is a display concern, not a storage concern.

## Open Questions

1. **What should existing records default to for `source`?**
   - What we know: Existing records came from either Java import or the bulk create endpoint (which is used by both Java and Excel).
   - What's unclear: There's no way to distinguish Java-imported from Excel-imported records in the current schema.
   - **Recommendation:** Default existing records to `source = 'java_import'` since the bulk endpoint is primarily used by the Java parser. Future Excel imports will explicitly set `source = 'excel_import'`. This should be documented as a one-time assumption.

2. **Should the `clock_logs_log_type` enum include lunch/break types?**
   - What we know: The frontend normalizes to `CHECK_IN/LUNCH_OUT/LUNCH_IN/CHECK_OUT`. The backend currently maps lunch types to `IN/OUT`.
   - What's unclear: Whether lunch breaks should be stored as separate types or derived from IN/OUT sequences.
   - **Recommendation:** Keep the database enum as `IN/OUT` only. Lunch break detection is a display-layer concern (Phase 22 UI) or a derived computation, not a storage concern. This aligns with NORM-01's requirement for "un valor canónico único (IN/OUT)".

3. **Should `normalizeLogType` be called in the controller or the service?**
   - What we know: Currently it's in the controller. Best practice is controllers parse requests, services handle business logic.
   - **Recommendation:** Keep normalization in the controller layer (it's request parsing), but extract the function to a shared utility so both controller and future import services can use it. The service should receive already-normalized `IN/OUT` values.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Schema migration, stats queries | ✓ | (via Prisma) | — |
| Prisma CLI | Migration generation | ✓ | 6.19.2 | — |
| Node.js 22 | Backend runtime | ✓ | 22.14.0 | — |
| Jest + ts-jest | Unit tests | ✓ | ^29.7.0 | — |
| jest-mock-extended | Prisma mocking in tests | ✓ | (installed) | — |

**All dependencies available.** No missing dependencies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest |
| Config file | `src/backend/jest.config.js` |
| Quick run command | `npm test -- --testPathPattern="ClockLogs" -x` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NORM-01 | Canonical IN/OUT storage | unit | `npm test -- --testPathPattern="clockLogNormalization" -x` | ❌ Wave 0 |
| NORM-02 | Excel ENTRADA/SALIDA → IN/OUT | unit | `npm test -- --testPathPattern="clockLogNormalization" -x` | ❌ Wave 0 |
| NORM-03 | Reject unknown types with error | unit | `npm test -- --testPathPattern="clockLogNormalization" -x` | ❌ Wave 0 |
| TRACK-01 | status field defaults to pending | unit | `npm test -- --testPathPattern="ClockLogsService" -x` | ❌ Wave 0 |
| TRACK-02 | source field set on creation | unit | `npm test -- --testPathPattern="ClockLogsService" -x` | ❌ Wave 0 |
| TRACK-03 | GET /api/clock-logs/stats returns grouped counts | unit | `npm test -- --testPathPattern="ClockLogsService" -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern="ClockLogs|clockLogNormalization" -x`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/backend/src/__tests__/unit/utils/clockLogNormalization.test.ts` — covers NORM-01, NORM-02, NORM-03
- [ ] Extend `src/backend/src/__tests__/unit/services/ClockLogsService.test.ts` — add tests for status/source defaults and getStats
- [ ] Tests for stats endpoint response shape (TRACK-03)

## Sources

### Primary (HIGH confidence)
- **Prisma 6.19.2** (installed) — Enum support verified via `npx prisma --version`
- **Prisma Schema Reference** — Enum syntax, groupBy API, index patterns
- **Existing codebase** — `ClockLogsController.ts` normalization function, `ClockLogsService.ts` patterns, `ClockLogsService.test.ts` test patterns

### Secondary (MEDIUM confidence)
- **PostgreSQL enum limitations** — `ALTER TYPE ... ADD VALUE` cannot be rolled back (well-documented PostgreSQL behavior)
- **Prisma Migrate enum handling** — Prisma 6 generates separate migration steps for enum additions vs. column alterations

### Tertiary (LOW confidence)
- **Performance of groupBy on large tables** — Composite index recommendation based on general PostgreSQL knowledge, not benchmarked on this specific schema

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All packages verified against installed versions
- Architecture: HIGH — Patterns verified from existing codebase + Prisma 6 docs
- Pitfalls: HIGH — PostgreSQL enum limitations are well-documented; existing data mismatch verified by reading current schema
- Migration order: HIGH — Based on Prisma Migrate behavior with enums

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (30 days — Prisma 6 is stable, patterns won't change)
