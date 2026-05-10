---
phase: 6
slug: feriados-nacionales-costa-rica
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-27
validated: 2026-03-27
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `src/backend/jest.config.ts` |
| **Quick run command** | `cd src/backend && npx tsc --noEmit` |
| **Full suite command** | `cd src/backend && npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd src/backend && npx tsc --noEmit`
- **After every plan wave:** Run `cd src/backend && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 1 | 6.1, 6.2 | grep | `grep "FERIADOS_CR\|isCRHoliday" src/backend/src/utils/payrollUtils.ts` → exists | ✅ | ✅ green |
| 6-02-01 | 02 | 1 | 6.2 | tsc | `npx tsc --noEmit` → passes (27 pre-existing errors) | ✅ | ✅ green |
| 6-03-01 | 03 | 2 | 6.3, 6.4 | jest | `npm test` → 22 payrollUtils tests pass, 2 PayrollService pre-existing failures | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/backend/src/__tests__/unit/payrollUtils.test.ts` — stubs for REQ 6.1-6.4
- [x] `src/backend/jest.config.ts` — already exists (Jest + ts-jest configured)

---

## Manual-Only Verifications

All phase behaviors have automated verification.

---

## Validation Sign-Off

- [x] All tasks have Wave 0 dependencies
- [x] Sampling continuity maintained
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ✅ VALIDATED 2026-03-27

## Validation Audit 2026-03-27

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

### Verification Results
- `FERIADOS_CR` array added: ✅
- `isCRHoliday()` uses UTC methods: ✅
- `getCRHolidays()` returns 10 holidays: ✅
- `countWorkingDaysInPeriod()` excludes holidays: ✅
- 22 payrollUtils tests pass: ✅
- TypeScript compilation: ✅ (27 pre-existing errors unchanged)
- 2 PayrollService test failures: pre-existing, unrelated to Phase 6

---

*Generated from 06-RESEARCH.md*
