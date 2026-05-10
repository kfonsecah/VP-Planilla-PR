---
phase: 21
slug: correcci-n-manual
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-05
---

# Phase 21 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 |
| **Config file** | `src/backend/jest.config.js` |
| **Quick run command** | `npm test -- --testPathPattern=ClockLogs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=ClockLogs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 21-01-01 | 01 | 1 | CORRECT-01 | unit | `npm test -- --testNamePattern="createManualLog"` | ❌ W0 | ⬜ pending |
| 21-01-02 | 01 | 1 | CORRECT-03 | unit | `npm test -- --testNamePattern="AuditLog"` (extended) | ❌ W0 | ⬜ pending |
| 21-01-03 | 01 | 1 | (Support) | unit | `npm test -- --testPathPattern=ClockLogsService` | ✅ | ⬜ pending |
| 21-02-01 | 02 | 2 | CORRECT-02 | unit | `npm test -- --testNamePattern="updateClockLogStatus"` | ❌ W0 | ⬜ pending |
| 21-02-02 | 02 | 2 | (Support) | unit | `npm test -- --testPathPattern=ClockLogsController` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/backend/src/__tests__/unit/services/ClockLogsService.test.ts` — existing, will add new test cases
- [x] `src/backend/src/__tests__/unit/controller/ClockLogsController.test.ts` — existing, will add new test cases
- [ ] Add test cases for `createManualLog` and `updateClockLogStatus` in the respective test files
- [ ] Add test for audit log creation triggered by service methods
- [ ] Add tests for admin role enforcement on new routes

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| N/A | — | All behaviors have automated unit tests covering service and controller layers. | N/A |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter after tests pass

**Approval:** pending
