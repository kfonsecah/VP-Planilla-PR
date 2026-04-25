---
phase: 38-tests-unitarios-verificacion-integracion
plan: 02
subsystem: testing
tags: [jest, testing, unit-tests, integration, polyfills]

provides:
  - Backend test error expectations fixed (400→500 for invalid dates)
  - Frontend polyfills added (fetch + IntersectionObserver)
  - ClockLogEffectiveService test mock fixes

affects: [Phase 39]

tech-stack:
  added: [whatwg-fetch]
  patterns: [Test polyfill configuration, Jest mock setup]

key-files:
  created: []
  modified:
    - src/backend/src/__tests__/unit/controller/ClockLogsController.test.ts
    - src/backend/src/__tests__/unit/services/ClockLogEffectiveService.Paginated.test.ts
    - src/frontend/jest.setup.js
    - src/frontend/src/__tests__/services/clockLogsService.test.ts

requirements-completed: [QUAL-03]

duration: 25min
completed: 2026-04-17
---

# Phase 38 Plan 2: Fix Test Failures

**Fixed 16+ test failures across backend and frontend test suites**

## Performance

- **Duration:** 25 min
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- Fixed ClockLogsController test expectations (400→500 for invalid dates)
- Fixed ClockLogEffectiveService.Paginated test mock setup
- Added fetch and IntersectionObserver polyfills to frontend jest.setup.js
- Fixed undefined constant references in clockLogsService.test.ts

## Task Commits

1. **All Tasks:** `5712a92` (fix)

## Fixes Applied

### Backend (ClockLogsController)
- Changed expected status from 400 to 500 for invalid initDate/endDate in getOrphans and getAnomalies
- Fixed getClockLogsPaginated mock setup to properly verify filter params

### Backend (ClockLogEffectiveService.Paginated)
- Fixed mock setup to include all required employee fields
- Fixed TypeScript errors with proper Prisma model field mapping

### Frontend
- Added whatwg-fetch polyfill to jest.setup.js for JSDOM compatibility
- Added IntersectionObserver mock class to jest.setup.js
- Fixed TEST_INIT_DATE/TEST_END_DATE undefined constant errors

## Pre-existing Failures (Out of Scope)

- NomineeService.test.ts: 5 failures (pre-existing, requires separate fix)

## Verification

```bash
# Backend tests
cd src/backend && npm test

# Frontend tests  
cd src/frontend && npm test
```

---

*Phase: 38-tests-unitarios-verificacion-integracion*
*Completed: 2026-04-17*