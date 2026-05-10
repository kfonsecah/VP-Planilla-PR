# Phase 34: Frontend — Rediseño Clock Logs (Vista Agrupada) - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign the Clock Logs dashboard from a flat table to a hierarchical, grouped view (Branch > Employee > Day > Pair) to facilitate rapid detection and correction of anomalies before payroll processing. This includes implementing a new effective marks hook and a service layer to consume the Phase 33 API.

</domain>

<decisions>
## Implementation Decisions

### 1. Navigation & Filtering
- **D-01: Biweekly Presets**: Replace generic date presets (Today, 7 days) with payroll-centric buttons: "1ra Quincena" (1-15), "2da Quincena" (16-31), and "Mes Actual".
- **D-02: Branch Grouping**: Group employees by Branch/Sucursal at the top level to manage multi-site operations effectively.
- **D-03: Anomaly Priority**: Sort employees with anomalies or missing logs to the top of the list.

### 2. Layout & UI/UX
- **D-04: Card Hierarchy**: Use a collapsible card pattern: [Branch Header] > [Employee Card] > [Daily Rows (Expanded)].
- **D-05: Scroll Pattern**: Implement Infinite Scroll for the employee list using `useInfiniteQuery` (or equivalent) for better performance and fluidity.
- **D-06: Employee Summary**: Show "Total Hours in Period", "Anomalies Count", and "Worked Days" in the collapsed employee card.

### 3. Indicators & Feedback
- **D-07: Problem Badges**: Display a badge with the exact count of anomalies/missing logs in the employee card.
- **D-08: Actionable Alerts**: For days with anomalies (e.g., missing OUT), display a clear message with a suggested action (e.g., "Falta marca de salida. Haga clic aquí para agregarla.").
- **D-09: Source Traceability**: Use visual icons to distinguish between original clock device marks and manual/adjusted entries.

### 4. Import Sessions Panel
- **D-12: Preserve ImportSessionsPanel**: The existing `ImportSessionsPanel` component MUST be preserved in the redesigned page. Place it below the filters section, collapsed by default. This lets the boss check the last import date without leaving the page. Do NOT delete this component.

### Claude's Discretion
- **D-10: Color Palette**: Claude chooses specific hex values for the status indicators (Green/Yellow/Red/Blue/Grey) following the existing Tailwind zinc-950 theme.
- **D-11: Empty State Design**: Claude designs the "guide the boss" empty state message and illustration.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone & Requirements
- `.planning/milestones/v1.5-REQUIREMENTS.md` — MARCAS-01, UX-01, UX-03 specs.
- `.planning/milestones/v1.5-ROADMAP.md` — Phase 34 deliverables and dependencies.

### Prior Phase Decisions
- `.planning/phases/33-backend-motor-de-marcas-efectivas-api-de-ajustes/33-CONTEXT.md` — API contract for `GET /api/clock-logs/effective` (paired entries).

### Frontend Assets
- `src/frontend/src/app/pages/clock-logs/page.tsx` — Current implementation (to be replaced).
- `src/frontend/src/features/clock-logs/presenters/clockLogPresenter.ts` — Existing presenters and mappings.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ClockLogStatusBadge.tsx`: Base component for status display.
- `DatePicker.tsx`: Used for custom date range selection.
- `useClockLogs.ts`: Existing hook (to be adapted or replaced by `useEffectiveMarks.ts`).

### Established Patterns
- **Presentation Logic**: Logic for colors and names is centralized in `clockLogPresenter.ts`.
- **HTTP Layer**: Use `http.ts` for all API calls as enforced in Phase 25.

### Integration Points
- `/pages/clock-logs`: Primary entry point for the redesign.
- `SidebarItem.tsx`: Links to the dashboard.

</code_context>

<specifics>
## Specific Ideas
- The redesign must feel like a "Work Queue" where the boss clears problems before moving to the Payroll Wizard.
- Use `framer-motion` (`AnimatePresence`) for smooth expansion of cards and day rows.

</specifics>

<deferred>
## Deferred Ideas
- **Phase 35**: Implementation of the actual adjustment modals (Add/Edit/Void).
- **Phase 37**: Full Payroll Wizard implementation.

</deferred>

---
*Phase: 34-frontend-rediseno-clock-logs*
*Context gathered: 2026-04-14*
