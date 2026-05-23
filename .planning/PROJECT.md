# VP-Planilla

## What This Is

Sistema de planilla (nómina) para Costa Rica. Maneja el ciclo completo: empleados, períodos de planilla, cálculo de horas y horas extra según ley laboral costarricense, deducciones CCSS, generación de reportes oficiales y envío por email.

## Core Value

Calcular y generar planillas correctas conforme a la ley laboral costarricense, con datos seguros y auditables.

## Current State (v1.10 SHIPPED — 2026-05-22)

Milestone v1.10 is complete. The system now has full-stack error observability (Sentry), HTTP Parameter Pollution protection, Conventional Commits enforcement, and auto-generated DB documentation. Next focus: planning v1.11.

**Shipped in v1.10:**
- Sentry full-stack (backend `--import` + frontend `instrumentation.ts`) with distributed tracing.
- HPP middleware + global `req.query` normalization (Express 5 safe).
- Husky + Commitlint enforcing Conventional Commits at root.
- `prisma-markdown` auto-generating schema docs via `npm run dbml`.

## Context

- **Stack:** Express 5 + TypeScript 5.8 (backend) · Next.js 15 + React 19 (frontend) · Prisma 6 + PostgreSQL · Tailwind 4
- **Arquitectura:** Route → Controller → Service → Prisma (backend) / Page → Hook → Service → http.ts (frontend)
- **Dominio:** Semana laboral lunes–sábado · 8h regulares/día · 1.5× hasta 10h · 2× sobre 10h · descanso semanal 0.5×
- **Legal Engine:** Dynamic parameters (OT, CCSS, Workday) via `vpg_legal_params` + historical snapshots.
- **Tests:** 578 backend tests (Jest) + 5 Java tests (JUnit 5). Total: 583+ passing.

## History

<details>
<summary>v1.10 SHIPPED (2026-05-22) — Production Hardening & Developer Experience</summary>

- Conventional Commits Enforcement: Husky + Commitlint configured at root; non-compliant messages rejected at commit time.
- Auto-generated DB Docs: `prisma-markdown` integrated as Prisma generator; `npm run dbml` produces full Markdown ER diagram.
- HPP Protection + Express 5 Safety: `hpp` + `Object.defineProperty` query normalization applied globally before all routes.
- Full-stack Observability: Sentry in backend (`--import instrument.js`) and Next.js frontend (`instrumentation.ts`) with distributed tracing + tunnel route.

</details>

<details>
<summary>v1.9 SHIPPED (2026-05-13) — Advanced Reporting & Hacienda Prep</summary>

- Institutional Metadata & Logic: Positions now store INS codes and risk classes; worked days calculated automatically per period.
- Regulatory Exports: Implementation of official CSV formats for CCSS (SICERE), INS (Riesgos), and Hacienda (D-151).
- Data Integrity Engine: Rule-based engine with 7 core validations for IDs, positions, calculations, and clock logs.
- Analytics Dashboard: Visual health scoring and severity-grouped integrity alerts for administrative governance.

</details>

<details>
<summary>v1.8 SHIPPED (2026-05-11) — Stabilization & Planning Sync</summary>

- Engine Parameterization: Eliminated all hardcoded literals in payroll and aguinaldo engines.
- Wizard Refactor: Modularized the Payroll Wizard into a type-safe, multi-component architecture.
- Documentation: Achieved 100% JSDoc coverage for core services.
- Environment: Verified full project stability (TSC + 566 tests).

</details>

<details>
<summary>v1.7 SHIPPED (2026-05-09) — Robustez y Parámetros Legales</summary>

- Dynamic Legal Parameters: Externalized calculation constants to an auditable database system.
- Historical Snapshots: Automatic preservation of legal context for every approved payroll.
- Dynamic Shifts: Native support for Diurna (8h), Mixta (7h), and Nocturna (6h) shifts with automatic overtime calculation.
- Modular Employee Profile: Functional tabs for history, events, and document metadata (CRUD).
- Administrative Governance: Control panel for legal parameters with password protection and audit notifications.
- Enhanced Wizard: 4-step payroll flow with manual adjustments and employee selection.

</details>

<details>
<summary>v1.6 SHIPPED (2026-04-26) — Mejoras en Auditoría de Marcas y UX</summary>

- View persistence via URL and LocalStorage for auditor efficiency.
- Real-time confidence logic correction and status recalculation.

</details>

<details>
<summary>v1.5 SHIPPED (2026-04-24) — Gestión de Marcas y Planilla para Producción</summary>

- Effective marks engine with non-destructive adjustment layer (ADD/EDIT/VOID + audit trail)
- Payroll state machine (BORRADOR → APROBADA → PAGADA) + aguinaldo per CR labor law
- 3-step payroll wizard (period → calculation review → approval)
- Clock alias system with IN/OUT type inference for Excel imports
- Mark recognition engine redesign (auto-detect columns, time windows, confidence indicators)
- Grouped clock logs view: Branch → Employee → Day → IN/OUT pair
- Configurable holidays engine (DB-backed, integrated into payroll math)
- Employee profile redesign (consolidated tabs: summary, labor, salary, marks, events, docs)
- Labor events calendar redesign
- 497+ tests passing (492 Jest + 5 JUnit 5)

</details>

<details>
<summary>v1.4 SHIPPED (2026-04-12) — Stability and Integration Hardening</summary>

- Auth lifecycle unified (refresh/revocation/logout) with consistent error mapping
- HTTP layer enforced: all frontend services use `http.ts`, no raw fetch bypasses
- Repository hygiene: git index purged of build artifacts, `package-lock.json` tracked
- Monolith decomposed into specialized services (ClockLogs, Audit, Notifications)
- Email-verified password reset with bcrypt hashing and 15-min token expiry
- Centralized environment validation via Zod; JUnit 5 baseline for Java utility

</details>

<details>
<summary>v1.3 SHIPPED (2026-04-09) — Sistema de Marcas de Reloj Robusto</summary>

- Normalizacion de tipos de marcas (IN/OUT) y trazabilidad por status/source
- Sesiones de importacion con vinculo a marcas e historial operativo
- Motor de deteccion de huerfanas y anomalias con endpoints de consulta/resolucion
- Correccion manual con auditoria de cambios y rutas protegidas
- Dashboard de marcas (filtros, badges, sesiones, modal de detalle/correccion)

</details>

<details>
<summary>v1.2 SHIPPED (2026-04-04) — Cobertura de Tests y Mejoras UI</summary>

- 287 backend tests total.
- sessionStorage cache (TTL 5 min) en hooks.
- Sidebar modernizado (dark mode zinc-950).

</details>

## Technical Documentation

- **Database Schema (ERD):** Automatically generated in DBML format at `src/backend/prisma/dbml/schema.dbml`. Can be updated manually with `npm run dbml` in the backend.
- **API Reference:** Available via Swagger/Scalar at `/api-docs` when the backend is running.
- **Service Layer:** 100% JSDoc coverage for all core services in `src/backend/src/service/`.

## Out of Scope

- Multitenancy / múltiples empresas — requiere rediseño del schema
- App móvil — fuera del alcance actual
- Integración directa con CCSS API — no hay API pública disponible
- Migración a microservicios — monolito es correcto para el tamaño actual
- Eliminar empleados permanentemente — solo desactivar (status: inactivo)

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-22 after v1.10 milestone shipped*
