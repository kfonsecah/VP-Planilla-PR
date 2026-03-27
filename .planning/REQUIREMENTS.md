# Requirements — VP-Planilla

**Milestone:** M1 — Estabilización y Completitud
**Version:** 1.0
**Date:** 2026-03-25

---

## Milestone Goal

Llevar VP-Planilla de "funcional pero frágil" a "estable, seguro y completo". El sistema ya calcula planillas correctamente — este milestone cierra los huecos que hacen el sistema inseguro, incorrecto bajo edge cases, o imposible de mantener.

---

## M1 — Estabilización y Completitud

### P1 · Infraestructura Prisma

**Goal:** Eliminar las 16 instancias separadas de PrismaClient — todas usan el singleton.

| # | Requirement | Priority | Notes |
|---|-------------|----------|-------|
| 1.1 | Todos los archivos en `src/backend/src/service/` importan `prisma` desde `../lib/prisma` | Must | 16 archivos afectados |
| 1.2 | Cero instancias de `new PrismaClient()` en el directorio `/service/` | Must | Verificable con grep |
| 1.3 | `npx tsc --noEmit` pasa sin errores después del cambio | Must | Gate de CI |

---

### P2 · Seguridad de Autenticación

**Goal:** Cerrar los huecos críticos de auth — rutas desprotegidas, JWT hardcodeado, credenciales en logs.

| # | Requirement | Priority | Notes |
|---|-------------|----------|-------|
| 2.1 | `AuthMiddleware.verifyToken` aplicado en las 13 rutas actualmente desprotegidas | Must | Employee, Payroll, ClockLogs, etc. |
| 2.2 | `curl` sin token a `/api/employees` retorna 401 | Must | Test manual verificable |
| 2.3 | Servidor no arranca si `JWT_SECRET` está ausente en `.env` | Must | `process.exit(1)` en startup |
| 2.4 | Login solo acepta credenciales de `req.body` — eliminar fallback `req.query` | Must | AuthController.ts líneas 12–15 |
| 2.5 | 5 archivos temporales eliminados del repo | Should | `parse_tmp.js`, `temp_script.py`, `test_hours.js`, `check_employee.ts`, `query_emp.mjs` |
| 2.6 | `PayrollService.updatePayroll` lanza `new Error(...)` en lugar de `throw undefined` | Must | Líneas 3 y 134 |

---

### P3 · Validación de Inputs y CORS

**Goal:** Ningún `req.body` llega a Prisma sin validación. CORS restringido a orígenes conocidos.

| # | Requirement | Priority | Notes |
|---|-------------|----------|-------|
| 3.1 | CORS configurado con `origin: process.env.ALLOWED_ORIGINS?.split(',')` | Must | `src/backend/src/index.ts` — DONE (03-01) |
| 3.2 | Schemas Zod definidos para los 5 endpoints CRUD más críticos (Employee, Payroll, ClockLog, Deduction, User) | Must | Nuevos archivos en `src/backend/src/schemas/` — DONE (03-01) |
| 3.3 | `req.body` inválido retorna 400 con mensaje descriptivo | Must | Verificable con curl — DONE (03-02) |
| 3.4 | `npx tsc --noEmit` pasa después del cambio | Must | DONE (03-02) |

---

### P4 · Performance del Cálculo de Planilla

**Goal:** `calculatePayrollForPeriod` ejecuta O(1) queries en lugar de O(N) por empleado.

| # | Requirement | Priority | Notes |
|---|-------------|----------|-------|
| 4.1 | `getAllVacations()` llamado UNA vez antes del loop de empleados | Must | `NomineeService.ts` |
| 4.2 | Clock logs del período cargados UNA vez, agrupados por `employee_id` | Must | `NomineeService.ts` |
| 4.3 | Con 50 empleados, planilla genera máximo 5 queries a DB (no 100+) | Must | Verificable con Prisma logging |
| 4.4 | Resultado del cálculo es idéntico antes y después del cambio | Must | Tests de regresión |

---

### P5 · Funcionalidad de Negocio Faltante

**Goal:** Eliminar stubs, rutas incorrectas y funcionalidad prometida pero no implementada.

| # | Requirement | Priority | Notes |
|---|-------------|----------|-------|
| 5.1 | Ruta `POST /api/nominee/calculate` eliminada (estaba deprecated con salario hardcodeado = 1000) | Must | |
| 5.2 | `AuthService.updateLastLogin()` actualiza campo `last_login` en `vpg_users` | Must | Requiere migración Prisma |
| 5.3 | Migración `add_last_login_to_users` aplicada y generada | Must | `npx prisma migrate dev` |
| 5.4 | Audit log escrito en operaciones críticas: crear planilla, eliminar empleado, asignar deducción | Should | `vpg_audit_logs` ya existe |

---

### P6 · Feriados Nacionales Costa Rica

**Goal:** Los días feriados no cuentan como días laborales en el cálculo de planilla.

| # | Requirement | Priority | Notes |
|---|-------------|----------|-------|
| 6.1 | Lista de feriados nacionales CR implementada en `payrollUtils.ts` | Must | Estática, actualizable por año |
| 6.2 | `countWorkingDaysInPeriod()` excluye feriados del conteo | Must | |
| 6.3 | Tests unitarios para períodos que incluyen feriados (1 mayo, 15 setiembre, 25 dic) | Must | |
| 6.4 | `npm test` pasa con los nuevos casos | Must | |

---

### P7 · Rate Limiting, Helmet y Token Revocation

**Goal:** Protección contra fuerza bruta, headers de seguridad, y logout real.

| # | Requirement | Priority | Notes |
|---|-------------|----------|-------|
| 7.1 | `express-rate-limit` instalado y aplicado en `POST /api/login` (máx 10 req / 15 min / IP) | Must | |
| 7.2 | 11° intento de login retorna 429 Too Many Requests | Must | Verificable |
| 7.3 | `helmet()` aplicado globalmente en `src/backend/src/index.ts` | Must | |
| 7.4 | Respuestas incluyen header `X-Frame-Options` y `X-Content-Type-Options` | Must | |
| 7.5 | `POST /api/logout` invalida el token en DB blocklist | Should | Tabla `vpg_refresh_tokens` puede reutilizarse |
| 7.6 | Token usado post-logout retorna 401 | Should | |

---

### P8 · Tests Unitarios NomineeService

**Goal:** El core del negocio tiene cobertura de tests que previene regresiones.

| # | Requirement | Priority | Notes |
|---|-------------|----------|-------|
| 8.1 | Tests para `calculateEmployeePayroll` con empleados mock | Must | Caso normal 8h/día |
| 8.2 | Test: semana completa con horas extra 1.5× (8h < total ≤ 10h) | Must | |
| 8.3 | Test: horas extra 2× (total > 10h) | Must | |
| 8.4 | Test: día de descanso trabajado (compensación 0.5×) | Must | |
| 8.5 | Test: período con feriado nacional → días laborales correctos | Must | |
| 8.6 | Test: empleado con deducción CCSS → totales correctos | Must | |
| 8.7 | `npm test` pasa con 0 failures | Must | |
| 8.8 | Tests de integración básicos para `POST /api/nominee/payroll` | Should | |

---

## Out of Scope for M1

| Item | Reason |
|------|--------|
| Tests E2E con Playwright/Cypress | Requiere infraestructura de testing separada — M2 |
| Tests de frontend | No hay test runner configurado en frontend — M2 |
| Migración de bcrypt v6 → v5 | Riesgo bajo, no crítico para funcionalidad |
| Puppeteer como dependencia de dev | Optimización de deploy, no urgente |
| Multitenancy | Fuera de alcance del proyecto |

---

*Generated: 2026-03-25*
