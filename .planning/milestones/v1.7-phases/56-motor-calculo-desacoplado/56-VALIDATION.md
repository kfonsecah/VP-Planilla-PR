---
phase: 56
slug: motor-calculo-desacoplado
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-26
---

# Phase 56 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest ^29.7.0 + ts-jest |
| **Config file** | `src/backend/jest.config.js` |
| **Quick run command** | `npm test -- payrollUtils.test.ts` |
| **Full suite command** | `npm test` (runs all 500+ tests) |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (type check — < 5 sec)
- **After every plan wave:** Run `npm test -- payrollUtils.test.ts`
- **Before `/gsd:verify-work`:** Full suite must be green + `npm run lint` passes
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 56-01-01 | 01 | 1 | PAY-21 | typecheck | `npx tsc --noEmit` | ✅ W1 | ⬜ pending |
| 56-01-02 | 01 | 1 | PAY-21 | typecheck | `npx tsc --noEmit` | ✅ W1 | ⬜ pending |
| 56-02-01 | 02 | 2 | PAY-21 | typecheck | `npx tsc --noEmit` | ✅ W1 | ⬜ pending |
| 56-03-01 | 03 | 3 | PAY-21 | typecheck | `npx tsc --noEmit` | ✅ W1 | ⬜ pending |
| 56-03-02 | 03 | 3 | PAY-21 | typecheck | `npx tsc --noEmit` | ✅ W1 | ⬜ pending |
| 56-04-01 | 04 | 4 | PAY-21 | unit | `npm test -- payrollUtils.test.ts` | ✅ W1 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/backend/src/types/payroll.types.ts` — Existing
- [ ] `src/backend/src/utils/payrollUtils.ts` — Existing
- [ ] `src/backend/src/service/NomineeService.ts` — Existing
- [ ] `src/backend/src/__tests__/unit/utils/payrollUtils.test.ts` — Existing

*(All Phase 56 files are existing files that will be modified)*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
