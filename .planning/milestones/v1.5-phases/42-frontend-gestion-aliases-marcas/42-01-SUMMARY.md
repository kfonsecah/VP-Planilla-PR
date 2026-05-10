---
phase: 42-frontend-gestion-aliases-marcas
plan: "01"
subsystem: frontend
tags: [service, hook, aliases, clock-marks]
dependency_graph:
  requires: []
  provides:
    - ClockAliasService (HTTP calls to /employees/:id/aliases)
    - useClockAliases (state management for alias CRUD)
  affects:
    - src/frontend/src/services/index.ts
tech_stack:
  added: []
  patterns:
    - Service object pattern (ClockAliasService)
    - React hook with useCallback + useEffect
    - Optimistic UI with rollback
    - ApiError.statusCode-based duplicate detection
key_files:
  created:
    - src/frontend/src/services/clockAliasService.ts
    - src/frontend/src/hooks/useClockAliases.ts
  modified:
    - src/frontend/src/services/index.ts
decisions:
  - Used `response ?? []` pattern (not `response.data`) because http.ts already unwraps the `{ success, data }` wrapper
  - Optimistic delete: snapshot aliases before removal, rollback on error
  - 409 duplicate handled via `ApiError.statusCode === 409` check in addAlias
metrics:
  duration: "63s"
  completed: "2026-04-18"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 1
---

# Phase 42 Plan 01: Clock Alias Service and Hook Summary

**One-liner:** HTTP service and React hook for employee clock-alias CRUD with optimistic delete and 409 duplicate handling.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create clockAliasService.ts | ee3272d | src/frontend/src/services/clockAliasService.ts |
| 2 | Register service in index.ts | 4a34a95 | src/frontend/src/services/index.ts |
| 3 | Create useClockAliases hook | ce064e2 | src/frontend/src/hooks/useClockAliases.ts |

## What Was Built

### clockAliasService.ts (46 lines)
- `ClockAlias` interface matching backend model (id, employee_id, name, created_at, version)
- `ClockAliasService.getAliases(employeeId)` — GET `/employees/:id/aliases`
- `ClockAliasService.createAlias(employeeId, aliasName)` — POST `/employees/:id/aliases` with `{ alias_name }`
- `ClockAliasService.deleteAlias(employeeId, aliasId)` — DELETE `/employees/:id/aliases/:aliasId`
- All calls use `http.ts` client, never raw `fetch`

### useClockAliases.ts (78 lines)
- `fetchAliases()` — loads aliases with loading/error state management
- `addAlias(name)` — creates alias, appends to state; handles 409 with user-readable message
- `removeAlias(aliasId)` — optimistic delete (removes from state immediately, rolls back on error)
- All async actions wrapped in `useCallback`
- `useEffect` auto-fetches when `employeeId` changes

### services/index.ts
- Added `ClockAliasService` and `ClockAlias` type to the central services barrel export

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - service methods call real API endpoints; no placeholder data.

## Threat Flags

None - no new network endpoints or auth paths introduced on the frontend. All calls go through the existing http.ts security layer.

## Pre-existing TypeScript Issue (Out of Scope)

`src/frontend/src/__tests__/pages/clock-logs/page.test.tsx:44` uses `branchId` instead of `branch_id` in a test fixture. This error pre-exists this plan and is unrelated to alias management. Logged as deferred.

## Self-Check: PASSED

- [x] `src/frontend/src/services/clockAliasService.ts` — EXISTS (46 lines, > 40 minimum)
- [x] `src/frontend/src/hooks/useClockAliases.ts` — EXISTS (78 lines, > 60 minimum)
- [x] `src/frontend/src/services/index.ts` — contains `ClockAliasService` export
- [x] Commits ee3272d, 4a34a95, ce064e2 — all present in git log
- [x] 4 `useCallback` usages in hook (fetchAliases, addAlias, removeAlias + inner)
- [x] Optimistic update pattern present (`previous` snapshot + rollback)
- [x] 409 duplicate error handler present
