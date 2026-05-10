---
phase: 25-http-client-layer-enforcement
plan: 25-01
subsystem: frontend/services
tags: [http, refactoring, auth]
requires: [http.ts]
provides: [refactored internal services]
affects: [AuditLogsService, BranchService, PayrollEmployeesService]
tech-stack.added: []
patterns: [centralized http client]
key-files.created: []
key-files.modified: [src/frontend/src/services/auditLogsService.ts, src/frontend/src/services/branchService.ts, src/frontend/src/services/payrollEmployeesService.ts]
key-decisions: [Standardized all internal service calls to use http.ts to leverage automatic auth refresh and error normalization.]
requirements-completed: [HTTP-01, HTTP-02]
duration: 10 min
completed: 2026-04-10T14:30:00Z
---

# Phase 25 Plan 01: Refactor Internal Services Summary

Refactored internal frontend services that currently bypass the central HTTP client to use `http.ts`, ensuring consistent authentication, token refresh, and error normalization.

## Achievements
- `AuditLogsService` migrated from direct `fetch` to `http.get`.
- `BranchService` migrated all methods (GET, POST, PUT, DELETE) to use `http` methods.
- `PayrollEmployeesService` migrated to `http.get`.
- Removed manual error handling and `BASE_URL` logic from these services, reducing code duplication and fragility.

## Deviations from Plan
None - plan executed exactly as written.

## Verification Result
- Manual check: `fetch(` is no longer present in modified service files.
- Automated check: `node -e` script confirmed zero `fetch(` occurrences.

Ready for Phase 25 Plan 02.
