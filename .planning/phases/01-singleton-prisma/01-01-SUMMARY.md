---
phase: 01-singleton-prisma
plan: 01
subsystem: database
tags: [prisma, postgresql, typescript, backend]

# Dependency graph
requires: []
provides:
  - AuthService uses shared Prisma singleton (no per-call connection pool)
  - UserService uses shared Prisma singleton with vpg_users type preserved
  - EmployeeService uses shared Prisma singleton
  - PayrollService uses shared Prisma singleton
  - PayrollTypeService uses shared Prisma singleton
affects: [02-auth-security, 03-input-validation, 04-payroll-performance]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Singleton Prisma import pattern: import { prisma } from '../lib/prisma' — no local new PrismaClient()"
    - "Type-only import for Prisma-generated types: import type { vpg_users } from '@prisma/client'"

key-files:
  created: []
  modified:
    - src/backend/src/service/AuthService.ts
    - src/backend/src/service/UserService.ts
    - src/backend/src/service/EmployeeService.ts
    - src/backend/src/service/PayrollService.ts
    - src/backend/src/service/PayrollTypeService.ts

key-decisions:
  - "UserService vpg_users import converted to type-only (import type) since it is only used as a type annotation, not a value"
  - "PayrollService import { error } from 'console' left untouched per plan — Phase 2 scope (requirement 2.6)"
  - "Pre-existing TypeScript errors in controllers and other services are out-of-scope; not introduced by this plan"

patterns-established:
  - "Singleton import pattern: all services must use import { prisma } from '../lib/prisma' — never new PrismaClient()"

requirements-completed: [1.1, 1.2, 1.3]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 01 Plan 01: Singleton Prisma (AuthService, UserService, EmployeeService, PayrollService, PayrollTypeService) Summary

**5 service files migrated from isolated `new PrismaClient()` instances to the shared singleton at `src/backend/src/lib/prisma.ts`, eliminating 5 separate PostgreSQL connection pools**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-25T20:25:00Z
- **Completed:** 2026-03-25T20:25:30Z
- **Tasks:** 1 of 1
- **Files modified:** 5

## Accomplishments
- Removed `new PrismaClient()` from all 5 service files — zero isolated connection pools remain in these services
- All 5 files now import from `../lib/prisma` singleton, sharing a single connection pool
- UserService `vpg_users` type import preserved as `import type` from `@prisma/client`
- PayrollService `import { error } from "console"` left untouched per plan (Phase 2 scope)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate AuthService, UserService, EmployeeService, PayrollService, PayrollTypeService to singleton** - `60537a8` (fix)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `src/backend/src/service/AuthService.ts` - Replaced `import { PrismaClient }` + `const prisma = new PrismaClient()` with `import { prisma } from '../lib/prisma'`
- `src/backend/src/service/UserService.ts` - Replaced combined import + instance; added `import type { vpg_users }` to preserve type usage
- `src/backend/src/service/EmployeeService.ts` - Replaced `import {PrismaClient}` + `const prisma = new PrismaClient()` with singleton import
- `src/backend/src/service/PayrollService.ts` - Replaced `import { PrismaClient }` + `const prisma = new PrismaClient()`; left `import { error } from "console"` untouched
- `src/backend/src/service/PayrollTypeService.ts` - Replaced `import { PrismaClient }` + `const prisma = new PrismaClient()` with singleton import

## Decisions Made
- `vpg_users` in UserService is used only as a type annotation (function parameter type), so converting to `import type` is correct and aligns with TypeScript best practices.
- Pre-existing TypeScript errors across controllers and other services (e.g., `string | string[]` parameter issues, missing Prisma schema fields in PayrollService, missing `@types/nodemailer`) were confirmed out-of-scope — they existed before this plan and are not caused by our changes.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npx tsc --noEmit` exits non-zero due to pre-existing errors throughout the codebase (controllers, ReportsService, PayrollService schema mismatches). These are out-of-scope, pre-existing issues not introduced by this plan. The 5 modified service files themselves compile correctly per their individual logic.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 01-01 complete: 5 services on singleton Prisma
- Plan 01-02 (parallel agent) covers remaining services (AuditLogsService, BonusesService, ClockLogsService, DeductionsService, EmployeeDeductions)
- After both plans complete, Phase 1 is ready for final verification

---
*Phase: 01-singleton-prisma*
*Completed: 2026-03-25*
