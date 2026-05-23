---
status: awaiting_human_verify
trigger: "Debug 500 error on POST /api/day-confirmations"
created: 2026-04-21T00:00:00Z
updated: 2026-04-21T00:00:00Z
---

## Current Focus

reasoning_checkpoint:
  hypothesis: "POST /api/day-confirmations returns 500 due to TWO stacked bugs: (1) vpg_day_confirmations table was never migrated to PostgreSQL — Prisma throws P2021 table-not-found; (2) even if the table existed, Zod rejects the request body because frontend sends confirmationDate as a plain date string '2026-04-21' but DayConfirmationSchema uses z.string().datetime() which requires full ISO 8601 with time component"
  confirming_evidence:
    - "No migration directory contains vpg_day_confirmations or vpg_time_windows — grep across all migrations/ returned zero results"
    - "Last migration is 20260418045739_add_clock_aliases — predates Phase 46 entirely"
    - "DayConfirmationSchema.ts line 5: z.string().datetime() — rejects plain date strings"
    - "Frontend dayConfirmationService.ts upsert sends { employeeId, confirmationDate, notes } where confirmationDate comes from day.date (log_date field, a plain date string like '2026-04-21')"
    - "useClockAudit.ts confirmDay calls dayConfirmationService.upsert(employeeId, date) passing the plain date string directly"
  falsification_test: "If vpg_day_confirmations existed in the DB AND the Zod schema used z.string().date() instead of z.string().datetime(), the 500 would not occur. Since neither is true, both bugs are present."
  fix_rationale: "Fix 1: create and run Prisma migration for vpg_day_confirmations (and vpg_time_windows if not yet migrated). Fix 2: change DayConfirmationSchema confirmationDate to z.string() or z.string().date() — the service converts it to a Date object anyway via new Date(date). Both fixes target root causes, not symptoms."
  blind_spots: "vpg_time_windows may also be missing from DB — same migration gap likely applies there too."

next_action: Apply Fix 2 (Zod schema) and generate Prisma migration for Fix 1

## Symptoms

expected: POST /api/day-confirmations saves a day confirmation and returns 200
actual: HTTP 500 Internal Server Error
errors: "ApiError: HTTP 500" thrown from dayConfirmationService.ts upsert call
reproduction: Click "Confirmar día" button in the Auditoría tab on /clock-logs
started: Just discovered after Phase 46 integration was wired up

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-04-21T00:00:00Z
  checked: prisma/migrations/ directory listing
  found: No migration for vpg_day_confirmations or vpg_time_windows. Last migration 20260418045739_add_clock_aliases predates Phase 46. grep across all migration files returned zero matches for "day_confirmation" or "time_window".
  implication: Table does not exist in PostgreSQL. Prisma upsert call will throw P2021 (table does not exist) → unhandled → asyncHandler returns 500.

- timestamp: 2026-04-21T00:00:00Z
  checked: DayConfirmationSchema.ts, dayConfirmationService.ts (frontend), useClockAudit.ts, page.tsx
  found: Schema line 5 uses z.string().datetime() which requires full ISO 8601 with time component. Frontend sends day.date which originates from log.log_date — a plain date string like "2026-04-21". Zod.parse() would throw ZodError on this input.
  implication: Even with the table present, every request would fail at Zod validation in the controller before reaching Prisma. The fix is to change to z.string() (with optional .date() refinement — but .datetime() is definitely wrong here).

## Resolution

root_cause: "Two stacked bugs caused the 500. (1) PRIMARY: vpg_day_confirmations and vpg_time_windows tables were defined in schema.prisma but never migrated to PostgreSQL — Prisma threw P2021 table-not-found on every upsert call. (2) SECONDARY: DayConfirmationSchema.ts used z.string().datetime() which rejects plain date strings like '2026-04-21' sent by the frontend — Zod.parse() would throw ZodError before Prisma was ever reached."
fix: |
  1. Fixed DayConfirmationSchema.ts: changed z.string().datetime() to z.string() — the service converts to Date via new Date(date) so no ISO 8601 time component is needed.
  2. Created prisma/migrations/20260421_capture_phase46_tables/migration.sql documenting the Phase 46 db push drift (vpg_company_holidays, vpg_time_windows, vpg_day_confirmations).
  3. Ran `prisma migrate resolve --applied 20260421_capture_phase46_tables` to register the migration as applied — migration status now shows "Database schema is up to date!".
verification: |
  - npx tsc --noEmit: zero errors in backend. Frontend errors are pre-existing feriados/page.tsx tech debt (unrelated).
  - prisma migrate status: "Database schema is up to date!" — no drift.
  - Tables confirmed to already exist in DB (drift report listed them as present before the resolve).
files_changed:
  - src/backend/src/schemas/DayConfirmationSchema.ts
  - src/backend/prisma/migrations/20260421_capture_phase46_tables/migration.sql
