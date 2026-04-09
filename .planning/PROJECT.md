# VP-Planilla

## What This Is

Sistema de planilla (nómina) para Costa Rica. Maneja el ciclo completo: empleados, períodos de planilla, cálculo de horas y horas extra según ley laboral costarricense, deducciones CCSS, generación de reportes oficiales y envío por email.

## Core Value

Calcular y generar planillas correctas conforme a la ley laboral costarricense, con datos seguros y auditables.

## Current State (v1.3 — 2026-04-09)

**v1.3 SHIPPED** — Sistema de Marcas de Reloj Robusto:
- ✅ Normalizacion de tipos de marcas (IN/OUT) y trazabilidad por status/source
- ✅ Sesiones de importacion con vinculo a marcas e historial operativo
- ✅ Motor de deteccion de huerfanas y anomalias con endpoints de consulta/resolucion
- ✅ Correccion manual con auditoria de cambios y rutas protegidas
- ✅ Dashboard de marcas (filtros, badges, sesiones, modal de detalle/correccion)
- ✅ Cierre de fase 23 con estabilizacion del flujo de marcas (confirmado por usuario)

## Context

- **Stack:** Express 5 + TypeScript 5.8 (backend) · Next.js 15 + React 19 (frontend) · Prisma 6 + PostgreSQL · Tailwind 4
- **Arquitectura:** Route → Controller → Service → Prisma (backend) / Page → Hook → Service → http.ts (frontend)
- **Dominio:** Semana laboral lunes–sábado · 8h regulares/día · 1.5× hasta 10h · 2× sobre 10h · descanso semanal 0.5×
- **Repositorio:** brownfield — código existente mejorado en v1.0, UI modernizada en v1.1
- **Tests:** 104 backend tests (8 suites), 0 failures
- **Performance:** ~1.55MB JS diferido, imágenes comprimidas 99.7%, Next.js compress habilitado

## Current Milestone: v1.4 — TBD (Planning)

**Goal:** Definir siguiente iteracion del producto a partir de roadmap v1.4.

**Target features:**
- Normalización de tipos (ENTRADA/SALIDA ↔ IN/OUT → valor canónico único)
- Campos `status` y `source` en `vpg_clock_logs` para trazabilidad
- Tabla de sesiones de importación (`vpg_clock_import_sessions`) con historial
- Cola de huérfanas — marcas sin par procesadas en flujo dedicado
- Motor de detección de anomalías (doble entrada, doble salida, gaps > umbral)
- API de corrección manual con registro de auditoría
- Dashboard UI — visualización de marcas, anomalías y acciones de corrección

**Previous:** v1.3 shipped 2026-04-09 — phases 18-23 completadas.

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
*Last updated: 2026-04-09 after v1.3 milestone completion*
