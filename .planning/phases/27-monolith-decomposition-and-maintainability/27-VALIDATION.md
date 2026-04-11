# Phase 27: Validation Plan — Monolith Decomposition and Maintainability

**Status:** Ready to verify
**Version:** 1.0
**Requirements:** MOD-01, MOD-02, MOD-03

## Acceptance Criteria

### MOD-01: Modular Responsibility
- [ ] No single function in refactored controllers/pages exceeds a **Cognitive Complexity** score of 15 (measured via `eslint-plugin-sonarjs`).
- [ ] Logic is separated into distinct layers: Controllers/Pages (HTTP/Orchestration), Services/Hooks (Business/State), and Presenters (Transformation).

### MOD-02: Parsing Decoupling
- [ ] `ClockLogsController.import` (backend) delegates parsing and validation to `ClockLogsImportService`.
- [ ] `ClockLogsDashboardPage` (frontend) uses `ClockLogPresenter` for data formatting and status mapping.
- [ ] No business logic remains in the UI components of the Clock Logs feature.

### MOD-03: Functional Stability (No Regression)
- [ ] 100% pass rate in unit tests for `ClockLogPresenter` and `ClockLogsImportService`.
- [ ] Manually verify that importing a sample clock log file (Excel or Java format) produces the same results as before the refactor.
- [ ] Audit logs for manual corrections are still generated correctly after refactor.

## Test Matrix

| Test Case | Scope | Strategy | Target Result |
|-----------|-------|----------|---------------|
| T27-01-COMPLEXITY | All | ESLint Audit | Score <= 15 for all functions in `src/features/` |
| T27-02-UNIT-PARSING | Backend | Jest Unit | Validates Java/Excel normalization |
| T27-03-UNIT-PRESENTER | Frontend | Jest Unit | Validates status badges and date display |
| T27-04-E2E-IMPORT | Full Stack | Manual | Import sample and check DB record counts |

## Tools
- `eslint-plugin-sonarjs`: Complexity auditing.
- `jest`: Unit and Characterization testing.
- `npm run lint`: Compliance check.

---
*Created: 2026-04-11*
