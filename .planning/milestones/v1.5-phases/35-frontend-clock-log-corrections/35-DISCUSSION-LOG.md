# Phase 35: Frontend Clock Log Corrections - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-15
**Phase:** 35-frontend-clock-log-corrections
**Areas discussed:** Trigger Location, Form UX, Audit Timeline, Confirmation Dialogs

---

## Trigger Location

| Option | Description | Selected |
|--------|-------------|----------|
| Both (Recommended) | Day-level edit + employee-level add new. Uses existing patterns from ClockLogDetailModal. | ✓ |
| From each day card | Edit icon on each day row | |
| From employee header | Add button at card level only | |

**User's choice:** Both (Recommended)
**Notes:** User wants both approaches — day-level edit for existing marks, employee-level add for new marks. Reuses existing ClockLogDetailModal as pattern.

---

## Form UX

| Option | Description | Selected |
|--------|-------------|----------|
| 24-hour + pre-filled employee (Recommended) | Standard CR, employee locked when in employee card. Live justification validation. | ✓ |
| 12-hour with AM/PM | More familiar for some users | |
| Text input HH:MM | Simple, no component dependency | |

**User's choice:** 24-hour + pre-filled employee (Recommended)
**Notes:** 24-hour standard for Costa Rica. Employee selector pre-filled when opened from employee card — locked during edit, editable during add. Live character count for justification validation.

---

## Audit Timeline

| Option | Description | Selected |
|--------|-------------|----------|
| Inline in day card (Recommended) | Small indicator with count, hover/tooltip for quick summary. Matches existing patterns. | ✓ |
| Expandable panel | "Ver historial" link expands timeline within day | |
| Separate modal | Dedicated button opens full audit view | |

**User's choice:** Inline in day card (Recommended)
**Notes:** Small badge showing "N ajustes" on day row, hover shows tooltip with quick summary, click expands full timeline. Matches Phase 34 indicator patterns (green/yellow/red/blue badges per day).

---

## Confirmation Dialogs

| Option | Description | Selected |
|--------|-------------|----------|
| Modal with text input (Recommended) | Type the action word (e.g. 'ANULAR') to confirm. Highest security, matches UX-02. | ✓ |
| Double-click button | Click confirm twice within 1 second | |
| Checkbox + explicit button | Checkbox "Entiendo que esto no se puede deshacer" | |

**User's choice:** Modal with text input (Recommended)
**Notes:** For void/delete actions: modal shows warning + input field where user must type "ANULAR" to enable confirm button. Matches UX-02 requirement: "El botón de confirmar debe requerir texto o doble click."

---

## the agent's Discretion

- Exact time picker component implementation (native `input type="time"` vs library)
- Exact tooltip/hover implementation for audit indicator
- Animation variants (re-use existing from ClockLogDetailModal)

---

*Phase: 35-frontend-clock-log-corrections*
*Discussion date: 2026-04-15*