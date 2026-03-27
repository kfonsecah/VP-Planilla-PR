# Roadmap: VP-Planilla

## Overview

Llevar VP-Planilla de "funcional pero frágil" a estable, seguro y completo. El sistema ya calcula planillas correctamente según la ley laboral costarricense — este milestone cierra los huecos de seguridad, elimina bugs silenciosos, completa funcionalidad faltante y agrega cobertura de tests para el core del negocio.

## Phases

- [x] **Phase 1: Singleton Prisma** - Eliminar las 16 instancias separadas de PrismaClient (completed 2026-03-25)
- [ ] **Phase 2: Seguridad de Autenticación** - Cerrar huecos críticos de auth en rutas, JWT y login
- [x] **Phase 3: Validación de Inputs y CORS** - Validación Zod en controllers, CORS restringido (completed 2026-03-26)
- [ ] **Phase 4: Performance del Cálculo de Planilla** - O(1) queries en calculatePayrollForPeriod
- [ ] **Phase 5: Funcionalidad de Negocio Faltante** - Ruta deprecated, updateLastLogin, audit logs
- [ ] **Phase 6: Feriados Nacionales Costa Rica** - Feriados CR excluidos de días laborales
- [ ] **Phase 7: Rate Limiting, Helmet y Token Revocation** - Anti-brute-force, headers HTTP, logout real
- [ ] **Phase 8: Tests Unitarios NomineeService** - Cobertura de todos los casos de cálculo de planilla

## Phase Details

### Phase 1: Singleton Prisma
**Goal**: Eliminar las 16 instancias separadas de `new PrismaClient()` — todos los servicios usan el singleton de `src/backend/src/lib/prisma.ts`
**Depends on**: Nothing (first phase)
**Requirements**: 1.1, 1.2, 1.3
**Success Criteria** (what must be TRUE):
  1. `grep -r "new PrismaClient()" src/backend/src/service/` retorna 0 resultados
  2. `npx tsc --noEmit` pasa en `src/backend/` sin errores
  3. El singleton `import { prisma } from '../lib/prisma'` está presente en todos los archivos de service
**Plans:** 3/3 plans complete
Plans:
- [x] 01-01-PLAN.md — Migrate AuthService, UserService, EmployeeService, PayrollService, PayrollTypeService
- [x] 01-02-PLAN.md — Migrate AuditLogsService, BonusesService, ClockLogsService, DeductionsService, EmployeeDeductions
- [x] 01-03-PLAN.md — Migrate LaborEventsService, PaymentReceiptService, PositionService, ReportsService, VacationService + full-phase verification

### Phase 2: Seguridad de Autenticación
**Goal**: Cerrar los huecos críticos de auth — 13 rutas desprotegidas, JWT hardcodeado, credenciales en query params, throw undefined en PayrollService, archivos temporales en repo
**Depends on**: Phase 1
**Requirements**: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
**Success Criteria** (what must be TRUE):
  1. `curl` sin token a `/api/employees` retorna 401
  2. Servidor no arranca si `JWT_SECRET` falta en `.env`
  3. Login solo acepta credenciales en `req.body`
  4. `PayrollService.updatePayroll` usa `throw new Error(...)` — no `throw undefined`
  5. 5 archivos temporales eliminados del repositorio
**Plans:** 2 plans
Plans:
- [x] 02-01-PLAN.md — Add AuthMiddleware.verifyToken to all 13 unprotected route files
- [x] 02-02-PLAN.md — JWT startup assertion, login query-param fix, PayrollService throw fix, temp file cleanup

### Phase 3: Validación de Inputs y CORS
**Goal**: Ningún `req.body` llega a Prisma sin validación Zod. CORS restringido a orígenes configurados en `.env`
**Depends on**: Phase 2
**Requirements**: 3.1, 3.2, 3.3, 3.4
**Success Criteria** (what must be TRUE):
  1. CORS configurado con `origin: process.env.ALLOWED_ORIGINS?.split(',')`
  2. `req.body` inválido a endpoint Employee/Payroll retorna 400 con mensaje descriptivo
  3. Schemas Zod existen para Employee, Payroll, ClockLog, Deduction, User
  4. `npx tsc --noEmit` pasa
**Plans:** 2/2 plans complete
Plans:
- [x] 03-01-PLAN.md — CORS fix, install Zod, create validateBody middleware, define all 5 domain schemas
- [x] 03-02-PLAN.md — Wire validateBody middleware into all 5 route files

### Phase 4: Performance del Cálculo de Planilla
**Goal**: `calculatePayrollForPeriod` ejecuta O(1) queries en lugar de O(N) por empleado — vacaciones y clock logs pre-cargados fuera del loop
**Depends on**: Phase 1
**Requirements**: 4.1, 4.2, 4.3, 4.4
**Success Criteria** (what must be TRUE):
  1. `getAllVacations()` llamado una sola vez antes del loop de empleados
  2. Clock logs del período cargados una vez y agrupados por `employee_id`
  3. Con 50 empleados, planilla genera máximo 5 queries a DB
  4. Resultados de cálculo idénticos antes y después del cambio
**Plans**: TBD

### Phase 5: Funcionalidad de Negocio Faltante
**Goal**: Eliminar ruta deprecated con salario hardcodeado, implementar `updateLastLogin` en DB con migración, escribir audit logs en operaciones críticas
**Depends on**: Phase 2
**Requirements**: 5.1, 5.2, 5.3, 5.4
**Success Criteria** (what must be TRUE):
  1. `POST /api/nominee/calculate` ya no existe (404)
  2. `vpg_users.last_login` se actualiza en cada login exitoso
  3. Migración `add_last_login_to_users` aplicada y generada
  4. `vpg_audit_logs` recibe entradas para create payroll, delete employee y assign deduction
**Plans**: TBD

### Phase 6: Feriados Nacionales Costa Rica
**Goal**: Los días feriados nacionales de Costa Rica no cuentan como días laborales en el cálculo de planilla — `countWorkingDaysInPeriod()` excluye feriados
**Depends on**: Phase 4
**Requirements**: 6.1, 6.2, 6.3, 6.4
**Success Criteria** (what must be TRUE):
  1. Lista de feriados CR en `payrollUtils.ts` (estática, actualizable por año)
  2. Un período del 1–15 mayo no cuenta el 1° de mayo como día laboral
  3. Tests unitarios para períodos que incluyen 1 mayo, 15 setiembre y 25 diciembre
  4. `npm test` pasa con 0 failures
**Plans**: TBD

### Phase 7: Rate Limiting, Helmet y Token Revocation
**Goal**: Protección anti-fuerza bruta en login, headers de seguridad HTTP con helmet, y logout real que invalida tokens en DB
**Depends on**: Phase 2
**Requirements**: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
**Success Criteria** (what must be TRUE):
  1. El 11° intento de login desde la misma IP en 15 min retorna 429
  2. Respuestas incluyen header `X-Frame-Options` y `X-Content-Type-Options`
  3. Token usado después de logout retorna 401
  4. `npx tsc --noEmit` pasa
**Plans**: TBD

### Phase 8: Tests Unitarios NomineeService
**Goal**: `NomineeService.calculatePayrollForPeriod` tiene cobertura de tests para todos los casos de cálculo — regular, overtime 1.5×, overtime 2×, descanso trabajado, feriado, CCSS
**Depends on**: Phase 4, Phase 6
**Requirements**: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
**Success Criteria** (what must be TRUE):
  1. Tests cubren cálculo regular 8h/día
  2. Tests cubren overtime 1.5× (8h < total ≤ 10h) y 2× (total > 10h)
  3. Tests cubren día de descanso trabajado (compensación 0.5×)
  4. Tests cubren período con feriado nacional
  5. Tests cubren deducciones CCSS con totales correctos
  6. `npm test` pasa con 0 failures
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Singleton Prisma | 3/3 | Complete   | 2026-03-25 |
| 2. Seguridad de Autenticación | 0/2 | Planned | - |
| 3. Validación de Inputs y CORS | 2/2 | Complete   | 2026-03-26 |
| 4. Performance del Cálculo de Planilla | 0/TBD | Not started | - |
| 5. Funcionalidad de Negocio Faltante | 0/TBD | Not started | - |
| 6. Feriados Nacionales Costa Rica | 0/TBD | Not started | - |
| 7. Rate Limiting, Helmet y Token Revocation | 0/TBD | Not started | - |
| 8. Tests Unitarios NomineeService | 0/TBD | Not started | - |
