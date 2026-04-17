# Roadmap: VP-Planilla

## Milestones

- 🔄 **v1.5 — Gestión de Marcas y Planilla para Producción** (in progress)
- ✅ **v1.4 — Stability and Integration Hardening** (shipped 2026-04-12)
- ✅ **v1.3 — Sistema de Marcas de Reloj Robusto** (shipped 2026-04-09)

## Milestone History

- [x] **v1.4 — Stability and Integration Hardening** (2026-04-09 → 2026-04-12) — [Archive](.planning/milestones/v1.4-ROADMAP.md)
  - All 8 phases completed (Phases 24-31).
  - Auth/HTTP/Hygiene/Modularization requirements fulfilled.
  - 441+ tests total across stacks.

## Phases — v1.5 (Phases 32-39)

- [ ] Phase 32: Schema — Capa de Ajustes + Campos Aprobación Planilla
  **Goal:** Estructurar la base de datos para soportar ajustes no destructivos de marcas y el ciclo de vida de aprobación de planilla.
  **Plans:** 2 plans
  - [x] 32-01-PLAN.md — Define models and enums in Prisma schema and apply migration.
  - [x] 32-02-PLAN.md — Create Zod schemas for the new models and update existing ones.
- [ ] Phase 33: Backend — Motor de Marcas Efectivas + API de Ajustes
  **Goal:** Implementar la lógica de negocio y endpoints para gestionar ajustes (EDIT/VOID) y calcular marcas efectivas emparejadas.
  **Plans:** 3 plans
  - [x] 33-01-PLAN.md — Adjustment Service & Validation (Payroll Lock + Auditing).
  - [x] 33-02-PLAN.md — Effective Marks Engine (Prisma.distinct + Fallback Logic).
  - [x] 33-03-PLAN.md — Pairing Engine & API Endpoints (Paired IN/OUT + Controller).
- [ ] Phase 34: Frontend — Rediseño Clock Logs (Vista Agrupada)
  **Goal:** Reemplazar la tabla plana de marcas con una vista jerárquica agrupada (Sucursal > Empleado > Día > Par) que facilita la detección rápida de anomalías antes del cálculo de planilla.
  **Plans:** 5 plans
  - [x] 34-01-PLAN.md — Service layer + Hook (effectiveMarksService.ts + useEffectiveMarks.ts).
  - [x] 34-02-PLAN.md — Core components (BranchGroup, EmployeeCard, DailyRow).
  - [x] 34-03-PLAN.md — Page redesign (page.tsx reconstruction + ImportSessionsPanel + infinite scroll).
  - [x] 34-04-PLAN.md — Backend pagination and branch metadata for effective marks.
  - [x] 34-05-PLAN.md — Update ClockLogAdjustmentController with pagination.
- [ ] Phase 35: Frontend — Corrección de Marcas (Agregar/Editar/Anular)
  **Goal:** Implementar los modales de corrección de marcas (agregar/editar/anular) con justificación obligatoria y vista de auditoría.
  **Plans:** 5 plans
  - [x] 35-01-PLAN.md — Add Clock Log Modal with service layer.
  - [x] 35-02-PLAN.md — Edit Clock Log Modal.
  - [x] 35-03-PLAN.md — Void Clock Log Modal with confirmation.
  - [x] 35-04-PLAN.md — Audit Timeline component.
  - [x] 35-05-PLAN.md — Integration into attendance page.
- [ ] Phase 36: Backend — State Machine de Planilla + Aguinaldo
  **Goal:** Implementar el ciclo de vida de la planilla (BORRADOR → APROBADA → PAGADA) y cálculo de aguinaldo según ley laboral costarricense.
  **Plans:** 2 plans
  - [x] 36-01-PLAN.md — State machine service methods (approvePayroll, markAsPaid, reopenPayroll, recalculatePayroll) + aguinaldo calculation + tests.
  - [x] 36-02-PLAN.md — REST API endpoints for state transitions and aguinaldo.
- [ ] Phase 37: Frontend — Wizard de Planilla Quincenal
  **Goal:** Reemplazar la página actual de cálculo con un wizard guiado de 3 pasos que lleve al jefe desde la selección de período hasta la aprobación.
  **Plans:** 5 plans
  - [x] 37-01-PLAN.md — Core wizard infrastructure (PayrollWizard, usePayrollWizard hook, PayrollPeriodCard)
  - [x] 37-02-PLAN.md — Step 2 wrapper with PayrollResults integration
  - [x] 37-03-PLAN.md — Step 3 executive summary + Phase 36 state machine integration
  - [x] 37-04-PLAN.md — Payroll list with status badges and contextual actions
  - [x] 37-05-PLAN.md — Gap closure: fix status badges, contextual buttons, wizard data integration
- [ ] Phase 38: Tests Unitarios + Verificación de Integración
  **Goal:** Ejecutar y verificar la suite de pruebas unitarias y de integración para asegurar la estabilidad de las nuevas funcionalidades de la v1.5.
  **Plans:** 2 plans
  - [x] 38-01-PLAN.md — Run test suite and categorize failures
  - [ ] 38-02-PLAN.md — Fix identified test failures
- [x] Phase 39: Frontend — Corregir Selector de Posición en Edición de Empleado
  **Goal:** Corregir el selector de posiciones en el formulario de edición de empleados para que muestre las posiciones correctamente, sincronizado con la tabla de empleados.
  **Plans:** 2 plans (COMPLETE)
  - [x] 39-01-PLAN.md — Fix Selector display and consistency
  - [x] 39-02-PLAN.md — Ensure Data Synchronization

<details>
<summary>✅ v1.4 (Phases 24-31) — SHIPPED 2026-04-12</summary>

- [x] Phase 24: Auth Token Lifecycle End-to-End
- [x] Phase 25: HTTP Client Layer Enforcement
- [x] Phase 26: Repository Hygiene and Build Artifacts Cleanup
- [x] Phase 27: Monolith Decomposition and Maintainability
- [x] Phase 28: Email Notification Module
- [x] Phase 29: Implement changePassword Feature
- [x] Phase 30: Fix Repository Hygiene
- [x] Phase 31: Improve Code Quality & Automation

</details>

<details>
<summary>✅ v1.3 (Phases 18-23) — SHIPPED 2026-04-09</summary>

- [x] Phase 18: Normalización y Trazabilidad
- [x] Phase 19: Sesiones de Importación
- [x] Phase 20: Huérfanas y Anomalías
- [x] Phase 21: Corrección Manual
- [x] Phase 22: Dashboard UI de Marcas
- [x] Phase 23: Debug y Corrección de Funcionalidad de Marcas

</details>

---
## Archives

- **v1.5** requirements: `.planning/milestones/v1.5-REQUIREMENTS.md`
- **v1.5** roadmap: `.planning/milestones/v1.5-ROADMAP.md`
- Milestone roadmap archive: `.planning/milestones/v1.4-ROADMAP.md`
- Milestone roadmap archive: `.planning/milestones/v1.3-ROADMAP.md`
- Milestone requirements archive: `.planning/milestones/v1.4-REQUIREMENTS.md`
- Milestone requirements archive: `.planning/milestones/v1.3-REQUIREMENTS.md`
