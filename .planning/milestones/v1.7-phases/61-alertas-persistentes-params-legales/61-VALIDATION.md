---
phase: 61
slug: alertas-persistentes-params-legales
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-28
---

# Phase 61 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x + ts-jest |
| **Config file** | `src/backend/jest.config.js` |
| **Quick run command** | `npm test -- --testPathPattern=LegalParam` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern=LegalParam`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 61-01-01 | 01 | 1 | PAY-26 | migration | `npx prisma migrate dev --name legal-param-alerts` | ❌ W0 | ⬜ pending |
| 61-01-02 | 01 | 1 | PAY-26 | unit | `npm test -- --testPathPattern=LegalParam` | ❌ W0 | ⬜ pending |
| 61-02-01 | 02 | 2 | PAY-26 | unit | `npm test -- --testPathPattern=LegalParam` | ❌ W0 | ⬜ pending |
| 61-03-01 | 03 | 3 | PAY-26 | e2e-manual | See Manual-Only Verifications | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/backend/src/__tests__/LegalParamAlert.test.ts` — stubs for PAY-26 (fan-out, acknowledge, message generation)
- [ ] Existing `src/backend/jest.config.js` — already configured, no install needed

*Existing infrastructure covers the phase. Only test file stubs need to be created in Wave 0.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Banner appears/disappears on acknowledge | PAY-26 SC2 | Requires browser rendering and React state transitions | 1. Login as admin. 2. Change OT_FACTOR. 3. Verify red banner appears on dashboard. 4. Click "Marcar como revisado". 5. Verify banner disappears. |
| Bell red dot visibility | PAY-26 SC1 | Requires visual inspection in browser | 1. Create a LEGAL_PARAM_CHANGE notification. 2. Verify 6px red dot appears on bell icon. |
| MIN_WAGE_CHECK_ENABLED message | PAY-26 SC3 | Requires full API + frontend integration | 1. Set MIN_WAGE_CHECK_ENABLED=0. 2. Verify banner shows "Verificación de salario mínimo DESACTIVADA — Riesgo legal". |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
