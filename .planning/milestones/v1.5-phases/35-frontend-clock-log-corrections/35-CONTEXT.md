# Phase 35: Frontend Clock Log Corrections - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Implementar los modales de corrección de marcas (agregar/editar/anular) con justificación obligatoria y vista de auditoría. Conecta con el backend API existente de ajustes y muestra el historial de cambios.

**Entregables:**
- Modal "Agregar marca faltante" con selector de empleado pre-llenado, fecha pre-llenado, hora, tipo, justificación (mín 10 chars)
- Modal "Editar marca" con valor original, nuevo timestamp, justificación
- Modal "Anular marca" con valoración original, justificación, diálogo de confirmación
- Panel de historial de auditoría: timeline de cambios por marca, expandible dentro del día
- Todos los modales con AnimatePresence + motion.div
- Todos los formularios con react-hook-form + zodResolver

**Covered requirements:** MARCAS-02, MARCAS-03, MARCAS-04, MARCAS-05, UX-02

</domain>

<decisions>
## Implementation Decisions

### Trigger Location
- **D-01:** Both approaches — edit icon on each day card + "Agregar marca" button at employee header level
- Day card triggers edit/void modal for that specific day
- Employee header triggers "add new" modal with employee pre-filled and locked

### Form UX
- **D-02:** 24-hour time picker — standard in Costa Rica, matches backend format
- **D-03:** Employee pre-filled and locked when opened from within an employee card
- **D-04:** Live validation feedback — justification shows character count inline, error on submit
- **D-05:** Preview text before confirm: "Se agregará una marca de entrada para Juan Pérez el 15/04/2026 a las 08:00"

### Audit Timeline
- **D-06:** Inline in day card — small indicator (badge with count) on day row, hover shows tooltip summary
- Full timeline available on click/expand within day card
- Uses existing `auditLogsService` for fetching

### Confirmation Dialogs
- **D-07:** Modal with text input for destructive actions (void) — user must type "ANULAR" to confirm
- Matches UX-02 requirement: "type text or double click for irreversible actions"

### the agent's Discretion
- Exact time picker component implementation (native input type="time" vs library)
- Exact tooltip/hover implementation for audit indicator
- Animation variants (re-use existing from ClockLogDetailModal)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema and Backend
- `.planning/milestones/v1.5-ROADMAP.md` §101-128 — Phase 35 deliverables specification
- `.planning/milestones/v1.5-REQUIREMENTS.md` — MARCAS-02, MARCAS-03, MARCAS-04, MARCAS-05, UX-02 requirements

### Frontend Patterns
- `src/frontend/src/components/ClockLogDetailModal.tsx` — Existing correction modal with justification, audit display
- `src/frontend/src/components/ui/Modal.tsx` — Base modal component
- `src/frontend/src/components/ui/FormModal.tsx` — Form wrapper with AnimatePresence
- `src/frontend/src/hooks/useEffectiveMarks.ts` — Hook consuming effective marks endpoint
- `src/frontend/src/services/effectiveMarksService.ts` — Service layer
- `src/frontend/src/services/auditLogsService.ts` — Audit logging service
- `src/frontend/src/app/pages/attendance/page.tsx` — Existing clock logs page

### Backend API
- `src/backend/src/service/ClockLogAdjustmentService.ts` — Backend adjustment service
- `src/backend/src/service/ClockLogEffectiveService.ts` — Effective marks engine

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ClockLogDetailModal.tsx` — Full correction form pattern already exists: justification field, audit history, action handling
- `auditLogsService.ts` — Working audit log fetching
- `useEffectiveMarks.ts` — Hook that fetches effective marks (already integrated)
- `EffectiveMarksService.ts` — Service layer for effective marks

### Established Patterns
- Modals use `AnimatePresence` + `motion.div` with backdrop/modal variants
- Forms use `react-hook-form` with inline validation
- Badge indicators: green=complete, yellow=inconsistency, red=error, blue=corrected
- Zinc-950 palette throughout

### Integration Points
- Modals connect to `ClockLogAdjustmentService` via `http.ts` service calls
- Audit timeline shows changes via `auditLogsService`
- Effective marks refresh after correction via `useEffectiveMarks` invalidation
- Day card shows correction indicator (blue badge) — already decided in Phase 34

</code_context>

<specifics>
## Specific Ideas

- "Preview text before confirm" — show exact change: "Se agregará una marca de entrada para Juan Pérez el 15/04/2026 a las 08:00"
- "Employee pre-filled when in employee card" — lock the employee selector, show "Agregando marca para: Juan Pérez"
- "Type ANULAR to confirm" — matches UX-02 requirement for text input confirmation

**No external specs** — requirements fully captured in decisions above

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 35-frontend-clock-log-corrections*
*Context gathered: 2026-04-15*