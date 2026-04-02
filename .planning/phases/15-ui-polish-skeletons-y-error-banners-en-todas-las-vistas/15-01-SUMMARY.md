---
phase: 15-ui-polish-skeletons-y-error-banners-en-todas-las-vistas
plan: 01
subsystem: ui
tags: [skeleton-loading, error-banners, animate-pulse, heroicons, retry-pattern]

# Dependency graph
requires:
  - phase: 13-integracion-frontend-backend
    provides: Table component with loading/error/empty state patterns
provides:
  - Skeleton loading states on 6 list pages replacing generic spinners
  - Error banners with retry button on all 6 list pages
  - Consistent loading/error UX across deductions, vacations, branches, payroll-types, employee events, and users
affects: [all-data-pages, user-experience, future-ui-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Skeleton loading uses animate-pulse with bg-zinc-200/dark:bg-zinc-700 placeholder blocks
    - Error banners use red border + bg-red-50/dark:bg-red-950/50 with ExclamationTriangleIcon and retry button
    - Conditional rendering order: error first, then loading/skeletons, then data/empty state
    - Skeleton card/row count matches expected content (6 deduction cards, 5 vacation rows, 4 branch cards, 5 payroll-type cards, 5 user rows)

key-files:
  created: []
  modified:
    - src/frontend/src/app/pages/deductions/list/page.tsx
    - src/frontend/src/app/pages/vacations/list/page.tsx
    - src/frontend/src/app/pages/branches/list/page.tsx
    - src/frontend/src/app/pages/payroll-types/list/page.tsx
    - src/frontend/src/app/pages/employee/events/page.tsx
    - src/frontend/src/app/pages/users/page.tsx

key-decisions:
  - "Skeleton layouts match actual content structure (card grid vs table rows) for visual consistency"
  - "Error banners placed above data lists with mb-4 spacing for prominence"
  - "Error state takes priority over loading state in conditional rendering"

patterns-established:
  - "Loading state: animate-pulse skeleton matching content layout, not generic spinner"
  - "Error state: red banner with ExclamationTriangleIcon, error message, and Reintentar button"
  - "Retry button calls hook's refetch() or page's fetchData() function"

requirements-completed: [UI-POLISH-01, UI-POLISH-02, UI-POLISH-03]

# Metrics
duration: 15min
completed: 2026-04-02
---

# Phase 15 Plan 01: Skeleton Loading and Error Banners Summary

**Structured skeleton loading states and error banners with retry functionality on 6 list pages, replacing generic spinners and simple error text**

## Performance

- **Duration:** 15 min
- **Started:** 2026-04-02T00:48:00Z
- **Completed:** 2026-04-02T01:03:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Replaced generic spinner loading states with structured skeleton layouts on all 6 list pages
- Added full error banners with ExclamationTriangleIcon and "Reintentar" retry button on all 6 pages
- Skeleton layouts match actual content structure (card grids, table rows, calendar sidebar)
- Error state takes priority over loading state in conditional rendering order
- Dark mode variants consistent throughout all new UI elements

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace spinners with skeleton loading in 6 list pages** - `a5c92f1` (feat), `c035c6c` (feat)
2. **Task 2: Add error banners with retry to all 6 list pages** - `3b07333` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/frontend/src/app/pages/deductions/list/page.tsx` — Skeleton card grid (6 cards) + full error banner with retry
- `src/frontend/src/app/pages/vacations/list/page.tsx` — Skeleton vacation rows (5 rows) + full error banner with retry
- `src/frontend/src/app/pages/branches/list/page.tsx` — Skeleton branch cards (4 cards) + full error banner with retry
- `src/frontend/src/app/pages/payroll-types/list/page.tsx` — Skeleton payroll-type cards (5 cards) + full error banner with retry
- `src/frontend/src/app/pages/employee/events/page.tsx` — Skeleton stats cards + calendar/sidebar skeletons + full error banner with retry
- `src/frontend/src/app/pages/users/page.tsx` — Skeleton table rows (5 rows) + full error banner with retry

## Decisions Made

- Skeleton layouts match actual content structure rather than using generic placeholder blocks
- Error banners use the same pattern as Table.tsx for consistency across the application
- Error state renders before loading state so users see problems immediately
- Retry buttons call the appropriate refetch function for each page (refetch, refreshEvents, or fetchData)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed duplicate skeleton content in employee/events page**
- **Found during:** Task 1 (Skeleton loading implementation)
- **Issue:** Parallel agent introduced duplicate skeleton blocks — one rendering during isLoading and another rendering during !isLoading (wrong condition)
- **Fix:** Removed duplicate block, kept single skeleton section with correct isLoading condition, added skeleton for stats cards
- **Files modified:** src/frontend/src/app/pages/employee/events/page.tsx
- **Verification:** Page structure clean — skeleton during load, data when loaded
- **Committed in:** `c035c6c` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Fix necessary for correct rendering. No scope creep.

## Issues Encountered

- Git index lock contention from parallel agent — resolved by removing stale lock file
- TypeScript check passes with only pre-existing `skipped_count` error in attendance page (known issue)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 6 list pages have consistent loading and error states
- TypeScript compiles cleanly (only pre-existing errors)
- Ready for Phase 15 Plan 02 or next phase

---

*Phase: 15-ui-polish-skeletons-y-error-banners-en-todas-las-vistas*
*Completed: 2026-04-02*
