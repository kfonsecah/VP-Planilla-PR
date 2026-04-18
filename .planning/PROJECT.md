# VP-Planilla

## What This Is

Sistema de planilla (nómina) para Costa Rica. Maneja el ciclo completo: empleados, períodos de planilla, cálculo de horas y horas extra según ley laboral costarricense, deducciones CCSS, generación de reportes oficiales y envío por email.

## Core Value

Calcular y generar planillas correctas conforme a la ley laboral costarricense, con datos seguros y auditables.

## Current State (v1.5 — 2026-04-18, Phase 41 complete)

**v1.5 IN PROGRESS** — Gestión de Marcas y Planilla para Producción:
- ✅ **Phase 41 complete:** Clock Aliases + IN/OUT Type Inference by Sequence.
  - `vpg_clock_aliases` table with FK to employees, unique constraint on (employee_id, name).
  - `ClockAliasService` with CRUD + `resolveEmployeeByAlias()` for import pipeline.
  - REST endpoints: POST/GET/DELETE `/api/employees/:id/aliases` (admin-protected for write).
  - `inferLogTypeBySequence()` — groups by (employee_id, date), alternates IN/OUT by timestamp.
  - Import pipeline now checks aliases after numeric ID, before full name scan.
  - Type inference enables Excel files without log_type column to import correctly.
  - 492 backend tests, all passing.
- ✅ **Phase 32 complete:** Adjustment Layer schema + Payroll State Machine DB foundation.
  - `vpg_clock_log_adjustments` table with ADD/EDIT/VOID types, optimistic locking, nullable FK for ADD type.
  - `vpg_payroll_recalculations` audit trail table with JSONB snapshots.
  - `vpg_payrolls.payrolls_status` migrated from String → `PayrollStatus` enum (BORRADOR/APROBADA/PAGADA).
  - Approval/reopen audit fields on `vpg_payrolls`.
  - Zod validation schemas: `AdjustmentSchema` (discriminatedUnion), `RecalculationSchema`, updated `PayrollSchema` + `ClockLogSchema`.

**v1.4 SHIPPED** — Stability and Integration Hardening:
- ✅ **Auth Lifecycle:** Unified refresh/revocation/logout flow with consistent error mapping.
- ✅ **HTTP Layer:** Enforced unified client (`http.ts`) for all frontend services, eliminating raw fetch bypasses.
- ✅ **Repository Hygiene:** Purged git index of build artifacts/OS noise and standardized lock file policies.
- ✅ **Modularization:** Monolith decomposition into specialized services (ClockLogs, Audit, Notifications).
- ✅ **Security:** Email-verified password reset flow with bcrypt hashing.
- ✅ **Code Quality:** Centralized environment validation (Zod) and Java unit testing baseline (JUnit 5).

## Context

- **Stack:** Express 5 + TypeScript 5.8 (backend) · Next.js 15 + React 19 (frontend) · Prisma 6 + PostgreSQL · Tailwind 4
- **Arquitectura:** Route → Controller → Service → Prisma (backend) / Page → Hook → Service → http.ts (frontend)
- **Dominio:** Semana laboral lunes–sábado · 8h regulares/día · 1.5× hasta 10h · 2× sobre 10h · descanso semanal 0.5×
- **Tests:** 338 backend tests (Jest) + 5 Java tests (JUnit 5). Total: 343+ passing.
- **Performance:** JS diferido, imágenes comprimidas, Next.js compress habilitado.

## History

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

## Out of Scope

- Multitenancy / múltiples empresas — requiere rediseño del schema
- App móvil — fuera del alcance actual
- Integración directa con CCSS API — no hay API pública disponible
- Migración a microservicios — monolito es correcto para el tamaño actual
- Eliminar empleados permanentemente — solo desactivar (status: inactivo)

---
*Last updated: 2026-04-18 after Phase 41 completion*
