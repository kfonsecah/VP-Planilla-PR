# VP-Planilla

## What This Is

Sistema de planilla (nómina) para Costa Rica. Maneja el ciclo completo: empleados, períodos de planilla, cálculo de horas y horas extra según ley laboral costarricense, deducciones CCSS, generación de reportes oficiales y envío por email.

## Core Value

Calcular y generar planillas correctas conforme a la ley laboral costarricense, con datos seguros y auditables.

## Current State (v1.2 — 2026-04-04)

**v1.2 SHIPPED** — Cobertura de Tests y Mejoras UI:
- ✅ 104 tests backend pasando (8 suites): EmployeeService, ClockLogService, DeductionService, AuthService + v1.0 suites
- ✅ Design system dark mode: tokens CSS globales, paleta zinc-950, sidebar moderno con colapso mobile
- ✅ UI consistente: tablas, formularios, modales en todos los módulos con estilo dark
- ✅ Integración frontend-backend auditada: 3 payload mismatches corregidos, errores concretos, skeletons + toasts
- ✅ Servicio de notificaciones: backend API + Header panel + página dedicada + polling 30s
- ✅ Skeleton loading + error banners con retry en 18 vistas del sistema
- ✅ Rendimiento: ~1.55MB JS diferido, imágenes 11.5MB → 39KB (99.7% reducción)

## Context

- **Stack:** Express 5 + TypeScript 5.8 (backend) · Next.js 15 + React 19 (frontend) · Prisma 6 + PostgreSQL · Tailwind 4
- **Arquitectura:** Route → Controller → Service → Prisma (backend) / Page → Hook → Service → http.ts (frontend)
- **Dominio:** Semana laboral lunes–sábado · 8h regulares/día · 1.5× hasta 10h · 2× sobre 10h · descanso semanal 0.5×
- **Repositorio:** brownfield — código existente mejorado en v1.0, UI modernizada en v1.1
- **Tests:** 104 backend tests (8 suites), 0 failures
- **Performance:** ~1.55MB JS diferido, imágenes comprimidas 99.7%, Next.js compress habilitado

## Current Milestone: v1.3 (Planning)

**Previous:** v1.2 shipped 2026-04-04 — Phase 17 (287 tests, +183 nuevos), sessionStorage cache, Sidebar modernizado

**v1.1 accomplishments:**
- 104 backend tests, design system dark mode, UI consistente en todos los módulos
- Integración frontend-backend auditada, servicio de notificaciones completo
- Skeleton loading + error banners en 18 vistas, rendimiento mejorado (JS diferido, imágenes 99.7% comprimidas)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Singleton Prisma via lib/prisma.ts | Ya existía, solo faltaba usarlo | ✅ v1.0 |
| AuthMiddleware por ruta (router.use) | Más control sin allowlist complicada | ✅ v1.0 |
| Zod validation en backend | Frontend ya usa Zod | ✅ v1.0 |
| Feriados CR como lista estática | No hay API pública confiable | ✅ v1.0 |
| Token revocation con DB blocklist | Redis no está en el stack | ✅ v1.0 |
| No eliminar empleados — solo desactivar | Eliminar rompería historial de planillas | ✅ Regla de negocio |
| Dark mode: paleta zinc-950 exclusivamente | Consistencia visual, no gray-* ni hex sin dark: | ✅ v1.1 |
| Toast notifications: sonner, NO modales | Feedback CRUD más limpio y no intrusivo | ✅ v1.1 |
| Loading states: separar isFetching de isMutating | Evitar skeletons durante operaciones CRUD | ✅ v1.1 |
| Skeleton loading: solo en initial fetch | Condición `isLoading && data.length === 0` | ✅ v1.1 |
| Dynamic imports para librerías pesadas | FullCalendar, ExcelJS, framer-motion diferidos (~1.55MB) | ✅ v1.1 |
| Imágenes comprimidas con sharp | 11.5MB → 39KB (99.7% reducción) | ✅ v1.1 |
| NotificationPanel: named export | Convención del proyecto para componentes UI | ✅ v1.1 |
| Dark mode: paleta zinc-950 exclusivamente | Consistencia visual, no gray-* ni hex sin dark: | ✅ v1.1 |
| Toast notifications: sonner, NO modales | Feedback CRUD más limpio y no intrusivo | ✅ v1.1 |
| Loading states: separar isFetching de isMutating | Evitar skeletons durante operaciones CRUD | ✅ v1.1 |
| Skeleton loading: solo en initial fetch | Condición `isLoading && data.length === 0` | ✅ v1.1 |
| Dynamic imports para librerías pesadas | FullCalendar, ExcelJS, framer-motion diferidos (~1.55MB) | ✅ v1.1 |
| Imágenes comprimidas con sharp | 11.5MB → 39KB (99.7% reducción) | ✅ v1.1 |
| NotificationPanel: named export | Convención del proyecto para componentes UI | ✅ v1.1 |

## Out of Scope

- Multitenancy / múltiples empresas — requiere rediseño del schema
- App móvil — fuera del alcance actual
- Integración directa con CCSS API — no hay API pública disponible
- Migración a microservicios — monolito es correcto para el tamaño actual
- Eliminar empleados permanentemente — solo desactivar (status: inactivo)

---
## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 — v1.1 milestone complete*
