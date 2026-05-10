# Requirements: Milestone v1.8 — Stabilization & Planning Sync

## 1. Overview
This milestone addresses the technical debt and planning inconsistencies accumulated during the rapid development of v1.5 through v1.7. The primary focus is on ensuring a solid, auditable codebase and a synchronized documentation set.

## 2. Technical Requirements

### 2.1 Environment Recovery (ENV-01)
- **ENV-01.1**: Clean and re-install `node_modules` in `src/backend`.
- **ENV-01.2**: Clean and re-install `node_modules` in `src/frontend`.
- **ENV-01.3**: Verify `npx tsc --noEmit` passes in both stacks (Gate 1).
- **ENV-01.4**: Verify `npm test` passes in backend (Gate 2).

### 2.2 Payroll Wizard Refactoring (WIZ-01)
- [x] **WIZ-01.1**: Decompose `src/frontend/src/app/pages/payroll/wizard/page.tsx` into smaller, focused sub-components (one per step).
- [x] **WIZ-01.2**: Remove all occurrences of `any` casting in Step 3 (calculation summary).
- [x] **WIZ-01.3**: Fix all React Hook dependency warnings in wizard components.
- [x] **WIZ-01.4**: Ensure consistent error handling across all wizard steps.

### 2.3 Type Safety & Code Quality (QUAL-01)
- [x] **QUAL-01.1**: Resolve all linting warnings in `src/frontend/src/app/pages/payroll/wizard/`.
- [ ] **QUAL-01.2**: Audit `src/backend/src/utils/payrollUtils.ts` for any remaining hardcoded literals related to legal parameters.
- [ ] **QUAL-01.3**: Ensure JSDoc is present and accurate for all new methods in v1.7 services.

## 3. Planning & Documentation Requirements

### 3.1 Planning Synchronization (SYNC-01)
- **SYNC-01.1**: Update `MILESTONES.md` to archive v1.6 and v1.7 correctly.
- **SYNC-01.2**: Ensure `ROADMAP.md` reflects the current phase numbering (starting v1.8 at Phase 68).
- **SYNC-01.3**: Audit `.planning/milestones/v1.6-phases/` and `v1.7-phases/` for consistency with `SUMMARY.md` artifacts.

### 3.2 Audit of Resolved Gaps (AUDIT-01)
- **AUDIT-01.1**: Verify that all files in `.planning/debug/resolved/` are truly addressed in the current codebase.
- **AUDIT-01.2**: Check for any unrecorded gaps from the v1.7 UAT.

## 4. Acceptance Criteria
- [ ] Backend and Frontend type checks pass with zero errors.
- [ ] All 556+ tests pass.
- [ ] `MILESTONES.md` and `ROADMAP.md` are 100% consistent.
- [ ] `PayrollWizard` is refactored into at least 4 sub-components.
- [ ] No `any` casts in the payroll calculation flow.
