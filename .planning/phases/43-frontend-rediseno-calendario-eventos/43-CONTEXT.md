# Phase 43: Frontend — Rediseño Completo del Calendario de Eventos Laborales - Context

**Gathered:** 2026-04-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Rediseñar completamente la página de eventos laborales (`pages/employee/events`) — aspecto visual, funcionalidad y flujo de usuario. No incluye cambios al backend API ni al modelo de datos. Solo frontend.

</domain>

<decisions>
## Implementation Decisions

### Layout y Estructura
- **D-01:** Layout = Google Calendar style — mini-calendar de navegación en sidebar izquierdo + calendario principal grande + sidebar colapsable con filtros y lista de upcoming events.

### Aspecto Visual
- **D-02:** Mantener FullCalendar como librería base. Reestilizar completamente con CSS custom para alinear al sistema de diseño zinc-950.
- **D-03:** Esquema de color dual: color de fondo por tipo de evento (vacaciones=azul, incapacidad=naranja, permiso=morado, etc.) + badge/indicator visual por status (activo/completado/cancelado).
- **D-04:** Stats cards mantener arriba de la página como están actualmente (Totales, Activos, Completados, Cancelados).

### Funcionalidad e Interacciones
- **D-05:** Mantener drag & drop (mover y resize eventos arrastrando). Mejorar la experiencia actual — feedback visual más claro durante arrastre.
- **D-06:** Reemplazar context menu (right-click) por click popover — click en evento abre popover con acciones (Ver/Editar/Eliminar). Más intuitivo para jefe no técnico.
- **D-07:** Agregar filtros en sidebar: por empleado específico, por tipo de evento, y por status. Filtros se aplican al calendario.
- **D-08:** Simplificar vistas a solo mes. Eliminar vistas de semana y día (no aportan para eventos laborales).

### Flujo del Usuario
- **D-09:** Crear evento = click en día → abre modal directamente (mantener flujo actual).
- **D-10:** Rediseño completo del LaborEventModal — diseño más limpio, pasos claros, mejor UX para jefe.
- **D-11:** Empty state = calendario vacío con mensaje sutil mejorado (no ilustración pesada).
- **D-12:** Preview ghost event — mantener funcionalidad pero hacer más obvio visualmente que es preview (pattern distinto, label "Vista previa", animación pulse).

### Agent's Discretion
- Paleta de colores específica por tipo de evento (hue selection)
- Animaciones de transición entre meses
- Mini-calendar component implementation details
- Popover positioning/styling
- Filter chip design

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Components
- `src/frontend/src/components/LaborEventsCalendar.tsx` — Current FullCalendar wrapper (358 lines). Rewrite target.
- `src/frontend/src/components/LaborEventModal.tsx` — Current event modal. Redesign target.
- `src/frontend/src/app/pages/employee/events/page.tsx` — Current page (317 lines). Full reconstruction.
- `src/frontend/src/hooks/useLaborEvents.ts` — Hook with CRUD + refresh. Keep/extend.
- `src/frontend/src/services/laborEventsService.ts` — HTTP service layer. Keep.
- `src/frontend/src/types/laborEvent.ts` — TypeScript types. Keep/extend.
- `src/frontend/src/styles/calendar.css` — FullCalendar custom styles. Rewrite.

### Design System
- `src/frontend/src/components/ui/StatsCards.tsx` — Reusable stats component (already used).
- `src/frontend/src/components/ui/EmployeeTabs.tsx` — Employee navigation tabs (keep).
- `src/frontend/src/components/ui/DropdownMenu.tsx` — Radix dropdown (reference for popover pattern).

### Codebase Patterns
- `.planning/codebase/CONVENTIONS.md` — Naming, import, and code style patterns.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StatsCards` component — reuse for top stats
- `EmployeeTabs` component — reuse for navigation
- `DropdownMenu` (Radix) — reference for click-based popover pattern
- `useLaborEvents` hook — reuse, extend with filter state
- `laborEventsService` — reuse HTTP layer as-is
- `useEmployeeList` hook — reuse for employee filter dropdown

### Established Patterns
- FullCalendar with lazy-load via `next/dynamic` (SSR disabled)
- `react-hook-form` + `zodResolver` for all forms
- `framer-motion` for animations
- `@heroicons/react` for icons
- `sonner` for toast notifications
- `@/` path alias for all imports

### Integration Points
- Page at `app/pages/employee/events/page.tsx`
- FullCalendar plugins: `dayGridPlugin`, `interactionPlugin` (remove `timeGridPlugin`)
- Backend endpoints unchanged — same service layer

</code_context>

<specifics>
## Specific Ideas

- Calendar should feel like Google Calendar but in zinc-950 dark theme
- Mini-calendar in sidebar for fast month-to-month navigation
- Sidebar collapses to icon-only for full-width calendar when needed
- Click popover replaces right-click — simpler for non-technical boss
- Ghost preview event needs clearer visual distinction (dashed border, "Vista previa" label, pulse animation)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 43-frontend-rediseno-calendario-eventos*
*Context gathered: 2026-04-19*
