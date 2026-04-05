# Phase 20: Huérfanas y Anomalías - Context

**Gathered:** 2026-04-05 (plan-phase execution)
**Status:** Planning complete
**Source:** Direct from ROADMAP.md (discuss-phase skipped)

<domain>
## Phase Boundary

Phase 20 implements automatic detection of orphan clock logs (IN without matching OUT or vice versa) and anomaly detection (invalid sequences like consecutive INs/OUTs, long sessions). The phase also exposes API endpoints for administrators to review and resolve issues.

**Out of scope:** Frontend UI for displaying these endpoints (that's Phase 22).
</domain>

<decisions>
## Implementation Decisions

**Locked Decisions (from ROADMAP):**
- Orphan definition: IN without OUT within 24h, or OUT without preceding IN within 24h
- Anomaly types: double entry (consecutive INs), double exit (consecutive OUTs), long sessions (>16h)
- Detection triggers automatically after successful import (ANOMALY-04)
- Endpoints: GET /api/clock-logs/orphans and GET /api/clock-logs/anomalies (paginated with employee info)
- Resolution: POST /api/clock-logs/orphans/:id/resolve with actions: assign_complement or discard

**Technical approach (the agent's Discretion):**
- Detection logic in new `ClockLogAnalysisService` static class
- All detection methods operate only on logs with status='pending' for the given import session
- Post-import analysis marks remaining pending logs as 'valid'
- Service layer handles all business logic; controllers delegate to service
- API follows existing patterns: asyncHandler, AuthMiddleware, Swagger JSDoc
- Zod validation schemas for resolution endpoint
- TDD for detection engine (Plan 01 Task 1)
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before implementing:**

- `.planning/ROADMAP.md` — Phase 20 definition, success criteria, requirements
- `.planning/REQUIREMENTS.md` — Requirement details for ORPHAN-* and ANOMALY-*
- `.planning/phases/19-sesiones-de-importaci-n/19-02-SUMMARY.md` — Import session architecture and imports already link session to logs
- `src/backend/src/model/clockLog.ts` — ClockLogs interface and ClockLogStatus enum
- `src/backend/prisma/schema.prisma` — vpg_clock_logs model and vpg_employees relation
- `src/backend/src/service/ClockLogsService.ts` — Existing clock log service pattern
- `src/backend/src/controller/ClockLogsController.ts` — Controller pattern (asyncHandler, res.json shape)
- `src/backend/src/routes/ClockLogsRoute.ts` — Route registration pattern and Swagger examples
- `src/backend/src/schemas/ClockLogSchema.ts` — Existing Zod schemas for validation patterns
</canonical_refs>

<specifics>
## Specific Ideas

- Orphan detection: Iterate employee's logs chronologically; IN is orphan if no OUT within 24h; OUT is orphan if no preceding IN within 24h
- Double entry/exit: Detect consecutive same log_type without opposite in between
- Long session: IN→OUT pair duration > 16h
- Resolution: assign_complement creates missing opposite log; discard marks as corrected with justification
- Pagination default page=1, pageSize=20; include employee name fields in responses
</specifics>

<deferred>
## Deferred Ideas

- Anomaly type filtering (by double_entry, double_exit, long_session) — stub supported in getAnomalies service method but not implemented until Phase 22 dashboard filters
- Frontend UI for viewing and resolving issues — Phase 22
- Audit logging for orphan resolution actions — should be added in Phase 21 (audit log requirement CORRECT-03) but this phase creates the data that will be audited
</deferred>

---

*Phase: 20-hu-rfanas-y-anomal-as*
*Context auto-generated during plan-phase execution (discuss-phase skipped)*
