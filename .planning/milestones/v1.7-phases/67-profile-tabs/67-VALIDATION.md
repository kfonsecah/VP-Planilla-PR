---
phase: 67
slug: implementar-tabs-funcionales-en-el-perfil-de-empleado-planillas-eventos-laborales-documentos-y-otros-tabs-con-datos-reales-y-acciones-completas
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-09
---

# Phase 67 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.x (backend) + TypeScript compiler |
| **Config file** | `src/backend/jest.config.js` |
| **Quick run command** | `cd src/backend && npm test -- --testPathPattern=Employee` |
| **Full suite command** | `cd src/backend && npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit` in `src/backend/` and `src/frontend/`
- **After every plan wave:** Run `cd src/backend && npm test`
- **Before `/gsd:verify-work`:** Full suite must be green (546+ tests passing)
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 67-01-01 | 01 | 1 | — | compile | `cd src/backend && npx tsc --noEmit` | ✅ | ⬜ pending |
| 67-01-02 | 01 | 1 | — | compile | `cd src/backend && npx tsc --noEmit` | ✅ | ⬜ pending |
| 67-02-01 | 02 | 1 | — | compile | `cd src/backend && npx tsc --noEmit` | ✅ | ⬜ pending |
| 67-02-02 | 02 | 1 | — | compile | `cd src/backend && npx tsc --noEmit` | ✅ | ⬜ pending |
| 67-03-01 | 03 | 2 | — | compile | `cd src/frontend && npx tsc --noEmit` | ✅ | ⬜ pending |
| 67-03-02 | 03 | 2 | — | compile | `cd src/frontend && npx tsc --noEmit` | ✅ | ⬜ pending |
| 67-03-03 | 03 | 2 | — | compile | `cd src/frontend && npx tsc --noEmit` | ✅ | ⬜ pending |
| 67-04-01 | 04 | 3 | — | compile+lint | `cd src/frontend && npx tsc --noEmit && npx next lint` | ✅ | ⬜ pending |
| 67-04-02 | 04 | 3 | — | compile+lint | `cd src/frontend && npx tsc --noEmit && npx next lint` | ✅ | ⬜ pending |
| 67-04-03 | 04 | 3 | — | compile+lint | `cd src/frontend && npx tsc --noEmit && npx next lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements — no new test stubs needed for backend plans. Frontend tabs are UI-only and verified via TypeScript + lint.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tab Planillas muestra historial correcto | Plan 04 | Requiere browser | Ir a perfil empleado → tab Planillas, verificar filas con período, monto bruto, neto, badge de estado |
| Descarga de comprobante PDF | Plan 04 | Requiere browser + archivo PDF | Click en "Descargar" en una planilla pagada, verificar que se descarga PDF y no da 401 |
| Tab Eventos muestra eventos del empleado | Plan 04 | Requiere browser | Ir a tab Eventos, verificar que solo aparecen los eventos asignados a ese empleado |
| Modal asignación de evento funciona | Plan 04 | Requiere browser | Click "Asignar Evento", llenar formulario, guardar, verificar que aparece en lista |
| Tab Documentos CRUD | Plan 04 | Requiere browser | Agregar documento, verificar aparece en lista; eliminar, verificar desaparece |
| Sin datos muestra empty state adecuado | Plan 04 | Requiere browser | Ir a empleado sin planillas, verificar mensaje vacío en cada tab |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
