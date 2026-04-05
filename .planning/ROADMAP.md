# Roadmap: VP-Planilla v1.3

**Milestone:** v1.3 — Sistema de Marcas de Reloj Robusto
**Defined:** 2026-04-05
**Granularity:** Standard
**Coverage:** 25/25 requirements mapped

---

## Phases

- [x] **Phase 18: Normalización y Trazabilidad** - Tipo canónico IN/OUT + campos status/source en vpg_clock_logs
- [x] **Phase 19: Sesiones de Importación** - Tabla de sesiones con historial completo y vínculo a cada marca (completed 2026-04-05)
- [x] **Phase 20: Huérfanas y Anomalías** - Cola de huérfanas + motor de detección de anomalías automático
- [ ] **Phase 21: Corrección Manual** - API de corrección con registro de auditoría completo
- [ ] **Phase 22: Dashboard UI de Marcas** - Visualización, filtros, badges de estado y acciones de corrección desde la UI

---

## Phase Details

### Phase 18: Normalización y Trazabilidad
**Goal**: El sistema almacena marcas de reloj con un tipo canónico único y cada registro tiene trazabilidad de estado y origen
**Depends on**: Nothing (first phase of v1.3)
**Requirements**: NORM-01, NORM-02, NORM-03, TRACK-01, TRACK-02, TRACK-03
**Success Criteria** (what must be TRUE):
  1. Un archivo Excel con tipos ENTRADA/SALIDA importa sin error y los registros en base de datos muestran IN/OUT
  2. Un valor de tipo desconocido enviado a la importación retorna un error descriptivo con el valor rechazado
  3. Cada fila de vpg_clock_logs tiene columnas status y source con valores válidos según el catálogo definido
  4. El endpoint GET /api/clock-logs/stats retorna conteo agrupado por status y source para un rango de fechas
**Plans**: 2 plans

Plans:
- [ ] 18-01-PLAN.md — Prisma enums (ClockLogType/Status/Source), migration with data pre-cleanup, model update, normalization utility
- [ ] 18-02-PLAN.md — Controller refactor (shared normalization, strict rejection), stats endpoint (groupBy), route registration

### Phase 19: Sesiones de Importación
**Goal**: Cada importación queda registrada como sesión identificable con métricas y cada marca tiene vínculo a su sesión de origen
**Depends on**: Phase 18
**Requirements**: IMPORT-01, IMPORT-02, IMPORT-03
**Success Criteria** (what must be TRUE):
  1. Después de una importación existe un registro en vpg_clock_import_sessions con fecha, origen, conteos y status
  2. Cada marca creada por importación referencia el import_session_id de la sesión que la originó
  3. La respuesta del endpoint de importación incluye session_id, created, skipped y anomalies
**Plans**: 2 plans

Plans:
- [x] 19-01-PLAN.md — Prisma schema (vpg_clock_import_sessions model + clock_logs FK), migration, TypeScript interfaces
- [x] 19-02-PLAN.md — ImportSessionService, ClockLogsService refactor, import controller + route

### Phase 20: Huérfanas y Anomalías
**Goal**: El sistema identifica automáticamente marcas sin par y secuencias inválidas, y expone endpoints para revisarlas
**Depends on**: Phase 19
**Requirements**: ORPHAN-01, ORPHAN-02, ORPHAN-03, ANOMALY-01, ANOMALY-02, ANOMALY-03, ANOMALY-04, ANOMALY-05
**Success Criteria** (what must be TRUE):
  1. Un IN sin OUT subsiguiente dentro de 24h queda con status orphan tras la importación
  2. Dos IN consecutivos del mismo empleado sin OUT intermedio quedan con status anomaly tras la importación
  3. Una sesión de más de 16 horas continuas queda marcada como anomaly con tipo long_session
  4. La detección de anomalías y huérfanas se dispara automáticamente al completar una importación exitosa
  5. Los endpoints GET /api/clock-logs/orphans y GET /api/clock-logs/anomalies retornan registros paginados con información del empleado y tipo de anomalía
**Plans**: 3 plans

Plans:
- [x] 20-01-PLAN.md — ClockLogAnalysisService with detectors and automatic post-import analysis
- [x] 20-02-PLAN.md — GET /clock-logs/orphans and GET /clock-logs/anomalies endpoints with pagination
- [x] 20-03-PLAN.md — POST /clock-logs/orphans/:id/resolve endpoint for orphan resolution

### Phase 21: Corrección Manual
**Goal**: Un administrador puede crear marcas manuales, cambiar el estado de una marca y toda acción queda en el log de auditoría
**Depends on**: Phase 20
**Requirements**: CORRECT-01, CORRECT-02, CORRECT-03
**Success Criteria** (what must be TRUE):
  1. POST /api/clock-logs/correct crea una marca con source manual, registra quién la creó y la justificación
  2. PATCH /api/clock-logs/:id/status cambia el status de una marca a corrected o la descarta con justificación
  3. Toda corrección manual genera un registro en vpg_audit_logs con entidad clock_log, acción manual_correction y detalle del cambio
**Plans**: 2 plans

Plans:
- [ ] 21-01-PLAN.md — Service layer methods and Zod validation schemas for manual corrections
- [ ] 21-02-PLAN.md — Controller endpoints, route registration with admin auth, and tests

### Phase 22: Dashboard UI de Marcas
**Goal**: El administrador puede ver el estado de las marcas, identificar anomalías visualmente y ejecutar correcciones directamente desde la UI
**Depends on**: Phase 21
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. La página /attendance muestra un panel de resumen con conteos de marcas por status para el período activo
  2. La tabla de marcas permite filtrar por status y por empleado mostrando empleado, timestamp, tipo, status y source
  3. Las marcas con status anomaly u orphan tienen badges de color distintivos visibles en la tabla
  4. Un modal de detalle de marca permite al administrador ejecutar una corrección manual sin salir de la página
  5. La página muestra sesiones de importación recientes con acceso al detalle de cada una
**Plans**: TBD
**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 18. Normalización y Trazabilidad | 2/2 | ✓ Complete | 2026-04-05 |
| 19. Sesiones de Importación | 2/2 | ✓ Complete | 2026-04-05 |
| 20. Huérfanas y Anomalías | 3/3 | ✓ Complete | 2026-04-05 |
| 21. Corrección Manual | 0/2 | Not started | - |
| 22. Dashboard UI de Marcas | 0/? | Not started | - |

---

## Coverage Validation

| Requirement | Phase | Category |
|-------------|-------|----------|
| NORM-01 | Phase 18 | Normalización |
| NORM-02 | Phase 18 | Normalización |
| NORM-03 | Phase 18 | Normalización |
| TRACK-01 | Phase 18 | Trazabilidad |
| TRACK-02 | Phase 18 | Trazabilidad |
| TRACK-03 | Phase 18 | Trazabilidad |
| IMPORT-01 | Phase 19 | Sesiones |
| IMPORT-02 | Phase 19 | Sesiones |
| IMPORT-03 | Phase 19 | Sesiones |
| ORPHAN-01 | Phase 20 | Huérfanas |
| ORPHAN-02 | Phase 20 | Huérfanas |
| ORPHAN-03 | Phase 20 | Huérfanas |
| ANOMALY-01 | Phase 20 | Anomalías |
| ANOMALY-02 | Phase 20 | Anomalías |
| ANOMALY-03 | Phase 20 | Anomalías |
| ANOMALY-04 | Phase 20 | Anomalías |
| ANOMALY-05 | Phase 20 | Anomalías |
| CORRECT-01 | Phase 21 | Corrección |
| CORRECT-02 | Phase 21 | Corrección |
| CORRECT-03 | Phase 21 | Corrección |
| UI-01 | Phase 22 | Dashboard UI |
| UI-02 | Phase 22 | Dashboard UI |
| UI-03 | Phase 22 | Dashboard UI |
| UI-04 | Phase 22 | Dashboard UI |
| UI-05 | Phase 22 | Dashboard UI |

**Mapped:** 25/25 v1.3 requirements
**Orphaned:** 0

---

*Created: 2026-04-05 — v1.3 roadmap initial*
