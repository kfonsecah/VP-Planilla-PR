# Phase 43: Frontend — Rediseño Calendario de Eventos — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-19
**Phase:** 43-frontend-rediseno-calendario-eventos
**Areas discussed:** Layout y estructura, Aspecto visual, Funcionalidad e interacciones, Flujo del usuario

---

## Layout y Estructura

| Option | Description | Selected |
|--------|-------------|----------|
| Calendario protagonista | Full width, no sidebar, lista como popover/drawer | |
| Split actual mejorado | Keep calendar + sidebar, better proportions | |
| Google Calendar style | Mini-cal + big cal + collapsible panel | ✓ |
| Otro | Custom description | |

**User's choice:** Google Calendar style
**Notes:** Agent recommended option 3 for: fast month navigation via mini-cal, collapsible sidebar, professional look matching Google Calendar mental model, FullCalendar native support.

---

## Aspecto Visual — Motor de rendereo

| Option | Description | Selected |
|--------|-------------|----------|
| Keep FullCalendar | Restyle heavily, saves weeks of custom work | ✓ |
| Build custom | Full control but massive effort | |

**User's choice:** Keep FullCalendar

## Aspecto Visual — Color scheme

| Option | Description | Selected |
|--------|-------------|----------|
| Por status | green/blue/red as today | |
| Por tipo de evento | Each event type has its own color | |
| Ambos | Color by type + badge/indicator by status | ✓ |

**User's choice:** Ambos — color por tipo + badge por status

## Aspecto Visual — Stats cards

| Option | Description | Selected |
|--------|-------------|----------|
| Mantener arriba | Keep stats cards at top | ✓ |
| Mover al sidebar | Compact summary in sidebar | |
| Quitar | Remove entirely | |

**User's choice:** Mantener arriba

---

## Funcionalidad — Drag & drop

| Option | Description | Selected |
|--------|-------------|----------|
| Sí (mantener) | Keep move and resize via drag | ✓ |
| Quitar | Too confusing for non-technical boss | |

**User's choice:** Sí, con mejoras
**Notes:** User specified it "necesita mejoras" — improve visual feedback during drag.

## Funcionalidad — Context menu

| Option | Description | Selected |
|--------|-------------|----------|
| Mantener right-click | Keep as-is | |
| Click popover | Click opens popover with actions | ✓ |
| Ambos | Click + right-click both work | |

**User's choice:** Click popover (replace right-click)

## Funcionalidad — Filtros

| Option | Description | Selected |
|--------|-------------|----------|
| Por empleado | Filter by specific employee | ✓ |
| Por tipo de evento | Filter by event type | ✓ |
| Por status | Filter by active/completed/cancelled | ✓ |
| Todos | All three filters | ✓ |
| Ninguno | No new filters | |

**User's choice:** All three filters (employee + type + status)

## Funcionalidad — Vistas

| Option | Description | Selected |
|--------|-------------|----------|
| Mes/Semana/Día | All three views | |
| Solo mes y semana | Remove day view | |
| Solo mes | Maximum simplification | ✓ |

**User's choice:** Solo mes

---

## Flujo — Crear evento

| Option | Description | Selected |
|--------|-------------|----------|
| Click día → modal | Current flow | ✓ |
| Click día → inline popover | Quick create inline | |
| Solo botón + modal | No click-on-calendar creation | |

**User's choice:** Click día → modal (mantener)

## Flujo — Modal rediseño

| Option | Description | Selected |
|--------|-------------|----------|
| Rediseño completo | New cleaner design | ✓ |
| Mejorar actual | Cosmetic adjustments only | |
| Agent discretion | Agent decides | |

**User's choice:** Rediseño completo

## Flujo — Empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Guía visual | Illustration + CTA button | |
| Calendario vacío + mensaje | Subtle improved text | ✓ |
| Agent discretion | Agent decides | |

**User's choice:** Calendario vacío + mensaje sutil mejorado

## Flujo — Preview ghost event

| Option | Description | Selected |
|--------|-------------|----------|
| Mantener | Keep as-is | |
| Quitar | Remove, confusing | |
| Mejorar | Keep but make more obvious | ✓ |

**User's choice:** Mejorar — mantener pero hacer más obvio

---

## Agent's Discretion

- Color palette per event type (hue selection)
- Transition animations between months
- Mini-calendar component implementation
- Popover positioning/styling
- Filter chip design

## Deferred Ideas

None — discussion stayed within phase scope
