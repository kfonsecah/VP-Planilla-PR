# Phase 42: Frontend — Gestión de Aliases de Marcas - Context

**Gathered:** 2026-04-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Agregar una sección de gestión de aliases de reloj dentro de `EditEmployeeModal.tsx`. El admin puede ver aliases existentes (chips), agregar uno nuevo (input inline), y eliminar uno (botón X en el chip). Sin pantalla nueva, sin modal extra.

</domain>

<decisions>
## Implementation Decisions

### Placement
- **D-01:** La sección de aliases va dentro de `EditEmployeeModal.tsx`, **no** en la página `/employee/edit/[id]/page.tsx` ni en `EmployeeProfileModal.tsx`.
- **D-02:** La sección se inserta entre el último grupo de campos del formulario (Género) y los botones de acción (Cancelar/Guardar). Punto exacto: antes del `<div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">` que contiene los botones.

### Layout de aliases
- **D-03:** Los aliases se muestran como **tags/chips** compactos. Cada chip muestra el alias_value y un botón X para eliminar.
- **D-04:** La lista de chips va debajo del label "Aliases de Reloj" con separador `border-t` igual al resto del modal.

### Flujo de agregar alias
- **D-05:** Input inline + botón "Agregar" — sin modal adicional. El usuario escribe el alias en un `<input>` dentro de la misma sección y presiona "Agregar" (o Enter).
- **D-06:** El input se limpia después de agregar exitosamente.

### Eliminación
- **D-07:** Eliminación directa al hacer click en X del chip. Sin modal de confirmación. Toast de éxito/error como feedback.
- **D-08:** El chip desaparece inmediatamente (optimistic UI o re-fetch post-delete).

### Claude's Discretion
- Nombre del componente extraído (si se extrae): Claude decide (sugerencia: `ClockAliasSection`)
- Manejo de error de duplicado: mostrar inline bajo el input (el backend retorna 409 o error de unique constraint)
- Estado de carga: skeleton o spinner minimalista mientras carga la lista de aliases

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Target file (primary)
- `src/frontend/src/components/EditEmployeeModal.tsx` — modal que se modifica; insertar sección antes de línea 339 (div border-t con botones)

### API backend (Phase 41)
- `src/backend/src/routes/ClockAliasRoute.ts` — endpoints disponibles: GET/POST/DELETE `/api/employees/:id/aliases`
- `src/backend/src/model/clockAlias.ts` — interfaz ClockAlias (id, employee_id, name, created_at, version)

### Patrones de hooks/servicios a seguir
- `src/frontend/src/hooks/useEmployeeEdit.ts` — patrón useCallback, return shape { data, isLoading, error, ...actions }
- `src/frontend/src/services/clockLogsService.ts` — patrón de service con http.ts
- `src/frontend/src/services/http.ts` — cliente HTTP central, NUNCA usar fetch directo

### Patrones de UI a seguir
- `src/frontend/src/components/VoidClockLogModal.tsx` — patrón de chip/badge y feedback toast
- `src/frontend/src/components/AddClockLogModal.tsx` — patrón modal AnimatePresence + input inline

### Convenciones del proyecto
- `CLAUDE.md` — naming, layer rules, no raw fetch, hooks con useCallback, @/ imports

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EditEmployeeModal.tsx` (358 líneas): ya tiene `AnimatePresence + MotionDiv` cargados, dark mode, `max-h-[70vh] overflow-y-auto`. La sección de aliases se añade dentro del scroll existente.
- `toast` de sonner: ya importado en el proyecto para feedback de acciones
- Patrón `border-t border-zinc-200 dark:border-zinc-800 pt-4`: separador estándar para secciones dentro del modal

### Established Patterns
- Services: funciones exportadas que llaman a `http.get/post/delete`, en `src/frontend/src/services/`
- Hooks: `use<Domain>.ts`, retorna `{ data, isLoading, error, ...actions }`, acciones en `useCallback`
- Componentes: `React.FC<PropsInterface>`, props interface en el mismo archivo, `@/` aliases

### Integration Points
- `EditEmployeeModal` recibe `employee` (con `id`) y `isOpen` — el hook de aliases se activa con `isOpen && employee.id`
- El nuevo `clockAliasService.ts` se registra en `src/frontend/src/services/index.ts`

</code_context>

<specifics>
## Specific Ideas

- El input de agregar alias puede usar `onKeyDown` para detectar Enter además del botón
- Chips con estilo similar a los badges de estado existentes en el proyecto (zinc/green palette)
- La sección debe funcionar independientemente del formulario principal — agregar/eliminar aliases no requiere guardar el formulario

</specifics>

<deferred>
## Deferred Ideas

- Bulk import de aliases (CSV) — fuera de scope, v1.6 si se necesita
- Pre-población de aliases desde importaciones históricas — fuera de scope, v1.6
- Aliases en página standalone `/employee/:id/aliases` — no requerido, modal suficiente

</deferred>

---

*Phase: 42-frontend-gestion-aliases-marcas*
*Context gathered: 2026-04-17*
