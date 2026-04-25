# Phase 40: Fix 15 Remaining Test Failures from Phase 38 - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning
**Source:** Gap closure from Phase 38 VERIFICATION.md

<domain>
## Phase Boundary

Fix the 15 remaining test failures that were not resolved in Phase 38. These failures block the full test suite from passing.

**The failures are:**
- 5 in NomineeService.test.ts (pre-existing, marked out of scope in Phase 38)
- 1 in ClockLogEffectiveService.Paginated.test.ts (TypeScript error: employee_is_active field)
- 10 in clock-logs/page.test.tsx (UI elements changed - "siguiente", "buscar empleado", "hoy" don't exist)

</domain>

<decisions>
## Implementation Decisions

### Testing Approach
- All test fixes must maintain test integrity (not skip tests)
- Backend and frontend test suites must both pass with 0 failures
- No workarounds that mask real issues

### Priority Order
1. Fix TypeScript error in ClockLogEffectiveService.Paginated.test.ts (blocks compilation)
2. Fix clock-logs/page.test.tsx UI element mismatches (update to match current grouped UI)
3. Fix NomineeService.test.ts pre-existing failures (5 tests)

</decisions>

<canonical_refs>
## Canonical References

**Required reading before implementation:**

- `.planning/phases/38-tests-unitarios-verificacion-integracion/38-VERIFICATION.md` — Documents the 15 remaining failures
- `.planning/phases/38-tests-unitarios-verificacion-integracion/test-failures-categorized.md` — Detailed failure categorization

### Test Files to Fix
- `src/backend/__tests__/unit/NomineeService.test.ts` — 5 pre-existing failures
- `src/backend/__tests__/unit/services/ClockLogEffectiveService.Paginated.test.ts` — TypeScript error
- `src/frontend/__tests__/pages/clock-logs/page.test.tsx` — 10 UI element mismatches

</canonical_refs>

<specifics>
## Specific Details

**Backend Tests:**
- NomineeService.test.ts: Tests reference outdated service methods or assertions
- ClockLogEffectiveService.Paginated.test.ts: Mock uses `employee_is_active` field that doesn't exist in Prisma type

**Frontend Tests:**
- clock-logs/page.test.tsx: Tests look for old UI elements:
  - "siguiente" button (doesn't exist in grouped view)
  - "buscar empleado" placeholder (replaced with search in header)
  - "hoy" button (replaced with period selector)

</specifics>

<deferred>
## Deferred Ideas

None — this phase specifically addresses the remaining test failures from Phase 38.

</deferred>

---

*Phase: 40-fix-15-remaining-test-failures-from-phase-38*
*Context gathered: 2026-04-17 via VERIFICATION.md gap analysis*