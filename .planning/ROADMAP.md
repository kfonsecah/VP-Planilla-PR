# Roadmap: VP-Planilla

## Milestones

- ✅ **v1.3 — Sistema de Marcas de Reloj Robusto** (shipped 2026-04-09)
- 🚧 **v1.4 — Stability and Integration Hardening**

## Phases

<details>
<summary>✅ v1.3 (Phases 18-23) — SHIPPED 2026-04-09</summary>

- [x] Phase 18: Normalización y Trazabilidad
- [x] Phase 19: Sesiones de Importación
- [x] Phase 20: Huérfanas y Anomalías
- [x] Phase 21: Corrección Manual
- [x] Phase 22: Dashboard UI de Marcas
- [x] Phase 23: Debug y Corrección de Funcionalidad de Marcas

</details>

### 🚧 v1.4 (Planned)

- [x] **Phase 24: Auth Token Lifecycle End-to-End** - Unificar refresh/revocation/logout y errores de autenticacion en toda la plataforma (completed 2026-04-09)
- [x] **Phase 25: HTTP Client Layer Enforcement** - Eliminar bypasses a `http.ts` y estandarizar manejo de errores en servicios frontend (completed 2026-04-11)
- [ ] **Phase 26: Repository Hygiene and Build Artifacts Cleanup** - Limpiar artefactos versionados y reforzar `.gitignore` multi-stack
- [ ] **Phase 27: Monolith Decomposition and Maintainability** - Refactor de archivos monoliticos con pruebas de regresion

### Phase 26: Repository Hygiene and Build Artifacts Cleanup

**Goal:** Limpiar artefactos versionados y reforzar `.gitignore` multi-stack para que dist/, target/ y outputs de build no se versionen.

**Requirements:** HYG-01, HYG-02, HYG-03

**Plans:** 3 plans

Plans:
- [x] 26-01-PLAN.md — Auditoría y limpieza de artefactos versionados del repo
- [x] 26-02-PLAN.md — Refuerzo de .gitignore multi-stack (backend, frontend, Java)
- [ ] 26-03-PLAN.md — Cierre de brechas: artefactos Python y lock files recursivos

#### Phase 25 Planning Snapshot

**Goal:** Eliminar bypasses a `http.ts` y estandarizar el manejo de errores y llamadas a APIs externas.

**Requirements:** HTTP-01, HTTP-02, HTTP-03

**Plans:** 2 plans

Plans:
- [x] 25-01-PLAN.md — Refactor de servicios internos (auditLogs, branch, payrollEmployees) a http.ts
- [x] 25-02-PLAN.md — Capa de API externa para clima y verificación final de cumplimiento

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 18. Normalización y Trazabilidad | v1.3 | 2/2 | Complete | 2026-04-05 |
| 19. Sesiones de Importación | v1.3 | 2/2 | Complete | 2026-04-05 |
| 20. Huérfanas y Anomalías | v1.3 | 3/3 | Complete | 2026-04-05 |
| 21. Corrección Manual | v1.3 | 2/2 | Complete | 2026-04-05 |
| 22. Dashboard UI de Marcas | v1.3 | 3/3 | Complete | 2026-04-06 |
| 23. Debug y Corrección de Marcas | v1.3 | 2/2 | Complete | 2026-04-09 |
| 24. Auth Token Lifecycle End-to-End | v1.4 | 3/3 | Complete   | 2026-04-09 |
| 25. HTTP Client Layer Enforcement | v1.4 | 2/2 | Complete | 2026-04-11 |
| 26. Repository Hygiene and Build Cleanup | v1.4 | 2/3 | In Progress | — |
| 27. Monolith Decomposition and Maintainability | v1.4 | 0/3 | Pending | — |

## Archives

- Milestone roadmap archive: `.planning/milestones/v1.3-ROADMAP.md`
- Milestone roadmap archive: `.planning/milestones/v1.4-ROADMAP.md` (Update candidate after v1.4 completion)
- Milestone requirements archive: `.planning/milestones/v1.3-REQUIREMENTS.md`
