---
phase: 03-validaci-n-de-inputs-y-cors
plan: "01"
subsystem: backend-validation
tags: [cors, zod, validation, middleware, security]
dependency_graph:
  requires: []
  provides:
    - src/backend/src/middleware/validateBody.ts
    - src/backend/src/schemas/EmployeeSchema.ts
    - src/backend/src/schemas/PayrollSchema.ts
    - src/backend/src/schemas/ClockLogSchema.ts
    - src/backend/src/schemas/DeductionSchema.ts
    - src/backend/src/schemas/UserSchema.ts
  affects:
    - src/backend/src/index.ts
tech_stack:
  added:
    - "zod ^4.3.6 (added to package.json dependencies; was transitive only)"
  patterns:
    - "z.coerce.number() for numeric fields from form inputs (Zod 4 syntax)"
    - "validateBody middleware factory at route layer — controllers receive pre-validated body"
key_files:
  created:
    - src/backend/src/middleware/validateBody.ts
    - src/backend/src/schemas/EmployeeSchema.ts
    - src/backend/src/schemas/PayrollSchema.ts
    - src/backend/src/schemas/ClockLogSchema.ts
    - src/backend/src/schemas/DeductionSchema.ts
    - src/backend/src/schemas/UserSchema.ts
  modified:
    - src/backend/src/index.ts
    - src/backend/package.json
decisions:
  - "Used z.coerce.number() instead of z.number({ coerce: true }) — Zod 4 removed the constructor-based coerce option; z.coerce.* is the correct Zod 4 API"
  - "validateBody placed in src/middleware/ not src/utils/ — CLAUDE.md middleware convention takes precedence over RESEARCH.md suggestion"
  - "Pre-existing tsc errors in controllers left untouched — they are documented known technical debt in CLAUDE.md, not introduced by this plan"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-03-25"
  tasks_completed: 2
  files_created: 6
  files_modified: 2
---

# Phase 03 Plan 01: CORS Restriction + Zod Validation Infrastructure Summary

CORS wildcard replaced with env-configured origin list, Zod 4.3.6 added as explicit dependency, validateBody middleware factory created, and 5 domain Zod schemas defined for Employee, Payroll, ClockLog, Deduction, and User.

## What Was Built

### Task 1: CORS Fix + Zod Install + validateBody Middleware

- **CORS fix** (`src/backend/src/index.ts` line 33): replaced `app.use(cors())` with `app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }))`. The `.env` already had `ALLOWED_ORIGINS="http://localhost:3000"` — no env change required.
- **Zod dependency**: `npm install zod` added `"zod": "^4.3.6"` to `dependencies` in `package.json`. Was previously only a transitive dep from the frontend.
- **validateBody middleware** (`src/backend/src/middleware/validateBody.ts`): factory function accepting a `ZodSchema`, returning an Express `RequestHandler` that calls `.safeParse(req.body)`, returns 400 with `{ success: false, error: string }` on failure, or replaces `req.body` with parsed data and calls `next()`.

### Task 2: 5 Domain Zod Schema Files

All files in `src/backend/src/schemas/`:

| File | Exports | Key fields |
|------|---------|-----------|
| `EmployeeSchema.ts` | `createEmployeeSchema`, `updateEmployeeSchema` | 10 fields; email validation; coerced position_id and required_hours_biweekly |
| `PayrollSchema.ts` | `createPayrollSchema`, `updatePayrollSchema` | 5 fields; coerced payroll_type_id; status defaults to PENDIENTE |
| `ClockLogSchema.ts` | `bulkCreateClockLogSchema` | Nested array schema; coerced employee_id; min(1) on logs array |
| `DeductionSchema.ts` | `createDeductionSchema`, `updateDeductionSchema` | 4 fields; percentage 0–100 range; fixed_amount positive |
| `UserSchema.ts` | `updatePermissionsSchema` | Single `role` field |

All schemas use Zod 4 API: `z.string().min(1)` (not `.nonempty()`), `z.coerce.number()` (not `z.number({ coerce: true })`), `z.string()` for date fields (not `z.date()`).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Zod 4 coerce syntax in all 3 schema files**
- **Found during:** Task 2 tsc verification
- **Issue:** Plan and RESEARCH.md both showed `z.number({ coerce: true })` — valid in Zod 3 but rejected by Zod 4 (`'coerce' does not exist in type`). Zod 4 uses `z.coerce.number()` instead.
- **Fix:** Replaced all `z.number({ coerce: true })` with `z.coerce.number()` in EmployeeSchema.ts, PayrollSchema.ts, and ClockLogSchema.ts.
- **Files modified:** `src/backend/src/schemas/EmployeeSchema.ts`, `PayrollSchema.ts`, `ClockLogSchema.ts`
- **Commit:** 585f2b7

**2. [Placement deviation] validateBody placed in middleware/ not utils/**
- **Found during:** Task 1 planning
- **Issue:** RESEARCH.md suggested `src/backend/src/utils/validateBody.ts`. CLAUDE.md architecture table defines middleware functions as belonging in `src/backend/src/middleware/`.
- **Fix:** Created file at `src/backend/src/middleware/validateBody.ts` per CLAUDE.md convention. CLAUDE.md takes precedence.
- **Commit:** 585f2b7

### Pre-existing tsc Errors (Out of Scope)

The following errors existed before this plan and were confirmed via `git stash` baseline check. They are NOT introduced by this plan and are documented in CLAUDE.md as known technical debt:

- 20+ controller errors: `Argument of type 'string | string[]' is not assignable to parameter of type 'string'` — Express 5 typed `req.params` values as `string | string[]`; controllers pass to services expecting `string`.
- `EmployeeController.ts(30)`: missing `id`, `fired`, `version` fields in object literal passed to `EmployeeService.createEmployee`.
- `ReportsService.ts(2)`: missing `@types/nodemailer` declaration.

These are logged to `deferred-items.md` and deferred to a future plan.

## Known Stubs

None — all schema exports are fully functional Zod objects with real validation rules.

## Verification Results

- `grep "ALLOWED_ORIGINS" src/backend/src/index.ts` — 1 match (PASSED)
- `grep '"zod"' src/backend/package.json` — match in dependencies block (PASSED)
- `src/backend/src/middleware/validateBody.ts` — exists and exports `validateBody` (PASSED)
- `src/backend/src/schemas/` — 5 files: EmployeeSchema.ts, PayrollSchema.ts, ClockLogSchema.ts, DeductionSchema.ts, UserSchema.ts (PASSED)
- `npx tsc --noEmit` — 0 NEW errors introduced; all errors are pre-existing (PASSED per plan criteria)

## Self-Check: PASSED
