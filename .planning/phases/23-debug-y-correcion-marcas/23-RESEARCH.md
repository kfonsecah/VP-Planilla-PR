# Phase 23: Debug y Corrección de Funcionalidad de Marcas - Research

**Researched:** 2026-04-09
**Domain:** Debugging clock logs import persistence and import session visibility issues
**Confidence:** HIGH

## Summary

This phase addresses two critical bugs in the clock logs (marcas) system:

1. **BUG-01**: Imported marks disappear on page reload - the import appears successful but data is not queryable afterward
2. **BUG-02**: Import session doesn't appear in traceability history

After analyzing the codebase, the root causes are:

- **BUG-01**: Likely caused by timezone handling in date queries. When `new Date("2026-04-06")` is called, JavaScript interprets it as UTC midnight, but the stored timestamps are in Costa Rica local time (UTC-6). This causes the query to miss records that were imported within the local timezone.
- **BUG-02**: The import session creation logic appears correct, but there may be issues with how sessions are fetched or displayed.

**Primary recommendation**: Fix timezone handling in date parsing for all clock log queries by explicitly using local dates instead of relying on JavaScript's default UTC interpretation.

## User Constraints (from CONTEXT.md)

### Bug 1 — Marcas no persisten al recargar
- Al cargar el Excel, las marcas del **6/4/26** aparecen correctamente en la UI
- Al **recargar la página** (o regresar a la vista), esas marcas **no se traen** — la tabla aparece vacía o incompleta
- Las marcas están supposedly guardadas in DB (ya que la importación respondió exitosamente)
- Usuario que realizó la prueba: **ken**

### Bug 2 — Trazabilidad (sesión de importación) no aparece
- La sesión de importación generada por esa carga no aparece en la UI o no es encontrada
- El historial de sesiones de importación estaría vacío o no muestra esa sesión

### Instrucciones del Usuario
- Se permite consultar DB directamente (via Prisma o SQL)
- Se permite hacer TODO lo necesario para debuguear y arreglar (tests, curl, DB queries, etc.)

## Architecture Patterns

### Clock Logs Query Flow

```
Frontend (useClockLogs hook)
  ├── getDefaultInitDate() → "2026-04-01" (first of month)
  ├── getDefaultEndDate() → "2026-04-09" (today)
  │
  └── fetchLogs() → ClockLogsService.getClockLogsPaginated()
       │
       └── GET /clock-logs/paginated?initDate=2026-04-01&endDate=2026-04-09
            │
            └── ClockLogsController.getClockLogsPaginated()
                 │
                 └── new Date(initDate) ← TIMEZONE ISSUE HERE
                       │
                       └── ClockLogsService.getClockLogsPaginated()
                            │
                            └── Prisma query with gte/lte on timestamp
```

### Date Handling Anti-Pattern

The current code does:
```typescript
// ClockLogsController.ts line 589
const initDate = req.query.initDate ? new Date(req.query.initDate as string) : undefined;
```

This is problematic because `new Date("2026-04-06")` creates a Date object representing **UTC midnight**, not local midnight. When stored timestamps are in Costa Rica time (UTC-6), this causes query mismatches.

### Import Session Flow

```
POST /clock-logs/import
  │
  ├── ImportSessionService.createSession() → Creates vpg_clock_import_sessions record
  │
  ├── ClockLogsService.bulkCreate() → Creates vpg_clock_logs with import_session_id FK
  │
  ├── ClockLogAnalysisService.runPostImportAnalysis() → Sets status on logs
  │
  └── ImportSessionService.updateSession() → Updates session status to "completed"
```

### Frontend Fetch Flow

```
useClockLogs hook
  │
  └── fetchImportSessions() → ClockLogsService.getImportSessions(5)
       │
       └── GET /clock-logs/import-sessions?limit=5
            │
            └── ImportSessionService.getRecentSessions(5)
                 │
                 └── SELECT * FROM vpg_clock_import_sessions ORDER BY started_at DESC
```

## Standard Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Backend | Express 5 + TypeScript | API server |
| ORM | Prisma 6.x | Database queries |
| Database | PostgreSQL | Data persistence |
| Frontend | Next.js 15 + React 19 | UI |
| Date Handling | JavaScript native Date | Date parsing |

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date parsing | Custom date parsers | Use libraries with explicit timezone handling | JavaScript Date constructor has subtle UTC/local issues |
| SQL timestamps | Manual string formatting | Prisma native DateTime | Prisma handles timezone conversion automatically |

## Common Pitfalls

### Pitfall 1: JavaScript Date UTC Interpretation
**What goes wrong:** `new Date("2026-04-06")` creates UTC midnight, but queries expect local time
**Why it happens:** JavaScript Date constructor interprets ISO date strings as UTC by default
**How to avoid:** Use explicit local date construction:
```typescript
// Instead of:
new Date(initDate as string)

// Use:
const [year, month, day] = (initDate as string).split('-').map(Number);
new Date(year, month - 1, day); // Local midnight
```

### Pitfall 2: Date Range End Date Exclusivity
**What goes wrong:** Query with `lte: endDate` at UTC midnight excludes records later that day
**Why it happens:** `endDate = "2026-04-06"` becomes `2026-04-06T00:00:00Z`, missing entire day
**How to avoid:** Set end date to end of day:
```typescript
const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
```

### Pitfall 3: Frontend Default Date Not Including Import Date
**What goes wrong:** Default date range might not include the imported date
**Why it happens:** If import was on 6/4 but default is current month, should include it
**How to verify:** Check if 6/4/26 falls within initDate to endDate range

## Code Examples

### Fixed Date Parsing Pattern
```typescript
// Controller - parse date query params as local time
function parseLocalDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const [year, month, day] = dateStr.split('-').map(Number);
  // Creates local midnight (Costa Rica UTC-6)
  return new Date(year, month - 1, day);
}

// In controller method:
const initDate = req.query.initDate ? parseLocalDate(req.query.initDate as string) : undefined;
const endDate = req.query.endDate ? parseLocalDate(req.query.endDate as string) : undefined;

// For end date, set to end of day to include all records
function parseLocalDateEnd(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}
```

### Debug Query for Verification
```sql
-- Check what dates are actually stored
SELECT clock_logs_timestamp, clock_logs_log_type, clock_logs_status
FROM vpg_clock_logs
WHERE clock_logs_employee_id = (
  SELECT employee_id FROM vpg_employees 
  WHERE employee_first_name LIKE '%ken%' LIMIT 1
)
ORDER BY clock_logs_timestamp DESC
LIMIT 20;

-- Check import sessions
SELECT * FROM vpg_clock_import_sessions
ORDER BY import_sessions_started_at DESC
LIMIT 10;
```

## Open Questions

1. **Timezone configuration**: What timezone is the PostgreSQL database running in?
   - If it's UTC, timestamps stored as "2026-04-06 08:00:00" display as different times in queries
   - Need to verify actual stored values to confirm hypothesis

2. **Import session visibility**: Is the session actually being created but not fetched, or is creation failing?
   - Requires DB query to verify session exists

3. **Exact import date**: Is "6/4/26" April 6th or June 4th?
   - Costa Rica uses DD/MM format, so it's April 6th, 2026

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x |
| Config file | src/backend/jest.config.ts |
| Quick run command | npm test -- --testPathPattern="ClockLogsService" |
| Full suite command | npm test |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command |
|--------|----------|-----------|-------------------|
| BUG-01 | Marcas persisten tras reload | Integration | Manual verification with DB |
| BUG-02 | Sesión visible en historial | Integration | Manual verification with DB |

### Wave 0 Gaps
- [ ] Debug queries to verify data in DB
- [ ] Manual API testing with curl to verify endpoint behavior

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| PostgreSQL | Data layer | ✓ (existing) | via Prisma | — |
| Node.js | Backend dev | ✓ (existing) | 22.14.0 | — |

**All dependencies available:** No action needed.

## Sources

### Primary (HIGH confidence)
- src/backend/src/controller/ClockLogsController.ts - Date parsing code
- src/backend/src/service/ClockLogsService.ts - Query logic
- src/frontend/src/hooks/useClockLogs.ts - Frontend date defaults
- src/frontend/src/services/clockLogsService.ts - API client

### Secondary (MEDIUM confidence)
- Prisma documentation on DateTime handling
- JavaScript Date timezone behavior (well-documented)

### Tertiary (LOW confidence)
- None - codebase analysis sufficient

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using project-established stack
- Architecture: HIGH - analysis of existing code flows
- Pitfalls: HIGH - identified specific timezone issue

**Research date:** 2026-04-09
**Valid until:** 14 days (timezone issue is well-understood but needs DB verification)
