# Roadmap: VP-Planilla

## Milestones

- ✅ **v1.0 — Estabilización y Completitud** (2026-03-25 → 2026-03-27) — 8 fases, 45 tests, seguridad + performance + feriados CR — [ver detalle](.planning/milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 — Calidad, UI Moderna y Cobertura de Tests** — Phases 9-14 (in progress)

---

## Phases

<details>
<summary>✅ v1.0 — Estabilización y Completitud (Phases 1-8) — SHIPPED 2026-03-27</summary>

Phases 1-8 archived in `.planning/milestones/v1.0-ROADMAP.md`.

</details>

### 🚧 v1.1 — Calidad, UI Moderna y Cobertura de Tests (In Progress)

**Milestone Goal:** Elevar la calidad del sistema en tres frentes: cobertura de tests ~60%, rediseño visual dark mode moderno consistente en todo el frontend, y validación de la integración frontend-backend.

- [x] **Phase 9: Tests — EmployeeService y ClockLogService** - Tests unitarios para los módulos de empleados y registros de reloj
- [x] **Phase 10: Tests — DeductionService, AuthService y cobertura 60%** - Completar cobertura de tests en servicios críticos hasta umbral mínimo
- [x] **Phase 11: Design System Dark Mode** - Tokens CSS globales, sidebar dark moderno y navegación cohesiva
- [x] **Phase 12: Tablas, Formularios y Modales** - UI dark consistente en todos los módulos de datos y flujos críticos
- [ ] **Phase 13: Integración Frontend-Backend** - Contratos de API verificados, manejo de errores real y estados de carga
- [x] **Phase 14: Servicio de Notificaciones** - Implementar el servicio de notificaciones aún no desarrollado (completed 2026-04-01)

## Phase Details

### Phase 9: Tests — EmployeeService y ClockLogService ✅ VALIDATED
**Goal**: Developers pueden ejecutar una suite de tests unitarios confiable para los módulos de empleados y registros de reloj
**Depends on**: Phase 8 (v1.0)
**Requirements**: TESTS-01, TESTS-02
**Success Criteria** (what must be TRUE):
  1. `npm test` ejecuta tests de EmployeeService cubriendo crear, listar, obtener por ID, actualizar y desactivar empleados — todos pasan
  2. `npm test` ejecuta tests de ClockLogService cubriendo registrar entrada, registrar salida y listar logs por empleado — todos pasan
  3. Los mocks de Prisma en ambas suites aíslan correctamente la lógica de servicio de la base de datos
**Plans**: [09-PLAN.md](.planning/phases/09-tests-employee-clocklog/09-PLAN.md) | [09-SUMMARY.md](.planning/phases/09-tests-employee-clocklog/09-SUMMARY.md)
**Tests**: 73 total (17 EmployeeService + 9 ClockLogsService + 45 existing + 2 fixed NomineeService)

### Phase 10: Tests — DeductionService, AuthService y cobertura 60% ✅ TESTS-03/04 COMPLETE
**Goal**: Developers alcanzan el umbral mínimo de 60% de cobertura en módulos de servicio con tests para deducciones y autenticación
**Depends on**: Phase 9
**Requirements**: TESTS-03, TESTS-04, TESTS-05
**Success Criteria** (what must be TRUE):
  1. `npm test` ejecuta tests de DeductionService cubriendo asignar deducción a empleado y calcular montos — todos pasan
  2. `npm test` ejecuta tests de AuthService cubriendo login, logout y validación de token — todos pasan
  3. `jest --coverage` reporta ≥60% en statements/branches combinados para todos los módulos de servicio
  4. El reporte de cobertura no muestra regresiones en los módulos ya cubiertos (NomineeService, PayrollService)
**Plans**: [10-PLAN.md](.planning/phases/10-tests-deduction-auth-coverage/10-PLAN.md) | [10-SUMMARY.md](.planning/phases/10-tests-deduction-auth-coverage/10-SUMMARY.md)
**Tests**: 104 total (11 DeductionsService + 17 AuthService + 73 previous + 3 fixed)
**Note**: TESTS-03/04 complete. TESTS-05 at 33% — target 60% no alcanzable sin NomineeService coverage adicional.

### Phase 11: Design System Dark Mode ✅ COMPLETE
**Goal**: El sistema visual del frontend tiene identidad dark mode cohesiva aplicada globalmente mediante tokens CSS centralizados
**Depends on**: Phase 8 (v1.0)
**Requirements**: UI-01, UI-02
**Success Criteria** (what must be TRUE):
  1. Un usuario que navega entre cualquier vista del sistema ve la misma paleta de colores, tipografía y espaciado — ninguna pantalla "rompe" el look
  2. Los tokens CSS globales (colores, radii, sombras, tipografía) existen en un solo lugar y son consumidos por todos los componentes
  3. El sidebar muestra estado activo del ítem de navegación actual, colapsa correctamente en mobile y tiene estilo dark consistente con el resto del sistema
  4. `npx next lint` y `npx tsc --noEmit` pasan sin errores nuevos en el frontend
**Plans**: [11-PLAN.md](.planning/phases/11-design-system-dark-mode/11-PLAN.md) | [11-SUMMARY.md](.planning/phases/11-design-system-dark-mode/11-SUMMARY.md)

### Phase 12: Tablas, Formularios y Modales ✅ COMPLETE
**Goal**: Todos los módulos de datos tienen UI dark uniforme y los flujos destructivos/críticos requieren confirmación explícita del usuario
**Depends on**: Phase 11
**Requirements**: UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Un usuario que revisa tablas en cualquier módulo (empleados, planilla, deducciones, logs) ve el mismo estilo dark con hover, estados vacíos y paginación — sin tablas de "sistema diferente"
  2. Un usuario que completa un formulario ve inputs dark con feedback visual de validación y mensajes de error visibles cuando los campos son inválidos
  3. Un usuario que intenta desactivar un empleado, eliminar un registro, o cerrar sesión ve un modal de confirmación antes de que la acción se ejecute
  4. `npx next lint` y `npx tsc --noEmit` pasan sin errores nuevos en el frontend
**Plans**: [12-PLAN.md](.planning/phases/12-tablas-formularios-modales/12-PLAN.md) | [12-SUMMARY.md](.planning/phases/12-tablas-formularios-modales/12-SUMMARY.md)

### Phase 13: Integración Frontend-Backend
**Goal**: La conexión entre frontend y backend está auditada y el usuario recibe feedback real y accionable en todo momento
**Depends on**: Phase 12
**Requirements**: INTEG-01, INTEG-02, INTEG-03
**Success Criteria** (what must be TRUE):
  1. Existe un audit doc o checklist que confirma que los campos enviados por cada formulario del frontend coinciden exactamente con los schemas Zod del backend — sin mismatches documentados
  2. Un usuario que provoca un error del backend (ej. duplicado, campo inválido) ve el mensaje de error específico del servidor, no un mensaje genérico "algo salió mal"
  3. Todos los hooks de datos del frontend muestran un spinner o skeleton mientras cargan y un mensaje de error descriptivo si la petición falla — ninguna vista queda en blanco indefinidamente
  4. `npx tsc --noEmit` pasa en backend y frontend sin errores nuevos
**Plans**: 6 plans (3 original + 3 gap closure)
Plans:
- [x] 13-01-PLAN.md — Audit frontend service payloads against backend Zod schemas, fix mismatches
- [x] 13-02-PLAN.md — Enhance error message propagation from backend to frontend
- [x] 13-03-PLAN.md — Wire loading/error states to all data pages with Table skeletons
- [ ] 13-04-PLAN.md — Replace modal notifications with sonner toasts across 4 page files
- [ ] 13-05-PLAN.md — Separate isFetching/isMutating state, fix error state detection
- [ ] 13-06-PLAN.md — Fix labor_event_ids → labor_event_id field name mismatch (blocker)

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-8. v1.0 | v1.0 | 22/22 | Complete | 2026-03-27 |
| 9. Tests — EmployeeService y ClockLogService | v1.1 | 2/2 | ✅ Complete | 2026-03-31 |
| 10. Tests — DeductionService, AuthService y cobertura 60% | v1.1 | 2/3 | ⚠️ Partial | 2026-03-31 |
| 11. Design System Dark Mode | v1.1 | 2/2 | ✅ Complete | 2026-03-31 |
| 12. Tablas, Formularios y Modales | v1.1 | 3/3 | ✅ Complete | 2026-04-01 |
| 13. Integración Frontend-Backend | v1.1 | 0/? | Not started | - |
| 14. Servicio de Notificaciones | v1.1 | 2/2 | Complete    | 2026-04-02 |
| 14. Servicio de Notificaciones | v1.1 | 2/2 | Complete    | 2026-04-02 |
| 15. UI Polish - Skeletons y Error Banners | v1.1 | 4/4 | Complete   | 2026-04-02 |

### Phase 14: Servicio de Notificaciones
**Goal**: El sistema cuenta con un servicio de notificaciones funcional que informa a los usuarios sobre eventos relevantes del sistema (planillas generadas, pagos procesados, etc.)
**Depends on**: Phase 13
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04
**Success Criteria** (what must be TRUE):
  1. Existe un servicio backend de notificaciones con creación, listado, marcado como leído y eliminación
  2. El frontend muestra notificaciones reales en el Header con badge de conteo y panel desplegable
  3. Existe una página /pages/notifications con historial completo paginado
  4. Polling automático actualiza el conteo de no leídas cada 30 segundos
  5. `npx tsc --noEmit` pasa en backend y frontend sin errores nuevos
**Plans**: 2 plans
Plans:
- [x] 14-01-PLAN.md — Backend: modelo Prisma, servicio, controller y rutas API protegidas
- [x] 14-02-PLAN.md — Frontend: types, service, hook, NotificationPanel, Header actualizado y página /notifications

### Phase 15: UI Polish - Skeletons y Error Banners en todas las vistas

**Goal:** Todas las vistas del sistema muestran estados de carga (skeletons) y banners de error con reintento consistentes — ninguna vista queda en blanco indefinidamente
**Requirements**: UI-POLISH-01, UI-POLISH-02, UI-POLISH-03
**Depends on:** Phase 14
**Plans:** 4/4 plans complete

Plans:
- [x] 15-01-PLAN.md — Skeleton loading + error banners en 6 list pages (deductions, vacations, branches, payroll-types, events, users)
- [x] 15-02-PLAN.md — Skeleton loading + error banners en 12 complex pages (payroll, attendance, audit-logs, employee edit, notifications)
- [x] 15-03-PLAN.md — Fix error banner bugs: employee-deductions wrong condition + notifications duplicate banner
- [x] 15-04-PLAN.md — Add missing error banners to payroll detail, attendance, clocklogs, reports pages

### Phase 16: Mejorar rendimiento web — reducir LCP de 5.86s a <2.5s y mejorar CLS

**Goal:** [To be planned]
**Requirements**: TBD
**Depends on:** Phase 15
**Plans:** 0 plans

Plans:
- [ ] TBD (run /gsd:plan-phase 16 to break down)



---

*Updated: 2026-03-31 — v1.1 roadmap created*
