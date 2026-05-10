---
phase: 64
slug: snapshot-params-planilla-cerrada
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 64 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + ts-jest (^29.7.0) |
| **Config file** | `src/backend/jest.config.js` |
| **Quick run command** | `npm test -- --testPathPattern=PayrollService` |
| **Full suite command** | `npm test` in `src/backend/` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=PayrollService`
- **After every plan wave:** Run `npm test` in `src/backend/` + `npx tsc --noEmit` in both backend and frontend
- **Before `/gsd-verify-work`:** Full suite green + `npx tsc --noEmit` + `npx next lint`
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 64-01-01 | 01 | 1 | PAY-29 | T-64-01 | Schema only writable via service (no direct table access) | unit | `npm test -- --testPathPattern=PayrollService -t "snapshot"` | ❌ W0 | ⬜ pending |
| 64-02-01 | 02 | 2 | PAY-29 | T-64-02 | approvePayroll captures snapshot atomically | unit | `npm test -- --testPathPattern=PayrollService -t "approvePayroll"` | ✅ | ⬜ pending |
| 64-02-02 | 02 | 2 | PAY-29 | T-64-02 | GET /payroll/:id/snapshot requires auth | unit | `npm test -- --testPathPattern=PayrollController -t "snapshot"` | ❌ W0 | ⬜ pending |
| 64-03-01 | 03 | 3 | PAY-29 | — | N/A (read-only UI) | component | `npm test -- --testPathPattern=PayrollParamSnapshot` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/backend/src/__tests__/unit/services/PayrollService.test.ts` — Add test stubs for snapshot capture (legal params + enterprise config)
- [ ] `src/backend/src/__tests__/unit/controller/PayrollController.test.ts` — Add test stub for `GET /payroll/:id/snapshot` response shape
- [ ] `src/frontend/src/__tests__/components/PayrollParamSnapshotSection.test.tsx` — Render + collapse behavior stub

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Historical payroll (pre-Phase 64) shows graceful empty state | PAY-29 | Requires DB state with old payroll lacking snapshot | Approve a payroll, manually delete its snapshot records, reload detail page |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
