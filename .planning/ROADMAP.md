# Roadmap: VP-Planilla

## Milestones

- ✅ **v1.0 — Estabilización y Completitud** (2026-03-25 → 2026-03-27) — 8 fases, 45 tests, seguridad + performance + feriados CR — [ver detalle](.planning/milestones/v1.0-ROADMAP.md)
- 🚧 **v1.1 — Calidad, UI Moderna y Cobertura de Tests** — Phases 9-13 (in progress)

---

## Phases

<details>
<summary>✅ v1.0 — Estabilización y Completitud (Phases 1-8) — SHIPPED 2026-03-27</summary>

Phases 1-8 archived in `.planning/milestones/v1.0-ROADMAP.md`.

</details>

### 🚧 v1.1 — Calidad, UI Moderna y Cobertura de Tests (In Progress)

**Milestone Goal:** Elevar la calidad del sistema en tres frentes: cobertura de tests ~60%, rediseño visual dark mode moderno consistente en todo el frontend, y validación de la integración frontend-backend.

- [ ] **Phase 9: Tests — EmployeeService y ClockLogService** - Tests unitarios para los módulos de empleados y registros de reloj
- [ ] **Phase 10: Tests — DeductionService, AuthService y cobertura 60%** - Completar cobertura de tests en servicios críticos hasta umbral mínimo
- [ ] **Phase 11: Design System Dark Mode** - Tokens CSS globales, sidebar dark moderno y navegación cohesiva
- [ ] **Phase 12: Tablas, Formularios y Modales** - UI dark consistente en todos los módulos de datos y flujos críticos
- [ ] **Phase 13: Integración Frontend-Backend** - Contratos de API verificados, manejo de errores real y estados de carga

## Phase Details

### Phase 9: Tests — EmployeeService y ClockLogService
**Goal**: Developers pueden ejecutar una suite de tests unitarios confiable para los módulos de empleados y registros de reloj
**Depends on**: Phase 8 (v1.0)
**Requirements**: TESTS-01, TESTS-02
**Success Criteria** (what must be TRUE):
  1. `npm test` ejecuta tests de EmployeeService cubriendo crear, listar, obtener por ID, actualizar y desactivar empleados — todos pasan
  2. `npm test` ejecuta tests de ClockLogService cubriendo registrar entrada, registrar salida y listar logs por empleado — todos pasan
  3. Los mocks de Prisma en ambas suites aíslan correctamente la lógica de servicio de la base de datos
**Plans**: TBD

### Phase 10: Tests — DeductionService, AuthService y cobertura 60%
**Goal**: Developers alcanzan el umbral mínimo de 60% de cobertura en módulos de servicio con tests para deducciones y autenticación
**Depends on**: Phase 9
**Requirements**: TESTS-03, TESTS-04, TESTS-05
**Success Criteria** (what must be TRUE):
  1. `npm test` ejecuta tests de DeductionService cubriendo asignar deducción a empleado y calcular montos — todos pasan
  2. `npm test` ejecuta tests de AuthService cubriendo login, logout y validación de token — todos pasan
  3. `jest --coverage` reporta ≥60% en statements/branches combinados para todos los módulos de servicio
  4. El reporte de cobertura no muestra regresiones en los módulos ya cubiertos (NomineeService, PayrollService)
**Plans**: TBD

### Phase 11: Design System Dark Mode
**Goal**: El sistema visual del frontend tiene identidad dark mode cohesiva aplicada globalmente mediante tokens CSS centralizados
**Depends on**: Phase 8 (v1.0)
**Requirements**: UI-01, UI-02
**Success Criteria** (what must be TRUE):
  1. Un usuario que navega entre cualquier vista del sistema ve la misma paleta de colores, tipografía y espaciado — ninguna pantalla "rompe" el look
  2. Los tokens CSS globales (colores, radii, sombras, tipografía) existen en un solo lugar y son consumidos por todos los componentes
  3. El sidebar muestra estado activo del ítem de navegación actual, colapsa correctamente en mobile y tiene estilo dark consistente con el resto del sistema
  4. `npx next lint` y `npx tsc --noEmit` pasan sin errores nuevos en el frontend
**Plans**: TBD
**UI hint**: yes

### Phase 12: Tablas, Formularios y Modales
**Goal**: Todos los módulos de datos tienen UI dark uniforme y los flujos destructivos/críticos requieren confirmación explícita del usuario
**Depends on**: Phase 11
**Requirements**: UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Un usuario que revisa tablas en cualquier módulo (empleados, planilla, deducciones, logs) ve el mismo estilo dark con hover, estados vacíos y paginación — sin tablas de "sistema diferente"
  2. Un usuario que completa un formulario ve inputs dark con feedback visual de validación y mensajes de error visibles cuando los campos son inválidos
  3. Un usuario que intenta desactivar un empleado, eliminar un registro, o cerrar sesión ve un modal de confirmación antes de que la acción se ejecute
  4. `npx next lint` y `npx tsc --noEmit` pasan sin errores nuevos en el frontend
**Plans**: TBD
**UI hint**: yes

### Phase 13: Integración Frontend-Backend
**Goal**: La conexión entre frontend y backend está auditada y el usuario recibe feedback real y accionable en todo momento
**Depends on**: Phase 12
**Requirements**: INTEG-01, INTEG-02, INTEG-03
**Success Criteria** (what must be TRUE):
  1. Existe un audit doc o checklist que confirma que los campos enviados por cada formulario del frontend coinciden exactamente con los schemas Zod del backend — sin mismatches documentados
  2. Un usuario que provoca un error del backend (ej. duplicado, campo inválido) ve el mensaje de error específico del servidor, no un mensaje genérico "algo salió mal"
  3. Todos los hooks de datos del frontend muestran un spinner o skeleton mientras cargan y un mensaje de error descriptivo si la petición falla — ninguna vista queda en blanco indefinidamente
  4. `npx tsc --noEmit` pasa en backend y frontend sin errores nuevos
**Plans**: TBD

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-8. v1.0 | v1.0 | 22/22 | Complete | 2026-03-27 |
| 9. Tests — EmployeeService y ClockLogService | v1.1 | 0/? | Not started | - |
| 10. Tests — DeductionService, AuthService y cobertura 60% | v1.1 | 0/? | Not started | - |
| 11. Design System Dark Mode | v1.1 | 0/? | Not started | - |
| 12. Tablas, Formularios y Modales | v1.1 | 0/? | Not started | - |
| 13. Integración Frontend-Backend | v1.1 | 0/? | Not started | - |

---

*Updated: 2026-03-31 — v1.1 roadmap created*
