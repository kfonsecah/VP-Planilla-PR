---
phase: 63
slug: panel-admin-parametros-legales
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 63 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (backend) / next lint + tsc (frontend) |
| **Config file** | src/backend/jest.config.js |
| **Quick run command** | `npm run test` (backend) / `npx tsc --noEmit` (frontend) |
| **Full suite command** | `npm run test` (backend) / `npx tsc --noEmit` (frontend) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (for frontend) or `npm run test` (for backend)
- **After every plan wave:** Run full verification (`npm run test` && `npx tsc --noEmit`)
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 63-01-01 | 01 | 1 | PAY-28 | — | N/A | types | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 63-01-02 | 01 | 1 | PAY-28 | — | Admin only | test | `npm run test` | ✅ | ⬜ pending |
| 63-02-01 | 02 | 2 | PAY-28 | — | N/A | types | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 63-03-01 | 03 | 3 | PAY-28 | — | Password Gate | types | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |
| 63-04-01 | 04 | 4 | PAY-28 | — | N/A | types | `npx tsc --noEmit` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/frontend/src/app/pages/configuracion/parametros-legales/page.tsx` — basic shell
- [ ] `src/frontend/src/components/LegalParamCard.tsx` — stubs

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Bulk Update UI | PAY-28 | Complejo mockear interacciones de bulk en UI | Probar la tabla, simular nuevo decreto y ver que PasswordConfirmModal reacciona correctamente |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 20s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
