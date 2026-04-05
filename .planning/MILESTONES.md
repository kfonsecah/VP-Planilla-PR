# Milestones

## v1.2 — Cobertura de Tests y Mejoras UI (Shipped: 2026-04-04)

**Phases completed:** 1 phase (17), 3 plans + 2 quick tasks
**Timeline:** 2026-04-02 → 2026-04-04 (2 días)
**Tests:** 104 → 287 (+183), 17 suites, 0 failures, cobertura 42.49%

**Key accomplishments:**

1. 9 nuevas suites de tests unitarios — VacationService, PayrollTypeService, PositionService, BonusesService, EmployeeDeductions, LaborEventsService, UserService, NotificationService, AuditLogsService
2. payrollUtils.test.ts extendido a 103 casos (97% cobertura) — cubre validateClockLogPairs, getSundaysInPeriod, calculateOvertimeHoursBiweekly y más
3. sessionStorage cache (TTL 5 min) implementado en 8 hooks — elimina re-fetch en navegación
4. Sidebar modernizado — active state verde, chevron animado, dot status, sin viñetas en sub-ítems
5. Fix ESLint y TypeScript: 0 errores de lint, 0 errores de compilación

**Known gaps at close:**

- Cobertura 42.49% (target 60% no alcanzado — NomineeService, PaymentReceiptService, ReportsService pendientes)
- Sistema de marcas de reloj sin validación de anomalías — planificado en v1.3

**Archive:** `.planning/milestones/v1.2-ROADMAP.md`

---

## v1.1 Calidad, UI Moderna y Cobertura de Tests (Shipped: 2026-04-02)

**Phases completed:** 8 phases, 22 plans, 30 tasks
**Timeline:** 2026-03-31 → 2026-04-02 (2 días)
**Tests:** 104 pasando (8 suites backend), 0 failures

**Key accomplishments:**

1. Tests unitarios para EmployeeService, ClockLogService, DeductionService y AuthService (Fases 09-10)
2. Design system dark mode completo — tokens CSS globales, paleta zinc-950, sidebar moderno (Fase 11)
3. UI dark consistente en todas las tablas, formularios y modales del sistema (Fase 12)
4. Integración frontend-backend auditada — 3 payload mismatches corregidos, errores concretos del backend, skeletons y toasts (Fase 13)
5. Servicio de notificaciones completo — backend API + UI en Header + página dedicada + polling 30s (Fase 14)
6. Skeleton loading + error banners con retry en las 18 vistas del sistema (Fase 15)
7. Rendimiento web mejorado — ~1.55MB JS diferido, imágenes comprimidas 11.5MB → 39KB (99.7%) (Fase 16)

**Known gaps at close:**

- TESTS-05: Cobertura de tests en 33% (target 60% no alcanzable sin NomineeService coverage adicional)
- 1 error TypeScript pre-existente en `attendance/page.tsx` (`skipped_count`) — no bloqueante

**Archive:** `.planning/milestones/v1.1-ROADMAP.md`

---

## v1.0 Estabilización y Completitud (Shipped: 2026-03-27)

**Phases completed:** 8 phases, 22 plans
**Timeline:** 2026-03-25 → 2026-03-27 (3 días)
**Tests:** 45 pasando (42 unit + 3 integration), 0 failures

**Key accomplishments:**

1. Migrados 16 servicios al singleton Prisma — eliminados pools de conexión duplicados
2. 13 rutas API desprotegidas aseguradas con JWT AuthMiddleware
3. CORS wildcard restringido + validación Zod en 5 dominios (Employee, Payroll, ClockLog, Deduction, User)
4. Cálculo de planilla optimizado de O(N×5) a O(6) queries con métodos preload
5. Feriados nacionales CR integrados al cálculo de días laborales
6. Rate limiting en login, Helmet headers, revocación de tokens via DB blocklist
7. 45 tests unitarios/integración para NomineeService y PayrollService

**Known gaps at close:**

- REQ 5.3: `prisma db push` en vez de `migrate dev` — user_last_login no reproducible en deploy limpio
- REQ 8.8: Sin tests de integración para POST /api/nominee/payroll (Should, no Must)

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

---
