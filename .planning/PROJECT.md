# VP-Planilla

## What This Is

Sistema de planilla (nómina) para Costa Rica. Maneja el ciclo completo: empleados, períodos de planilla, cálculo de horas y horas extra según ley laboral costarricense, deducciones CCSS, generación de reportes oficiales y envío por email.

## Core Value

Calcular y generar planillas correctas conforme a la ley laboral costarricense, con datos seguros y auditables.

## Current State (v1.5 SHIPPED — 2026-04-24)

**v1.5 SHIPPED** — Gestión de Marcas y Planilla para Producción (Phases 32–48, 51 plans)

- ✓ Effective marks engine with non-destructive adjustment layer (ADD/EDIT/VOID + audit trail) — v1.5
- ✓ Payroll state machine (BORRADOR → APROBADA → PAGADA) + aguinaldo per CR labor law — v1.5
- ✓ 3-step payroll wizard (period → calculation review → approval) — v1.5
- ✓ Clock alias system with IN/OUT type inference for Excel imports — v1.5
- ✓ Mark recognition engine redesign (auto-detect columns, time windows, confidence indicators) — v1.5
- ✓ Grouped clock logs view: Branch → Employee → Day → IN/OUT pair — v1.5
- ✓ Configurable holidays engine (DB-backed, integrated into payroll math) — v1.5
- ✓ Employee profile redesign (consolidated tabs: summary, labor, salary, marks, events, docs) — v1.5
- ✓ Labor events calendar redesign — v1.5
- ✓ 497+ tests passing (492 Jest + 5 JUnit 5) — v1.5

**Next milestone:** v1.6 (to be defined via `/gsd:new-milestone`)

## Context

- **Stack:** Express 5 + TypeScript 5.8 (backend) · Next.js 15 + React 19 (frontend) · Prisma 6 + PostgreSQL · Tailwind 4
- **Arquitectura:** Route → Controller → Service → Prisma (backend) / Page → Hook → Service → http.ts (frontend)
- **Dominio:** Semana laboral lunes–sábado · 8h regulares/día · 1.5× hasta 10h · 2× sobre 10h · descanso semanal 0.5×
- **Tests:** 492+ backend tests (Jest) + 5 Java tests (JUnit 5). Total: 497+ passing.
- **Performance:** JS diferido, imágenes comprimidas, Next.js compress habilitado.

## History

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

## Out of Scope

- Multitenancy / múltiples empresas — requiere rediseño del schema
- App móvil — fuera del alcance actual
- Integración directa con CCSS API — no hay API pública disponible
- Migración a microservicios — monolito es correcto para el tamaño actual
- Eliminar empleados permanentemente — solo desactivar (status: inactivo)

---
*Last updated: 2026-04-25 after v1.5 milestone*
