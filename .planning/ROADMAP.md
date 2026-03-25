# Roadmap — VP-Planilla

**Current Milestone:** M1 — Estabilización y Completitud
**Status:** In Progress
**Started:** 2026-03-25

---

## M1 — Estabilización y Completitud

> Llevar VP-Planilla de "funcional pero frágil" a estable, seguro y completo.
> Requisito previo para cualquier feature nuevo.

---

### Phase 1 · Singleton Prisma
**Goal:** Eliminar las 16 instancias separadas de `new PrismaClient()` — todos los servicios usan el singleton de `lib/prisma.ts`.

**Why first:** Fundación de infraestructura. Todo trabajo posterior sobre servicios parte de un estado limpio. Riesgo de pool exhaustion en producción.

**Key outcomes:**
- 0 instancias de `new PrismaClient()` en `/service/`
- `npx tsc --noEmit` pasa
- Sin cambios de comportamiento observable

**Estimated effort:** 2–3 horas

---

### Phase 2 · Seguridad de Autenticación
**Goal:** Cerrar los huecos críticos de auth — 13 rutas desprotegidas, JWT hardcodeado, credenciales en logs, throw undefined en PayrollService.

**Why second:** Los huecos de auth hacen el sistema inseguro para cualquier deploy real. Agrupa todos los cambios de seguridad de 1 sola capa.

**Key outcomes:**
- 13 rutas responden 401 sin token
- Servidor no arranca sin `JWT_SECRET` en `.env`
- Login solo acepta credenciales en `req.body`
- `throw new Error()` en PayrollService
- 5 archivos temporales eliminados del repo

**Estimated effort:** 3–4 horas

---

### Phase 3 · Validación de Inputs y CORS
**Goal:** Validación Zod en controllers, CORS restringido. Ningún `req.body` llega a Prisma sin validar.

**Key outcomes:**
- CORS con `ALLOWED_ORIGINS` del `.env`
- 5 schemas Zod para endpoints CRUD críticos
- `req.body` inválido → 400 con detalle
- `npx tsc --noEmit` pasa

**Estimated effort:** 1 día

---

### Phase 4 · Performance del Cálculo de Planilla
**Goal:** `calculatePayrollForPeriod` ejecuta O(1) queries en lugar de O(N). Con 50 empleados = máximo 5 queries en lugar de 100+.

**Key outcomes:**
- Vacaciones y clock logs pre-cargados fuera del loop
- Mismos resultados de cálculo
- Tests de regresión pasan

**Estimated effort:** 4–5 horas

---

### Phase 5 · Funcionalidad de Negocio Faltante
**Goal:** Eliminar la ruta deprecated, implementar `updateLastLogin` en DB, agregar audit logs en operaciones críticas.

**Key outcomes:**
- `POST /api/nominee/calculate` eliminado
- `vpg_users.last_login` actualizado en cada login (migración aplicada)
- `vpg_audit_logs` recibe entradas de create/delete/assign

**Estimated effort:** 4–5 horas

---

### Phase 6 · Feriados Nacionales Costa Rica
**Goal:** Los días feriados nacionales de Costa Rica no cuentan como días laborales en el cálculo de planilla.

**Key outcomes:**
- Lista de feriados CR en `payrollUtils.ts`
- `countWorkingDaysInPeriod()` excluye feriados
- Tests unitarios para períodos con feriados
- `npm test` pasa

**Estimated effort:** 1 día

---

### Phase 7 · Rate Limiting, Helmet y Token Revocation
**Goal:** Protección anti-fuerza bruta en login, headers de seguridad HTTP, logout real que invalida tokens.

**Key outcomes:**
- `express-rate-limit` en login (10/15min/IP)
- `helmet()` global
- DB blocklist para tokens revocados
- Token post-logout → 401

**Estimated effort:** 4–5 horas

---

### Phase 8 · Tests Unitarios NomineeService
**Goal:** El core del negocio tiene cobertura de tests que previene regresiones silenciosas en cálculos de planilla.

**Key outcomes:**
- Tests para todos los casos de cálculo: regular, OT 1.5×, OT 2×, descanso trabajado, feriado, CCSS
- Tests de integración para endpoints críticos
- `npm test` con 0 failures

**Estimated effort:** 1 día

---

## Milestone Completion Criteria

- [ ] Todas las 8 fases completadas y verificadas
- [ ] `npx tsc --noEmit` pasa en backend y frontend
- [ ] `npm test` pasa con 0 failures
- [ ] Cero instancias de `new PrismaClient()` en services
- [ ] Cero rutas sin `AuthMiddleware`
- [ ] Endpoints críticos tienen validación de inputs
- [ ] `calculatePayrollForPeriod` hace O(1) queries
- [ ] NomineeService tiene cobertura de tests para todos los casos de cálculo

---

## Future Milestones (Parking Lot)

### M2 — Cobertura de Tests Frontend
- Test runner configurado en frontend (Vitest)
- Tests para schemas Zod, hooks, servicios
- Tests E2E con Playwright para flujos críticos

### M3 — Optimizaciones de Deploy
- `@prisma/client` movido a `dependencies`
- `puppeteer` en servicio separado o worker
- `bcrypt` downgrade de v6 a v5 estable
- CORS con configuración por ambiente

---

*Last updated: 2026-03-25*
