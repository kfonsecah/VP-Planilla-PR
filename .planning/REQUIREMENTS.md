# Requirements: VP-Planilla v1.3

**Defined:** 2026-04-04
**Milestone:** v1.3 — Sistema de Marcas de Reloj Robusto
**Core Value:** Calcular y generar planillas correctas conforme a la ley laboral costarricense, con datos seguros y auditables.

---

## v1.3 Requirements

### Normalización de Tipos (NORM)

- [ ] **NORM-01**: El sistema almacena todos los tipos de marca usando un valor canónico único (`IN`/`OUT`) independientemente del origen (Java: `IN`/`OUT`, Excel: `ENTRADA`/`SALIDA`)
- [ ] **NORM-02**: La importación de archivos con tipos `ENTRADA`/`SALIDA` los convierte automáticamente a `IN`/`OUT` antes de persistir en base de datos
- [ ] **NORM-03**: El sistema rechaza con error descriptivo cualquier valor de tipo que no sea `IN` ni `OUT` (post-normalización)

### Trazabilidad de Marcas (TRACK)

- [ ] **TRACK-01**: Cada registro en `vpg_clock_logs` tiene un campo `status` con valores `pending` | `valid` | `anomaly` | `corrected` | `orphan`
- [ ] **TRACK-02**: Cada registro en `vpg_clock_logs` tiene un campo `source` con valores `java_import` | `excel_import` | `manual`
- [ ] **TRACK-03**: El sistema expone un endpoint `GET /api/clock-logs/stats` que retorna conteo por status y source para un rango de fechas dado

### Sesiones de Importación (IMPORT)

- [ ] **IMPORT-01**: Existe la tabla `vpg_clock_import_sessions` que registra cada importación con: fecha, origen del archivo, registros procesados, registros creados, duplicados saltados y status (`success` | `partial` | `failed`)
- [ ] **IMPORT-02**: Cada `vpg_clock_logs` creado por importación tiene referencia al `import_session_id` que lo originó
- [ ] **IMPORT-03**: El endpoint de importación retorna el resumen de sesión en la respuesta (`session_id`, `created`, `skipped`, `anomalies`)

### Cola de Huérfanas (ORPHAN)

- [ ] **ORPHAN-01**: El sistema detecta marcas huérfanas (IN sin OUT siguiente, o OUT sin IN previo dentro de un umbral de 24h) y las marca con `status = 'orphan'`
- [ ] **ORPHAN-02**: El endpoint `GET /api/clock-logs/orphans` retorna todas las marcas con `status = 'orphan'` paginadas, con información del empleado
- [ ] **ORPHAN-03**: Un administrador puede resolver una huérfana: asignarle una marca complementaria manual o descartarla con justificación

### Detección de Anomalías (ANOMALY)

- [ ] **ANOMALY-01**: El motor de anomalías detecta doble entrada (dos IN consecutivos del mismo empleado sin OUT intermedio) y marca ambas como `status = 'anomaly'`
- [ ] **ANOMALY-02**: El motor de anomalías detecta doble salida (dos OUT consecutivos del mismo empleado sin IN intermedio) y marca ambas como `status = 'anomaly'`
- [ ] **ANOMALY-03**: El motor de anomalías detecta sesiones con duración superior a 16 horas y las marca como `status = 'anomaly'` con tipo `long_session`
- [ ] **ANOMALY-04**: La detección de anomalías se ejecuta automáticamente tras cada importación exitosa
- [ ] **ANOMALY-05**: El endpoint `GET /api/clock-logs/anomalies` retorna todas las marcas con `status = 'anomaly'` con tipo de anomalía, paginado

### Corrección Manual (CORRECT)

- [ ] **CORRECT-01**: El endpoint `POST /api/clock-logs/correct` permite a un administrador crear una marca manual con `source = 'manual'`, registrando quién la creó y la justificación
- [ ] **CORRECT-02**: El endpoint `PATCH /api/clock-logs/:id/status` permite cambiar el status de una marca a `corrected` o descartar con justificación, registrando el cambio en `vpg_audit_logs`
- [ ] **CORRECT-03**: Toda corrección manual queda registrada en `vpg_audit_logs` con entidad `clock_log`, acción `manual_correction`, y detalle de cambio

### Dashboard UI de Marcas (UI)

- [ ] **UI-01**: La página de asistencia (`/attendance`) muestra un panel de resumen con conteo de marcas por status (pending, valid, anomaly, orphan) para el período activo
- [ ] **UI-02**: La tabla de marcas permite filtrar por status y por empleado, mostrando columnas: empleado, timestamp, tipo (IN/OUT), status, source
- [ ] **UI-03**: Las marcas con `status = 'anomaly'` u `orphan'` se distinguen visualmente (badge de color) en la tabla
- [ ] **UI-04**: Un modal de detalle de marca permite al administrador ver el historial de la marca y ejecutar una corrección manual directamente desde la UI
- [ ] **UI-05**: La página muestra un panel de sesiones de importación recientes con link a detalle de cada sesión

---

## v2 Requirements (Deferred)

### Notificaciones Automáticas

- **NOTIF-01**: Envío automático de email al administrador cuando el número de anomalías supera un umbral configurable
- **NOTIF-02**: Resumen diario de marcas pendientes de revisión

### Integración Avanzada

- **ADV-01**: Soporte para múltiples fuentes de importación simultáneas con deduplicación cross-session
- **ADV-02**: API pública para integración con dispositivos biométricos via webhook

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Integración directa con dispositivos físicos biométricos | Hardware-specific, fuera del stack actual |
| App móvil para marcar asistencia | Fuera del alcance — solo sistema web |
| Eliminación de marcas históricas | Solo corrección + status; historial inmutable para auditoría |
| Cálculo automático de planilla basado solo en marcas | Flujo de planilla ya existe; las marcas se usan como input validado |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NORM-01 | Phase 18 | Pending |
| NORM-02 | Phase 18 | Pending |
| NORM-03 | Phase 18 | Pending |
| TRACK-01 | Phase 18 | Pending |
| TRACK-02 | Phase 18 | Pending |
| TRACK-03 | Phase 18 | Pending |
| IMPORT-01 | Phase 19 | Pending |
| IMPORT-02 | Phase 19 | Pending |
| IMPORT-03 | Phase 19 | Pending |
| ORPHAN-01 | Phase 20 | Pending |
| ORPHAN-02 | Phase 20 | Pending |
| ORPHAN-03 | Phase 20 | Pending |
| ANOMALY-01 | Phase 20 | Pending |
| ANOMALY-02 | Phase 20 | Pending |
| ANOMALY-03 | Phase 20 | Pending |
| ANOMALY-04 | Phase 20 | Pending |
| ANOMALY-05 | Phase 20 | Pending |
| CORRECT-01 | Phase 21 | Pending |
| CORRECT-02 | Phase 21 | Pending |
| CORRECT-03 | Phase 21 | Pending |
| UI-01 | Phase 22 | Pending |
| UI-02 | Phase 22 | Pending |
| UI-03 | Phase 22 | Pending |
| UI-04 | Phase 22 | Pending |
| UI-05 | Phase 22 | Pending |

**Coverage:**
- v1.3 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 — initial v1.3 definition*
