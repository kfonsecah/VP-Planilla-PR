---
phase: 66
slug: jornadas-mixtas-nocturnas
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 66 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 with ts-jest |
| **Config file** | `src/backend/jest.config.js` |
| **Quick run command** | `npm test -- NomineeService.test.ts` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- NomineeService.test.ts`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 66-01-01 | 01 | 1 | PAY-31 | migration | `npx prisma migrate dev --preview-feature` | ❌ W0 | ⬜ pending |
| 66-02-01 | 02 | 1 | PAY-31 | unit | `npm test -- NomineeService.test.ts -t "nocturno"` | ❌ W0 | ⬜ pending |
| 66-02-02 | 02 | 1 | PAY-31 | unit | `npm test -- NomineeService.test.ts -t "mixto"` | ❌ W0 | ⬜ pending |
| 66-02-03 | 02 | 1 | PAY-31 | unit | `npm test -- NomineeService.test.ts -t "enterprise.*default"` | ❌ W0 | ⬜ pending |
| 66-03-01 | 03 | 2 | PAY-31 | unit | `npm test -- NomineeService.test.ts` | ❌ W0 | ⬜ pending |
| 66-03-02 | 03 | 2 | PAY-31 | unit | `npm test -- PayrollService.test.ts -t "regression"` | ✅ Exists | ⬜ pending |
| 66-04-01 | 04 | 2 | PAY-31 | type-check | `npx tsc --noEmit` (from src/frontend/) | ✅ Exists | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/backend/src/__tests__/unit/services/NomineeService.test.ts` — stubs for `resolveEffectiveShiftType()` and shift-aware `LegalParamService.getParamSetAtDate()` (6 scenarios)
- [ ] Regression test in `src/backend/src/__tests__/unit/services/PayrollService.test.ts` — ensure DIURNA (default) produces same payroll as before Phase 66
- [ ] Mock `vpg_employees.shift_type` in existing payroll test fixtures
- [ ] Seed migration for `vpg_legal_params` — WORKDAY_MIXTA_DAILY, WORKDAY_NOCTURNA_DAILY keys if not already present

*Existing infrastructure (Jest + ts-jest) covers all phase requirements — no new framework installation needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dropdown shift_type visible in employee form | PAY-31 | UI visual check | Open employee edit form, verify shift_type dropdown shows DIURNA/MIXTA/NOCTURNA/USE_ENTERPRISE_DEFAULT |
| Wizard step 3 tooltip shows correct shift hours | PAY-31 | UI visual check | Run payroll wizard to step 3, hover info icon, verify tooltip shows correct hours per jornada |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
