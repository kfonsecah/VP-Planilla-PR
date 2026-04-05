---
phase: 20
slug: hu-rfanas-y-anomal-as
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-05
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x |
| **Config file** | `src/backend/jest.config.js` |
| **Quick run command** | `npm test -- --testPathPattern="ClockLogAnalysisService"` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~60 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern="ClockLogAnalysisService"` (for Plan 01 tasks) or `npx tsc --noEmit` (for type-check tasks)
- **After every plan wave:** Run `npm test` (full suite) to catch regressions
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 20-01-01 | 01 | 1 | ORPHAN-01, ANOMALY-01..04 | unit | `npm test -- --testPathPattern="ClockLogAnalysisService" -x` | ✅ | ⬜ pending |
| 20-01-02 | 01 | 1 | ANOMALY-04 | integration (manual) | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 20-02-01 | 02 | 2 | ORPHAN-02, ANOMALY-05 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 20-02-02 | 02 | 2 | ORPHAN-02, ANOMALY-05 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 20-03-01 | 03 | 3 | ORPHAN-03 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 20-03-02 | 03 | 3 | ORPHAN-03 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `jest.config.js` exists (project already has testing infrastructure)
- [x] `tsconfig.json` for type-checking
- [x] `prisma` setup complete

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Import triggers detection and returns anomaly count | ANOMALY-04 | Requires full API roundtrip with database | 1. POST /api/clock-logs/import with test data containing known edge cases<br>2. Verify response `anomalies` > 0<br>3. Check session record `anomalyCount` updated |
| Orphan query returns correct records | ORPHAN-02 | Needs DB state with detection run | 1. Run import that produces orphans<br>2. GET /api/clock-logs/orphans?page=1&pageSize=20<br>3. Verify each returned log has `status: "orphan"` |
| Anomaly query returns correct records with employee info | ANOMALY-05 | Needs DB state with detection run | 1. Run import that produces anomalies (double entry, long session)<br>2. GET /api/clock-logs/anomalies<br>3. Verify each has `status: "anomaly"` and employee name fields present |
| Orphan resolution (discard) marks corrected with justification | ORPHAN-03 | State change validation | 1. POST /api/clock-logs/orphans/:id/resolve with `{action: "discard", justification: "Test"}`<br>2. GET /api/clock-logs/:id → verify `status: "corrected"` and remarks contain "Test" |
| Orphan resolution (assign_complement) creates complementary log | ORPHAN-03 | Multi-step outcome | 1. POST /api/clock-logs/orphans/:id/resolve with `{action: "assign_complement", complementTimestamp: "...", complementLogType: "OUT"}`<br>2. Verify original status becomes `valid`<br>3. GET /api/clock-logs?employee_id=X → verify a new `manual` source log exists with provided timestamp/log_type |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 60s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending (awaiting execution verification)
