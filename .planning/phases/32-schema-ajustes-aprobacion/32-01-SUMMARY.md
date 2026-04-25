---
phase: 32
plan: 01
subsystem: database
tags: [schema, migration, prisma, enums, adjustment-layer, payroll-state-machine]
dependency_graph:
  requires: []
  provides: [vpg_clock_log_adjustments, vpg_payroll_recalculations, PayrollStatus, ClockLogAdjustmentType]
  affects: [PayrollService, ClockLogsService, model/payroll, model/clockLog]
tech_stack:
  added: [PayrollStatus enum, ClockLogAdjustmentType enum, ClockLogAdjustmentStatus enum]
  patterns: [optimistic-locking via adjustment_version, soft-delete via adjustment_status, audit-trail via vpg_payroll_recalculations]
key_files:
  created:
    - src/backend/prisma/migrations/20260413_phase_32_schema_refinement/migration.sql
  modified:
    - src/backend/prisma/schema.prisma
    - src/backend/src/model/clockLog.ts
    - src/backend/src/model/payroll.ts
decisions:
  - "Used prisma migrate resolve --applied to bypass shadow DB limitation caused by column reference in 0_init DEFAULT expression (vacations_total_days), then applied SQL directly"
  - "Mapped CALCULADO->BORRADOR and PAGADO->PAGADA for existing payroll status data before enum conversion"
  - "PayrollStatus enum uses Spanish values (BORRADOR/APROBADA/PAGADA) matching Costa Rican business domain"
metrics:
  duration: "~25 minutes"
  completed_date: "2026-04-13"
  tasks_completed: 2
  files_changed: 4
---

# Phase 32 Plan 01: Schema Ajustes y Aprobacion Summary

**One-liner:** PostgreSQL schema extended with adjustment layer (vpg_clock_log_adjustments) and payroll state machine (PayrollStatus enum + approval/reopen audit fields on vpg_payrolls).

## What Was Built

Two new database tables and three new enums provide the structural foundation for non-destructive clock log edits and payroll lifecycle management:

- **vpg_clock_log_adjustments**: Audit table for non-destructive clock log edits. Supports ADD (missing mark), EDIT (timestamp correction), and VOID (soft delete) types. Nullable FK to vpg_clock_logs (null for ADD), required FK to vpg_employees, optimistic locking via `adjustment_version`.
- **vpg_payroll_recalculations**: Audit trail for payroll recalculations. Stores reason, creator, timestamp, and a JSONB snapshot of payroll_employee data before recalc.
- **PayrollStatus enum**: Type-safe state machine values BORRADOR/APROBADA/PAGADA replacing the unconstrained VarChar(20) `payrolls_status` column.
- **vpg_payrolls extensions**: Five new fields — `payrolls_approved_by` (FK to vpg_users), `payrolls_approved_at`, `payrolls_notes`, `payrolls_reopened_at`, `payrolls_reopen_reason`.
- **ClockLogSource.device**: New enum value for device-sourced clock logs.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Update schema.prisma with new models and enums | 1d37277 |
| 2 | Apply migration and generate Prisma Client | 1d37277 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ClockLogs model missing `device` source value**
- **Found during:** Task 2 (TypeScript check after schema change)
- **Issue:** `ClockLogs` interface in `src/backend/src/model/clockLog.ts` had `source: 'java_import' | 'excel_import' | 'manual'` — missing the new `device` value added to `ClockLogSource` enum
- **Fix:** Added `| 'device'` to the union type
- **Files modified:** `src/backend/src/model/clockLog.ts`
- **Commit:** 1d37277

**2. [Rule 1 - Bug] Payroll model status field typed as `string`**
- **Found during:** Task 2 (TypeScript check after schema change)
- **Issue:** `Payroll` interface used `status: string` which is no longer assignable from the Prisma-generated `PayrollStatus` enum type
- **Fix:** Imported `PayrollStatus` from `@prisma/client` and updated the type
- **Files modified:** `src/backend/src/model/payroll.ts`
- **Commit:** 1d37277

**3. [Rule 3 - Blocking] Shadow DB limitation prevented `prisma migrate dev`**
- **Found during:** Task 2 (migration run)
- **Issue:** `prisma migrate dev --create-only` failed with `P3006` because `0_init` migration has a column reference in a DEFAULT expression (`vacations_total_days`) that PostgreSQL rejects in a fresh schema
- **Fix:** Created migration SQL manually, used `prisma migrate resolve --applied` to register it in Prisma tracking, then executed SQL statements directly against the database
- **Files modified:** `src/backend/prisma/migrations/20260413_phase_32_schema_refinement/migration.sql`
- **Commit:** 1d37277

### Data Migration Details

Existing `payrolls_status` values were mapped before enum conversion:
- `CALCULADO` (5 rows) → `BORRADOR`
- `PAGADO` (5 rows) → `PAGADA`
- Row count before: 10, after: 10 — no data loss

## Known Stubs

None. All schema fields are concrete — no placeholder or stub data.

## Threat Flags

No new unplanned security surface introduced. All mitigations from the plan's threat model were applied:
- FK constraints enforce referential integrity for adjustments (T-32-01)
- PayrollStatus enum prevents invalid state at DB level (T-32-02)
- `adjustment_version` field in place for optimistic locking (T-32-03)
- `payrolls_approved_by` FK ensures only valid users can be recorded as approver (T-32-04)

## Self-Check: PASSED

- `src/backend/prisma/schema.prisma` — present and validates
- `src/backend/prisma/migrations/20260413_phase_32_schema_refinement/migration.sql` — present
- `src/backend/src/model/clockLog.ts` — updated
- `src/backend/src/model/payroll.ts` — updated
- Commit 1d37277 — confirmed in git log
- `npx tsc --noEmit` — passes (0 errors)
- `npx prisma validate` — passes
- vpg_payrolls row count: 10 before and after
- All new tables and enums confirmed in database
