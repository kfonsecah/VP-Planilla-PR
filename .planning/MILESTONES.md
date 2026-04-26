# Milestones

## v1.6 — Mejoras en Auditoría de Marcas y UX (In Progress)

**Goal:** Refinar la experiencia de usuario en la auditoría de marcas y asegurar la persistencia de configuraciones críticas.
**Phases:** 49-52
**Status:** In Progress

---

## v1.5 — Gestión de Marcas y Planilla para Producción (Shipped: 2026-04-24)

**Phases completed:** 17 phases (32-48), 51 plans
**Timeline:** 2026-04-12 → 2026-04-24 (12 days)
**Tests:** 492+ backend (Jest) + 5 Java (JUnit 5) = 497+ total
**LOC:** ~13,278 TypeScript
**Status:** Archived
**Known deferred items at close:** 22 (see STATE.md Deferred Items)

**Key accomplishments:**
1. **Effective Marks Engine:** Non-destructive adjustment layer (ADD/EDIT/VOID) with mandatory justification, payroll lock enforcement, and full audit trail in `vpg_clock_log_adjustments`.
2. **Payroll State Machine:** BORRADOR → APROBADA → PAGADA lifecycle with aguinaldo calculation per Costa Rica labor law. Full REST API for all transitions.
3. **Payroll Wizard:** 3-step guided flow (period selection → calculation review → approval) replacing the flat payroll page.
4. **Clock Alias System:** `vpg_clock_aliases` table with CRUD, `resolveEmployeeByAlias()`, and IN/OUT type inference by sequence for Excel imports without log_type column.
5. **Mark Recognition Engine Redesign:** Excel parser with automatic column detection, configurable time-window classification with confidence indicators, day-confirmation audit UI.
6. **Grouped Clock Logs View:** Hierarchical layout (Branch → Employee → Day → IN/OUT pair) with infinite scroll and biweekly presets.
7. **Configurable Holidays Engine:** DB-backed company holidays integrated into payroll math (mandatory pay + triple overtime on holidays).
8. **Employee Profile Redesign:** Consolidated tabs (summary, labor, salary, marks, events, docs) with full modal integration.
9. **Labor Calendar Redesign:** Modern sidebar + mini-calendar + event filters + animated popovers.
10. **Repo Cleanup:** Dead code removed (holidays.ts), .gitignore verified, stale docs purged.

**Archive:** `.planning/milestones/v1.5-ROADMAP.md`

---

## v1.4 — Stability and Integration Hardening (Shipped: 2026-04-12)

**Phases completed:** 8 phases (24-31), 15 plans
**Timeline:** 2026-04-09 → 2026-04-12 (4 days)
**Status:** Archived

**Key accomplishments:**
1. **Auth Hardening:** Unified token lifecycle (refresh/revocation/logout) with consistent error mapping.
2. **HTTP Enforcement:** Unified frontend client (`http.ts`) for all business services.
3. **Repository Hygiene:** Clean git index (removed IDE/build artifacts) and tracked `package-lock.json`.
4. **Modularization:** Monolith decomposition into `ClockLogsService`, `ImportSessionService`, etc.
5. **Security:** Secure email-verified password reset flow with bcrypt hashing.
6. **Code Quality:** Centralized environment configuration validated with Zod.
7. **Java Automation:** Introduced JUnit 5 and Mockito baseline for the clock-log utility.

**Archive:** `.planning/milestones/v1.4-ROADMAP.md`

---

## v1.3 — Sistema de Marcas de Reloj Robusto (Shipped: 2026-04-09)

**Phases completed:** 6 phases (18-23), 14 plans
**Timeline:** 2026-04-05 → 2026-04-09 (4 dias)
**Status:** User-confirmed milestone closure

**Key accomplishments:**
1. Pipeline robusto de marcas con normalizacion canonica IN/OUT y trazabilidad status/source
2. Sesiones de importacion con vinculo a marcas y endpoints de consulta operativos
3. Deteccion automatica de huerfanas/anomalias + endpoints de resolucion
4. Correccion manual con auditoria y proteccion de rutas administrativas
5. Dashboard UI de marcas con filtros, badges, modal de detalle y sesiones recientes

**Archive:** `.planning/milestones/v1.3-ROADMAP.md`

---

## v1.2 — Cobertura de Tests y Mejoras UI (Shipped: 2026-04-04)

**Phases completed:** 1 phase (17), 3 plans + 2 quick tasks
**Timeline:** 2026-04-02 → 2026-04-04 (2 días)
**Tests:** 104 → 287 (+183), 17 suites, 0 failures, cobertura 42.49%

**Key accomplishments:**
1. 9 nuevas suites de tests unitarios
2. payrollUtils.test.ts extendido a 103 casos (97% cobertura)
3. sessionStorage cache (TTL 5 min) implementado en 8 hooks
4. Sidebar modernizado — zinc-950, animaciones, dot status

**Archive:** `.planning/milestones/v1.2-ROADMAP.md`

---
