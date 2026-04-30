---
phase: 65
slug: proyeccion-aguinaldo-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 65 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + ts-jest |
| **Config file** | `src/backend/jest.config.ts` |
| **Quick run command** | `npm test -- --testPathPattern=AguinaldoService` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=AguinaldoService`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 65-01-01 | 01 | 1 | PAY-30 | unit | `npm test -- --testPathPattern=AguinaldoService` | ❌ W0 | ⬜ pending |
| 65-01-02 | 01 | 1 | PAY-30 | unit | `npm test -- --testPathPattern=AguinaldoService` | ❌ W0 | ⬜ pending |
| 65-02-01 | 02 | 1 | PAY-30 | integration | `npx tsc --noEmit` (src/backend) | ❌ W0 | ⬜ pending |
| 65-03-01 | 03 | 2 | PAY-30 | e2e-manual | n/a | ❌ W0 | ⬜ pending |
| 65-03-02 | 03 | 2 | PAY-30 | e2e-manual | n/a | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/backend/src/__tests__/unit/services/AguinaldoService.test.ts` — unit test stubs for PAY-30
- [ ] Existing `src/backend/jest.config.ts` — already present, no install needed

*Existing Jest infrastructure covers the framework. Only test file stubs are Wave 0.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| AguinaldoCard renders in employee profile with correct amount and progress bar | PAY-30 | Frontend component rendering requires browser | Navigate to any employee profile, verify card shows ₡[monto], progress bar reflects months/12 ratio |
| Wizard Step 3 column "Aguinaldo acum." shows per-employee values | PAY-30 | Wizard flow requires browser interaction | Open payroll wizard, reach step 3, verify column appears with values per employee |
| Wizard Step 4 summary box shows total commitment | PAY-30 | Summary box visibility depends on data state | Reach wizard step 4, verify "Compromiso de Aguinaldo" box shows total and accumulated amounts |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
