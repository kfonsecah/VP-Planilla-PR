# Roadmap: VP-Planilla

## Archived Milestones
- [v1.9 (Advanced Reporting & Hacienda Prep)](.planning/milestones/v1.9-ROADMAP.md) — 2026-05-13
- [v1.8 (Stabilization & Planning Sync)](.planning/milestones/v1.8-ROADMAP.md) — 2026-05-11
- [v1.7 (Robustez y Parámetros Legales)](.planning/milestones/v1.7-ROADMAP.md) — 2026-05-09
- [v1.6 (Mejoras en Auditoría de Marcas y UX)](.planning/milestones/v1.6-ROADMAP.md) — 2026-04-26
- [v1.5 (Gestión de Marcas y Planilla para Producción)](.planning/milestones/v1.5-ROADMAP.md) — 2026-04-24
- [v1.4 (Stability and Integration Hardening)](.planning/milestones/v1.4-ROADMAP.md) — 2026-04-12
- [v1.3 (Sistema de Marcas de Reloj Robusto)](.planning/milestones/v1.3-ROADMAP.md) — 2026-04-09
- [v1.2 (Cobertura de Tests y Mejoras UI)](.planning/milestones/v1.2-ROADMAP.md) — 2026-04-04
- [v1.1 (Security & Auth)](.planning/milestones/v1.1-ROADMAP.md) — 2026-04-02
- [v1.0 (Foundation)](.planning/milestones/v1.0-ROADMAP.md) — 2026-03-27

## Current Milestone: v1.10 — Production Hardening & Developer Experience

**Goal:** Agregar observabilidad de errores, protección contra HPP, estandarización de commits y documentación de DBML para mayor robustez y mantenibilidad.

### Phases
- [ ] **Phase 74: Standards & Git Hygiene** - Estandarización de historial Git y documentación automática del esquema.
- [ ] **Phase 75: Security & API Hardening** - Protección contra HPP y compatibilidad estricta con Express 5 para query parameters.
- [ ] **Phase 76: Error Observability & Tracing** - Implementación de monitoreo de errores full-stack y trazabilidad distribuida.

## Phase Details

### Phase 74: Standards & Git Hygiene
**Goal**: Establecer estándares de repositorio y documentación de base de datos automatizada.
**Depends on**: Nothing (start of milestone)
**Requirements**: DX-01, DX-02
**Success Criteria** (what must be TRUE):
  1. Los commits que no sigan la convención "Conventional Commits" son rechazados por Git.
  2. La ejecución de un comando (ej. `npm run dbml`) genera un archivo DBML actualizado basado en el schema de Prisma.
**Plans**: 2 plans
- [x] 74-01-PLAN.md — Configure Husky and Commitlint at root.
- [ ] 74-02-PLAN.md — Integrate prisma-dbml-generator in backend.

### Phase 75: Security & API Hardening
**Goal**: Asegurar la integridad de la API contra ataques de polución de parámetros y asegurar estabilidad en Express 5 mediante normalización global.
**Depends on**: Phase 74
**Requirements**: SEC-01, SEC-02
**Success Criteria** (what must be TRUE):
  1. Las peticiones con parámetros de consulta duplicados (HPP) son normalizadas o rechazadas por el middleware.
  2. Un middleware global intercepta y normaliza `req.query` (last-value-wins) antes de llegar a los controladores, eliminando el riesgo de mutación y duplicidad.
**Plans**: TBD

### Phase 76: Error Observability & Tracing
**Goal**: Visibilidad total de errores en producción vinculando el comportamiento del cliente con el servidor.
**Depends on**: Phase 75
**Requirements**: OBS-01, OBS-02, OBS-03
**Success Criteria** (what must be TRUE):
  1. Los errores del backend se reportan a Sentry con contexto de entorno y traza de pila.
  2. Los errores del frontend (Next.js) y Server Actions se capturan automáticamente en Sentry.
  3. El dashboard de Sentry muestra trazas vinculadas (Distributed Tracing) entre peticiones del frontend y ejecuciones del backend.
**Plans**: TBD
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 74. Standards & Git Hygiene | 1/2 | In Progress|  |
| 75. Security & API Hardening | 0/1 | Not started | - |
| 76. Error Observability & Tracing | 0/1 | Not started | - |
