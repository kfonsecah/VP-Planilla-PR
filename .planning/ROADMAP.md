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

### 🚧 v1.4 (In Progress)

- [x] **Phase 24: Auth Token Lifecycle End-to-End** - Unificar refresh/revocation/logout y errores de autenticacion en toda la plataforma (completed 2026-04-09)
- [x] **Phase 25: HTTP Client Layer Enforcement** - Eliminar bypasses a `http.ts` y estandarizar manejo de errores en servicios frontend (completed 2026-04-11)
- [x] **Phase 26: Repository Hygiene and Build Artifacts Cleanup** - Limpiar artefactos versionados y reforzar `.gitignore` multi-stack (completed 2026-04-11)
- [x] **Phase 27: Monolith Decomposition and Maintainability** - Refactor de archivos monoliticos con pruebas de regresion (completed 2026-04-11)
- [x] **Phase 28: Email Notification Module** - Módulo de notificaciones por email con Resend (completed 2026-04-11)
- [x] **Phase 29: Implement `changePassword` Feature** - Sistema de recuperación de contraseña con código de verificación (completed 2026-04-12)
- [x] **Phase 30: Fix Repository Hygiene** (completed 2026-04-12)
- [ ] **Phase 31: Improve Code Quality & Automation**

### Phase 26: Repository Hygiene and Build Artifacts Cleanup

**Goal:** Limpiar artefactos versionados y reforzar `.gitignore` multi-stack para que dist/, target/ y outputs de build no se versionen.

**Requirements:** HYG-01, HYG-02, HYG-03

**Plans:** 3 plans

Plans:
- [x] 26-01-PLAN.md — Auditoría y limpieza de artefactos versionados del repo
- [x] 26-02-PLAN.md — Refuerzo de .gitignore multi-stack (backend, frontend, Java)
- [x] 26-03-PLAN.md — Cierre de brechas: artefactos Python y lock files recursivos

### Phase 27: Monolith Decomposition and Maintainability

**Goal:** Refactor de archivos monoliticos de alta complejidad separando responsabilidades y desacoplando logica de negocio de UI.

**Requirements:** MOD-01, MOD-02, MOD-03

**Plans:** 3 plans

Plans:
- [x] 27-01-PLAN.md — Auditoria de complejidad y seleccion de candidatos para descomposicion
- [x] 27-02-PLAN.md — Refactor de logica de parsing e importacion de marcas (desacople de Page/Hook)
- [x] 27-03-PLAN.md — Cierre de fase y validacion de no regresion con suite de pruebas

#### Phase 25 Planning Snapshot

**Goal:** Eliminar bypasses a `http.ts` y estandarizar el manejo de errores y llamadas a APIs externas.

**Requirements:** HTTP-01, HTTP-02, HTTP-03

**Plans:** 2 plans

Plans:
- [x] 25-01-PLAN.md — Refactor de servicios internos (auditLogs, branch, payrollEmployees) a http.ts
- [x] 25-02-PLAN.md — Capa de API externa para clima y verificación final de cumplimiento

### Phase 28: Email Notification Module
**Goal:** Implementar un módulo de notificaciones por email usando Gmail API con OAuth2 para enviar emails sin ser marcado como spam.

**Requirements:** EMAIL-01, EMAIL-02, EMAIL-03 (TBD)
**Gap Closure:** Nuevo módulo - sistema de notificaciones por email para la planilla.

### Phase 29: Implement `changePassword` Feature
**Goal:** Implement the full `changePassword` functionality, resolving the stub in `AuthController.ts`.
**Requirements:** AUTH-09 (TBD)
**Gap Closure:** Closes gap from v1.4 audit: `changePassword` stub.

**Plans:** 1/1 plans complete

Plans:
- [x] 29-01-PLAN.md — Secure password change with email verification code (6-digit, 15-min expiry)

### Phase 30: Fix Repository Hygiene
**Goal:** Fix repository hygiene issues identified in the v1.4 audit.
**Requirements:** HYG-01, HYG-02
**Gap Closure:** Closes gaps from v1.4 audit: tracked `.pyc` files and inconsistent lock file policy.

### Phase 31: Improve Code Quality & Automation
**Goal:** Refactor code for better maintainability and improve test automation by centralizing env vars and adding Java unit tests.

**Requirements:** QUAL-01, QUAL-02
**Gap Closure:** Closes gaps from v1.4 audit: manual test execution and direct `process.env` access.

**Plans:** 1/2 plans executed

Plans:
- [x] 31-01-PLAN.md — Centralized and validated backend environment configuration (Zod)
- [ ] 31-02-PLAN.md — Automated unit tests for Java clocklogs utility (JUnit 5)

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
| 26. Repository Hygiene and Build Cleanup | v1.4 | 3/3 | Complete | 2026-04-11 |
| 27. Monolith Decomposition and Maintainability | v1.4 | 3/3 | Complete | 2026-04-11 |
| 28. Email Notification Module | v1.4 | 2/2 | Complete | 2026-04-11 |
| 29. Implement changePassword Feature | v1.4 | 1/1 | Complete | 2026-04-12 |
| 30. Fix Repository Hygiene | v1.4 | 1/1 | Complete | 2026-04-12 |

## Archives

- Milestone roadmap archive: `.planning/milestones/v1.3-ROADMAP.md`
- Milestone roadmap archive: `.planning/milestones/v1.4-ROADMAP.md` (Update candidate after v1.4 completion)
- Milestone requirements archive: `.planning/milestones/v1.3-REQUIREMENTS.md`
