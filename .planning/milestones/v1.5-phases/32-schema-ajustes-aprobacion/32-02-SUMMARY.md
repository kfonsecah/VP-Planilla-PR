---
phase: 32
plan: 02
subsystem: validation
tags: [zod, schemas, adjustment-layer, payroll-state-machine, input-validation]
dependency_graph:
  requires: [32-01]
  provides: [AdjustmentSchema, RecalculationSchema, PayrollStatus validation, ClockLogSource validation]
  affects: [future adjustment routes, future recalculation routes, PayrollRoutes, ClockLogRoutes]
tech_stack:
  added: [z.discriminatedUnion for adjustment type safety, z.nativeEnum for PayrollStatus]
  patterns: [discriminated-union input validation, nativeEnum binding to Prisma enums]
key_files:
  created:
    - src/backend/src/schemas/AdjustmentSchema.ts
    - src/backend/src/schemas/RecalculationSchema.ts
  modified:
    - src/backend/src/schemas/PayrollSchema.ts
    - src/backend/src/schemas/ClockLogSchema.ts
decisions:
  - "AdjustmentSchema uses z.discriminatedUnion on 'type' so clock_log_id is structurally absent for ADD and required for EDIT/VOID — no runtime branch logic needed"
  - "PayrollSchema binds status to z.nativeEnum(PayrollStatus) with BORRADOR as default — rejects legacy 'PENDIENTE' values at API boundary"
  - "ClockLogSchema gains 'device' as a valid source via a named CLOCK_LOG_SOURCES constant for readability"
  - "z.record() uses two-argument form z.record(z.string(), z.unknown()) for Zod 4 compatibility"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-04-13"
  tasks_completed: 2
  files_changed: 4
---

# Phase 32 Plan 02: Zod Schemas for Adjustments and Recalculations Summary

**One-liner:** Zod validation layer for the adjustment/recalculation models using discriminatedUnion for type-safe ADD/EDIT/VOID branching and nativeEnum binding to Prisma's PayrollStatus.

## What Was Built

- **AdjustmentSchema** (`createAdjustmentSchema`): discriminatedUnion on `type` with three branches:
  - ADD — `employee_id`, `new_timestamp`, `log_type`, `justification` (no `clock_log_id`)
  - EDIT — all ADD fields plus `clock_log_id` required
  - VOID — `employee_id`, `clock_log_id`, `log_type`, `justification` (no `new_timestamp`)
  - All branches enforce `justification` min 10 characters
- **RecalculationSchema** (`createRecalculationSchema`): `payroll_id`, `reason` (min 10 chars), optional `data_snapshot` (JSON record)
- **PayrollSchema updated**: `status` now uses `z.nativeEnum(PayrollStatus)` with `BORRADOR` as default — rejects all legacy/invalid values at the API boundary
- **ClockLogSchema updated**: `clockLogItemSchema` now includes optional `source` field accepting `java_import | excel_import | manual | device`

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create AdjustmentSchema.ts and RecalculationSchema.ts | 27c9bee |
| 2 | Update PayrollSchema and ClockLogSchema for new enums | e5b7eda |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] z.record() requires two arguments in Zod 4**
- **Found during:** Task 2 (tsc --noEmit after creating RecalculationSchema)
- **Issue:** `z.record(z.unknown())` produces TS error `Expected 2-3 arguments, but got 1` under Zod ^4.0.17
- **Fix:** Changed to `z.record(z.string(), z.unknown())` — the two-argument form required by Zod 4
- **Files modified:** `src/backend/src/schemas/RecalculationSchema.ts`
- **Commit:** e5b7eda

## Known Stubs

None. All schemas are fully wired to Prisma-generated enum types with no placeholder values.

## Threat Flags

No new unplanned security surface introduced. Threat mitigations from plan applied:
- T-32-04: `justification` enforces min 10 chars at schema level — garbage data blocked before service layer
- T-32-05: discriminatedUnion structurally prevents `clock_log_id` on ADD branch — cannot accidentally reference a log for ADD type

## Self-Check: PASSED

- `src/backend/src/schemas/AdjustmentSchema.ts` — present
- `src/backend/src/schemas/RecalculationSchema.ts` — present
- `src/backend/src/schemas/PayrollSchema.ts` — updated (nativeEnum PayrollStatus)
- `src/backend/src/schemas/ClockLogSchema.ts` — updated (device source)
- Commit 27c9bee — task 1 confirmed in git log
- Commit e5b7eda — task 2 confirmed in git log
- `npx tsc --noEmit` — passes (0 errors)
