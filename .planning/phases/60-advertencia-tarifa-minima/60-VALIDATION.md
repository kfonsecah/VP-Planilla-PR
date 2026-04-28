---
phase: 60
slug: advertencia-tarifa-minima
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-04-26
---

# Phase 60 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` (frontend) o `npm test -- path` (backend)
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 60-01-01 | 01 | 1 | PAY-25 | — | N/A | types | `npx tsc --noEmit` | ✅ W0 | ✅ green |
| 60-01-02 | 01 | 1 | PAY-25 | — | N/A | types | `npx tsc --noEmit` | ✅ W0 | ✅ green |
| 60-01-03 | 01 | 1 | PAY-25 | T-60-01 | Audit log written | unit | `npm test -- src/__tests__/unit/services/PayrollService.test.ts` | ✅ W0 | ✅ green |
| 60-02-01 | 02 | 2 | PAY-25 | — | N/A | types | `npx tsc --noEmit` | ✅ W0 | ✅ green |
| 60-02-02 | 02 | 2 | PAY-25 | — | N/A | lint | `next lint` | ✅ W0 | ✅ green |
| 60-03-01 | 03 | 2 | PAY-25 | — | N/A | types | `npx tsc --noEmit` | ✅ W0 | ✅ green |
| 60-03-02 | 03 | 2 | PAY-25 | — | N/A | types | `npx tsc --noEmit` | ✅ W0 | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual Warning | PAY-25 | UI interaction | Abrir el Wizard de planilla, verificar que aparece "⚠️" en empleados con salario bajo. |
| Audit Log Verification | PAY-25 | DB check | Aprobar una planilla con advertencias, verificar registro en `vpg_audit_logs`. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-26
