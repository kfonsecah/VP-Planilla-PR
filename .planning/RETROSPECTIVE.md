# Retrospective — VP-Planilla

---

## Milestone: v1.3 — Sistema de Marcas de Reloj Robusto

**Shipped:** 2026-04-09
**Phases:** 6 | **Plans:** 14 | **Timeline:** 4 dias

### What Was Built

1. Normalizacion de marcas a tipo canonico IN/OUT con trazabilidad por status/source
2. Sesiones de importacion vinculadas a cada marca y expuestas via endpoints
3. Deteccion automatica de huerfanas/anomalias con resolucion operativa
4. Correccion manual con registro de auditoria en backend
5. Dashboard UI de marcas con filtros, badges, sesiones y modal de detalle
6. Estabilizacion integral del flujo de marcas (fase 23) confirmada por usuario

### What Worked

- Ejecucion por fases con planes concretos permitio cerrar un dominio complejo (clock logs)
- Flujo de research -> plan -> execute mantuvo trazabilidad de decisiones
- Enfoque en backend + frontend en olas redujo riesgo de regresion por capas

### What Was Inefficient

- Inconsistencias de estado entre ROADMAP y STATE durante el cierre
- Ruido operativo por muchos cambios locales no relacionados antes de limpieza
- Algunos artefactos de requirements/traceability quedaron desactualizados respecto al estado real

### Patterns Established

- Parsing de fechas de consulta debe tratarse en hora local para evitar errores de rango
- Las fases de estabilizacion requieren UAT explicita antes de declarar cierre
- Mantener checkpoints de limpieza de workspace antes de cerrar milestone

### Key Lessons

- Cerrar milestone solo despues de alinear roadmap, state y uat
- Priorizar limpieza de working tree para evitar falsos positivos de progreso
- Consolidar artefactos de milestone inmediatamente tras confirmacion de usuario

### Cost Observations

- Milestone centrado en robustez del modulo de marcas (alto impacto funcional)
- Trabajo incremental en 6 fases con 14 planes dentro de 4 dias

---

## Milestone: v1.0 — Estabilización y Completitud

**Shipped:** 2026-03-27
**Phases:** 8 | **Plans:** 22 | **Timeline:** 3 días

### What Was Built

1. Singleton Prisma en todos los servicios — eliminados 16 `new PrismaClient()` duplicados
2. AuthMiddleware aplicado a todas las rutas — 13 rutas antes desprotegidas
3. Validación Zod + CORS restringido en backend
4. Cálculo de planilla O(6) queries — preload de todos los datos antes del loop de empleados
5. Feriados nacionales CR en cálculo de días laborales
6. Rate limiting (login), Helmet, token revocation via DB blocklist
7. 45 tests (42 unit + 3 integration) para NomineeService y PayrollService

### What Worked

- **GSD con subagentes paralelos** aceleró las fases de ejecución considerablemente
- **Claude + OpenCode como alternativa** cuando el contexto estaba alto — `pause-work` / `resume-work` funcionó bien
- **Phases pequeñas y atómicas** (1-3 planes cada una) permitieron avanzar sin perder el hilo
- **Audit milestone antes de cerrar** detectó REQ 5.3 y REQ 8.8 — buena práctica

### What Was Inefficient

- SUMMARY.md sin campo `one_liner` estructurado — gsd-tools no pudo extraer accomplishments automáticamente
- Phase 06 tiene un `PLAN.md` sin número (no `06-04-PLAN.md`) que confunde a gsd-tools → reporta phase in_progress
- Phase 08 usa `08-SUMMARY.md` en vez de `08-01-SUMMARY.md` / `08-02-SUMMARY.md` — mismo problema
- Milestone ya había sido parcialmente archivado (`34d5f68`) antes de correr `/gsd:complete-milestone` formalmente

### Patterns Established

- Usar `prisma db push` para schema changes cuando hay drift de migraciones (documentado como deuda)
- Empleados no se eliminan — solo se desactivan (`status: inactivo`)
- `z.coerce.number()` es el API correcto en Zod 4 (no `z.number({ coerce: true })`)
- Timestamps UTC para clock logs: `localHour - 6` para offset CR

### Key Lessons

- Nombrar SUMMARYs con número de plan (`08-01-SUMMARY.md`) para que gsd-tools los detecte correctamente
- No mezclar archivados manuales con `/gsd:complete-milestone` — hacer uno o el otro
- El audit gap de `prisma db push` vs `migrate dev` es real — priorizar en v1.1

### Cost Observations

- Model mix: executor=sonnet, planner=opus, mapper=haiku
- 8 fases completadas en 3 días con trabajo conjunto Claude + OpenCode
- Mapper agents (haiku) muy eficientes para exploración de codebase en paralelo

---

## Milestone: v1.1 — Calidad, UI Moderna y Cobertura de Tests

**Shipped:** 2026-04-02
**Phases:** 8 | **Plans:** 22 | **Tasks:** 30 | **Timeline:** 2 días

### What Was Built

1. 59 tests unitarios nuevos: EmployeeService, ClockLogService, DeductionService, AuthService (total: 104)
2. Design system dark mode: tokens CSS globales, paleta zinc-950, sidebar moderno con colapso mobile
3. UI dark consistente en todas las tablas, formularios y modales del sistema
4. Integración frontend-backend auditada: 3 payload mismatches corregidos, errores concretos, skeletons + toasts
5. Servicio de notificaciones completo: backend API (6 endpoints) + Header panel + página dedicada + polling 30s
6. Skeleton loading + error banners con retry en 18 vistas del sistema
7. Rendimiento web: ~1.55MB JS diferido, imágenes 11.5MB → 39KB (99.7% reducción)

### What Worked

- **Gap closure plans** permitieron iterar rápido sobre bugs encontrados en verificación (Phase 15-03/04, Phase 13 gap closure)
- **Vertical slices** en Phase 13 (integración) — cada plan abordó un aspecto completo (audit, errores, skeletons, toasts)
- **Dynamic imports** para librerías pesadas fue decisión correcta — FullCalendar y ExcelJS no bloquean el render inicial
- **Image compression con sharp** redujo 11.5MB a 39KB automáticamente — mucho más eficiente que manual
- **Sonner toasts** reemplazaron modales de notificación — feedback más limpio y no intrusivo

### What Was Inefficient

- TESTS-05 (60% coverage target) no alcanzable — 33% real. El target era demasiado ambicioso sin tests de NomineeService
- Phase 13 grew to 9 plans (6 original + 3 gap closure) — scope creep from integration audit findings
- Duplicate entries in STATE.md decisions — same decision logged 2-3 times from different phase executions
- ROADMAP.md had duplicate Phase 14 entries and inconsistent formatting before cleanup

### Patterns Established

- Skeleton loading: `isLoading && data.length === 0` condition prevents flash during CRUD mutations
- Error banners: three separate early returns (loading → error → content) instead of conditional rendering
- Field names: frontend must match backend controller destructuring exactly (labor_event_id, not labor_event_ids)
- Dark mode: zinc-* palette exclusively for all dark: variants — no gray-*, no duplicate dark: classes
- Toast notifications: sonner for CRUD feedback, not modals
- Image optimization: sharp with palette optimization + dimension resizing for LCP-critical images

### Key Lessons

- Coverage targets should be realistic — 60% across all services requires tests for complex modules like NomineeService
- Integration audits naturally expand scope — budget extra plans for gap closure
- STATE.md needs deduplication mechanism for decisions logged across multiple phase executions
- Phase numbering should be consolidated early — Phase 17 was created then merged into Phase 16

### Cost Observations

- Model mix: executor=sonnet, planner=opus, checker=sonnet
- 8 phases completed in 2 days
- Gap closure plans were efficient — focused fixes rather than re-planning entire phases
- Image compression (Phase 16-03) was high-value: small effort, massive impact (99.7% reduction)

---

## Cross-Milestone Trends

| Metric | v1.0 | v1.1 |
|--------|------|------|
| Phases | 8 | 8 |
| Plans | 22 | 22 |
| Tasks | — | 30 |
| Tests | 45 | 104 |
| Duration | 3 días | 2 días |
| Failures at close | 0 | 0 |
| Known gaps | 2 | 2 |

---

*Last updated: 2026-04-02 after v1.1 milestone*
