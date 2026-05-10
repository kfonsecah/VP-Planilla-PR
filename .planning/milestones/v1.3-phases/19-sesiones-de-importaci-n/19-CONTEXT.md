# Phase 19: Sesiones de Importación - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Cada importación queda registrada como sesión identificable con métricas y cada marca tiene vínculo a su sesión de origen. Depende de Phase 18 (enums ClockLogType/Status/Source ya existen).

Requisitos: IMPORT-01 (tabla vpg_clock_import_sessions con fecha, origen, conteos, status), IMPORT-02 (clock_logs referencia import_session_id), IMPORT-03 (respuesta de importación incluye session_id, created, skipped, anomalies).

</domain>

<decisions>
## Implementation Decisions

### Session Table Design
- New table `vpg_clock_import_sessions` with: id, started_at, completed_at, source (java_import/excel_import/manual), status (pending/running/completed/failed), total_records, created_count, skipped_count, anomaly_count, created_by (user_id FK)
- Session status transitions: pending → running → completed/failed

### Clock Logs Relationship
- Add `clock_logs_import_session_id Int?` to vpg_clock_logs with FK to vpg_clock_import_sessions
- Nullable because manual entries (source: manual) may not have a session
- Set session_id during bulkCreate when importing

### Import Response Shape
- POST /api/clock-logs/import returns: `{ session_id, status, created, skipped, anomalies, errors[] }`
- Skipped records include descriptive error messages (extends NORM-03 pattern)

### the agent's Discretion
- Exact migration strategy (add column to existing vpg_clock_logs)
- Whether to track per-file metadata (filename, upload path)
- Session cleanup/archival strategy

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ClockLogsService.bulkCreate()` — already accepts `source` param, needs `sessionId` added
- `ClockLogsController.bulkCreate()` — handles import, needs session lifecycle wrapping
- `ClockLogStatus` enum — already has `pending/valid/anomaly/corrected/orphan`
- `ClockLogSource` enum — already has `java_import/excel_import/manual`
- `vpg_audit_logs` table — exists, can track session creation events

### Established Patterns
- Backend: Route → Controller → Service → Prisma
- All services use static methods
- Prisma singleton from `../lib/prisma`
- `asyncHandler` wrapper on all routes
- `AuthMiddleware.verifyToken` on authenticated routes

### Integration Points
- `ClockLogsService.bulkCreate()` needs to accept and set `import_session_id`
- Import endpoint needs to create session before bulk create, update after
- Phase 20 will use session to trigger anomaly detection after completion

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 19-sesiones-de-importación*
*Context gathered: 2026-04-05*
