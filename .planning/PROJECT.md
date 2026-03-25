# VP-Planilla

## What This Is

Sistema de planilla (nómina) para Costa Rica. Maneja el ciclo completo: empleados, períodos de planilla, cálculo de horas y horas extra según ley laboral costarricense, deducciones CCSS, generación de reportes oficiales y envío por email.

**Estado actual:** Sistema funcional con arquitectura correcta, pero con deuda técnica acumulada que compromete seguridad, estabilidad bajo carga y correctness de los cálculos.

**Objetivo de este milestone:** Estabilizar el sistema — resolver problemas de seguridad críticos, eliminar bugs silenciosos, completar funcionalidad faltante y agregar cobertura de tests para el core del negocio.

## Core Value

Calcular y generar planillas correctas conforme a la ley laboral costarricense, con datos seguros y auditables.

## Context

- **Stack:** Express 5 + TypeScript 5.8 (backend) · Next.js 15 + React 19 (frontend) · Prisma 6 + PostgreSQL · Tailwind 4
- **Arquitectura:** Route → Controller → Service → Prisma (backend) / Page → Hook → Service → http.ts (frontend)
- **Dominio:** Semana laboral lunes–sábado · 8h regulares/día · 1.5× hasta 10h · 2× sobre 10h · descanso semanal 0.5×
- **Codebase map:** `.planning/codebase/` — análisis completo al 2026-03-25
- **Repositorio:** brownfield — código existente y funcional

## Requirements

### Validated

- ✓ CRUD completo de empleados — existing
- ✓ Gestión de períodos de planilla — existing
- ✓ Cálculo de horas y horas extra (payrollUtils.ts) — existing
- ✓ Deducciones CCSS y personalizadas — existing
- ✓ Clock logs desde hardware de asistencia (Java parser) — existing
- ✓ Generación de reportes PDF (Puppeteer + pdf-lib) — existing
- ✓ Envío de reportes por email (nodemailer) — existing
- ✓ Autenticación JWT con refresh tokens — existing
- ✓ Gestión de usuarios y permisos por rol — existing
- ✓ Calendario de eventos laborales (FullCalendar) — existing
- ✓ Dashboard con estadísticas de planilla — existing
- ✓ Vacaciones y ausencias — existing
- ✓ Bonificaciones y deducciones por empleado — existing

### Active

- [ ] Singleton Prisma en todos los servicios (actualmente 16 instancias separadas)
- [ ] AuthMiddleware aplicado en las 13 rutas desprotegidas
- [ ] JWT_SECRET assertion al startup (sin fallback hardcodeado)
- [ ] PayrollService.updatePayroll lanza Error real (no throw undefined)
- [ ] Archivos temporales eliminados del repo
- [ ] Performance: queries de vacaciones y clock logs fuera del loop de empleados
- [ ] Validación de inputs en controllers (Zod)
- [ ] CORS con origen específico
- [ ] Remover credenciales de query params en login
- [ ] Ruta deprecated /api/nominee/calculate eliminada
- [ ] updateLastLogin implementado en DB (migración)
- [ ] Feriados nacionales de CR en cálculo de días laborales
- [ ] Audit log para operaciones críticas (create payroll, delete employee, etc.)
- [ ] Rate limiting en endpoint de login
- [ ] helmet en middleware stack
- [ ] Token revocation al hacer logout
- [ ] Tests unitarios para NomineeService.calculatePayrollForPeriod
- [ ] Tests de integración para endpoints críticos

### Out of Scope

- Multitenancy / múltiples empresas — requiere rediseño del schema
- App móvil — fuera del alcance actual
- Integración directa con CCSS API — no hay API pública disponible
- Migración a microservicios — la arquitectura monolítica es correcta para el tamaño actual

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Singleton Prisma via lib/prisma.ts | Ya existe el singleton, solo hay que usarlo consistentemente | Pendiente — Phase 1 |
| AuthMiddleware global vs por ruta | Por ruta permite más control; global requiere allowlist | Por ruta — menos cambios coordinados |
| Zod validation en backend | Frontend ya usa Zod — reutilizar patrones familiares | Pendiente — Phase 3 |
| Feriados CR como lista estática | No hay API pública confiable; lista anual es suficiente | Pendiente — Phase 6 |
| Token revocation con DB blocklist | Redis no está en el stack; DB blocklist es suficiente para el volumen | Pendiente — Phase 7 |

## Evolution

Este documento evoluciona en cada transición de fase y milestone.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after initialization*
