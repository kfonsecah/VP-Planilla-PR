# Phase 20 Research: Orphan & Anomaly Detection

**Gathered:** 2026-04-05
**Method:** Analyzed existing codebase patterns from Phase 19 and project conventions
**Maturity:** High confidence — clear requirements and established patterns

---

## Technical Approach

### Detection Engine Design

**Chosen:** Static service class (`ClockLogAnalysisService`) with pure functions operating on Prisma queries.

**Rationale:**
- Follows project pattern (static methods only, see `ImportSessionService`, `PayrollService`)
- No state to manage — all methods are stateless transformations over DB queries
- Easy to test (pure inputs/outputs)
- Can be called from controller or background job

**Alternatives considered:** Instantiated class with dependency injection — rejected as overkill; no instance state needed.

### Detection Algorithms

1. **Orphans**: Group logs by employee, iterate chronological. IN is orphan if no OUT within 24h. OUT is orphan if no preceding IN within 24h.
   - Complexity: O(n) per employee (single pass)
   - Database: Fetch all pending logs for session, process in application

2. **Double Entry/Exit**: Iterate chronological logs; detect consecutive same `log_type` for same employee.
   - Simple state machine: track last log_type; if current === last and status pending → mark both

3. **Long Sessions**: IN→OUT pairs with duration > 16h.
   - Pairwise iteration; calculate duration

**Why application-level vs database-level?** Complex window functions would be PostgreSQL-specific and harder to maintain across employee groups. Application logic is clear and testable.

### Trigger Mechanism

**Chosen:** Synchronous post-import hook in `ClockLogsController.import()` (after `bulkCreate`).

**Rationale:**
- Simplicity — no background job infrastructure
- Immediate feedback: import response includes anomaly count
- Detection runs in same transaction boundary? Not critical — detection reads after bulkCreate completes

**Consideration:** Large imports could make request slow. Acceptable for Phase 20; move to background in future if needed.

---

## Dependencies & Assumptions

- **Phase 19 complete**: Import sessions exist, logs have `import_session_id`, `status` field (pending/valid/anomaly/etc.)
- **Prisma schema**: `vpg_clock_logs` model with `clock_logs_status` enum (pending, valid, anomaly, corrected, orphan) and `clock_logs_import_session_id` FK
- **ClockLogsService.bulkCreate** accepts `sessionId?` parameter (already exists from Phase 19)
- **Auth**: All new endpoints protected by existing `AuthMiddleware.verifyToken`

---

## Validation Architecture

### Unit Tests (TDD for Plan 01 Task 1)

- `ClockLogAnalysisService.test.ts`:
  - `detectOrphans`: IN without OUT → orphan; OUT without IN → orphan; borderline 24h → not orphan
  - `detectDoubleEntry`: IN/IN consecutive → both anomaly; IN/OUT not anomaly
  - `detectDoubleExit`: OUT/OUT consecutive → both anomaly; OUT/IN not anomaly
  - `detectLongSessions`: Pair >16h → both anomaly; 16h exactly → valid
  - `runPostImportAnalysis`: orchestrates all, marks remaining pending as valid
- Mock Prisma with Jest; test isolation with in-memory datasets

### Integration Tests

- `ClockLogsController` integration tests:
  - POST /clock-logs/import returns `anomalies` count > 0 when detection finds issues
  - GET /api/clock-logs/orphans returns logs with status='orphan'
  - GET /api/clock-logs/anomalies returns logs with status='anomaly'
  - POST /api/clock-logs/orphans/:id/resolve updates status correctly

### Manual Verification Steps

1. **Import test data** (using Java parser or Excel) with known edge cases:
   - Single IN without following OUT
   - Two INs in a row
   - IN followed by OUT after 30h
2. **Verify** GET /api/clock-logs/orphans returns the orphan
3. **Verify** GET /api/clock-logs/anomalies returns the long session
4. **Call** POST /api/clock-logs/orphans/:id/resolve with `assign_complement` and verify complementary log created and original marked valid
5. **Call** POST /api/clock-logs/orphans/:id/resolve with `discard` and verify status='corrected' with justification in remarks

### Performance Expectations

- Detection runs in O(n) time over session logs. For 10,000 logs, should complete <1s in Node.js.
- Database: Only simple findMany + updateMany queries. Ensure index on `clock_logs_import_session_id` and `clock_logs_status` (Prisma `@@index`).

---

## Open Questions (Resolved)

None — requirements clear.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Detection misses edge cases (e.g., OUT before IN same day) | Data quality | Comprehensive unit tests covering all success criteria; manual testing with edge cases |
| Large imports cause timeouts | User experience | If needed, move detection to background queue later (out of scope for v1.3) |
| Orphan resolution creates duplicate logs | Data corruption | Service validates orphan status before resolution; uses `prisma.$transaction` for atomicity |

---

*Research complete. Validation architecture defined above.*
