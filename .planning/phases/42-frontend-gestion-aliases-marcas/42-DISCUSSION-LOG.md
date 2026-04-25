# Phase 42: Frontend — Gestión de Aliases de Marcas - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-17
**Phase:** 42 — Frontend — Gestión de Aliases de Marcas
**Areas discussed:** Placement, Layout, Add flow, Delete confirmation

---

## Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Sección al final del edit page | En `/employee/edit/[id]/page.tsx` | |
| Tab dentro del edit page | Pestaña separada | |
| Página dedicada | `/employee/:id/aliases` | |
| Dentro de EditEmployeeModal | Sección nueva al final del modal de edición | ✓ |

**User's choice:** `EditEmployeeModal.tsx` — sección nueva antes de los botones de acción.
**Notes:** El usuario aclaró que "modal de empleado" = `EditEmployeeModal`, no `EmployeeProfileModal`.

---

## Layout de aliases

| Option | Description | Selected |
|--------|-------------|----------|
| Tags/chips | Compacto, visual, cada alias como chip con X | ✓ |
| Lista con botón delete | Fila por alias con botón delete explícito | |

**User's choice:** Tags/chips.
**Notes:** Preferencia por presentación compacta dentro del modal.

---

## Flujo de agregar alias

| Option | Description | Selected |
|--------|-------------|----------|
| Input inline + botón | Sin modal extra, dentro de la sección | ✓ |
| Modal pequeño | Patrón modal existente | |

**User's choice:** Input inline + botón "Agregar".
**Notes:** Todo dentro del `EditEmployeeModal`, sin abrir otro modal.

---

## Confirmación de eliminación

| Option | Description | Selected |
|--------|-------------|----------|
| Modal/dialog de confirmación | Confirmar antes de borrar | |
| Borrado directo con toast | Click X → elimina → toast feedback | ✓ |

**User's choice:** Borrado directo. Sin modal de confirmación.
**Notes:** Feedback via toast de sonner (ya disponible en el proyecto).

---

## Claude's Discretion

- Nombre del componente extraído (`ClockAliasSection` sugerido)
- Manejo de error de duplicado (inline bajo input)
- Estado de carga de la lista

## Deferred Ideas

- Bulk import de aliases via CSV — v1.6
- Pre-población desde historial de importaciones — v1.6
