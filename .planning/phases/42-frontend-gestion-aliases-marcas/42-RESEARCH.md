# Phase 42: Frontend — Gestión de Aliases de Marcas - Research

**Researched:** 2026-04-18
**Domain:** React/Next.js frontend component integration with REST API
**Confidence:** HIGH

## Summary

This phase implements a clock alias management section inside the existing `EditEmployeeModal.tsx`. The integration requires creating a frontend service, hook, and UI section following established project patterns. All backend endpoints already exist from Phase 41.

**Primary recommendation:** Create `clockAliasService.ts` + `useClockAliases.ts` hook, then embed inline alias chips section in `EditEmployeeModal.tsx` before line 339, using optimistic UI for delete operations.

---

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** La sección de aliases va dentro de `EditEmployeeModal.tsx`, **no** en la página `/employee/edit/[id]/page.tsx` ni en `EmployeeProfileModal.tsx`.
- **D-02:** La sección se inserta entre el último grupo de campos del formulario (Género) y los botones de acción (Cancelar/Guardar). Punto exacto: antes del `<div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">` que contiene los botones.
- **D-03:** Los aliases se muestran como **tags/chips** compactos. Cada chip muestra el alias_value y un botón X para eliminar.
- **D-05:** Input inline + botón "Agregar" — sin modal adicional. El usuario escribe el alias en un `<input>` dentro de la misma sección y presiona "Agregar" (o Enter).
- **D-07:** Eliminación directa al hacer click en X del chip. Sin modal de confirmación. Toast de éxito/error como feedback.

### the agent's Discretion
- Nombre del componente extraído (si se extrae): sugiera `ClockAliasSection`
- Manejo de error de duplicado: mostrar inline bajo el input (el backend retorna 409 o error de unique constraint)
- Estado de carga: skeleton o spinner minimalista mientras carga la lista de aliases

### Deferred Ideas (OUT OF SCOPE)
- Bulk import de aliases (CSV) — fuera de scope
- Pre-población de aliases desde importaciones históricas — fuera de scope
- Aliases en página standalone — no requerido

</user_constraints>

---

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-42-01 | Sección de aliases dentro de EditEmployeeModal.tsx | Target file identified: EditEmployeeModal.tsx line 339 insertion point |
| REQ-42-02 | Chips compactos con botón X para eliminar | D-03, D-07 - Chip pattern from project UI |
| REQ-42-03 | Input inline + botón Agregar sin modal | D-05 - Inline pattern from AddClockLogModal |
| REQ-42-04 | Optimistic UI o re-fetch post-delete | D-08 - State management pattern |

</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|------------|
| Next.js (app router) | latest | Framework | Existing project foundation |
| React | 18.x | UI library | Existing |
| framer-motion | ^11.x | Animations | Already lazy-loaded in EditEmployeeModal |
| sonner | ^1.x | Toast notifications | Already imported in project |

### Patterns Used
| Pattern | Location | Purpose |
|---------|---------|---------|
| `http.ts` service layer | `src/frontend/src/services/http.ts` | Central HTTP client - NEVER use raw fetch |
| Service pattern | `clockLogsService.ts` | GET/POST/DELETE methods |
| Hook pattern | `useEmployeeEdit.ts` | `useCallback`, return `{ data, isLoading, error, ...actions }` |
| Component pattern | `EditEmployeeModal.tsx` | React.FC with props interface |

---

## Architecture Patterns

### Recommended Project Structure
```
src/frontend/src/
├── services/
│   └── clockAliasService.ts      # NEW - GET/POST/DELETE aliases
├── hooks/
│   └── useClockAliases.ts     # NEW - State management for aliases
└── components/
    └── EditEmployeeModal.tsx  # MODIFIED - Insert alias section ~line 339
```

### Service Pattern: clockAliasService.ts
Follow `clockLogsService.ts` pattern:

```typescript
// Source: clockLogsService.ts (lines 72-122)
export const ClockAliasService = {
  async getAliases(employeeId: string) {
    const response = await http.get(`/employees/${employeeId}/aliases`);
    return response ?? [];
  },

  async createAlias(employeeId: string, aliasName: string) {
    return await http.post(`/employees/${employeeId}/aliases`, { alias_name: aliasName });
  },

  async deleteAlias(employeeId: string, aliasId: number) {
    return await http.delete(`/employees/${employeeId}/aliases/${aliasId}`);
  },
};
```

### Hook Pattern: useClockAliases.ts
Follow `useEmployeeEdit.ts` pattern:

```typescript
// Source: useEmployeeEdit.ts (structure)
export const useClockAliases = (employeeId: string) => {
  const [aliases, setAliases] = useState<ClockAlias[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAliases = useCallback(async () => {
    if (!employeeId) return;
    setIsLoading(true);
    try {
      const data = await ClockAliasService.getAliases(employeeId);
      setAliases(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const addAlias = useCallback(async (name: string) => {
    // POST + optimistic update or re-fetch
  }, [employeeId]);

  const removeAlias = useCallback(async (aliasId: number) => {
    // DELETE + optimistic update
  }, [employeeId]);

  return { aliases, isLoading, error, fetchAliases, addAlias, removeAlias };
};
```

### Chip/Tag UI Pattern
Build inline in EditEmployeeModal - **do NOT extract to separate component** (too small):

```typescript
// Inline chip structure (D-03 locked)
<div className="flex flex-wrap gap-2">
  {aliases.map((alias) => (
    <span
      key={alias.id}
      className="inline-flex items-center gap-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm text-zinc-700 dark:text-zinc-300"
    >
      {alias.name}
      <button
        onClick={() => removeAlias(alias.id)}
        className="hover:text-red-500"
      >
        ×
      </button>
    </span>
  ))}
</div>
```

### Inline Input + Button Pattern
Follow from existing inline patterns:

```typescript
// Source: AddClockLogModal.tsx (lines 196-240) - inline form pattern
<div className="flex gap-2">
  <input
    value={newAlias}
    onChange={(e) => setNewAlias(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
    placeholder="Nuevo alias..."
    className="flex-1 px-3 py-2 border..."
  />
  <button
    onClick={handleAdd}
    disabled={!newAlias.trim()}
    className="px-4 py-2 bg-green-600..."
  >
    Agregar
  </button>
</div>
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP client | Raw `fetch()` calls | `http.ts` service layer | Already handles auth, refresh, error parsing |
| Toast notifications | Custom alert components | `sonner` toast | Already imported in project |
| Modal framework | Custom backdrop + animation | `framer-motion` AnimatePresence + MotionDiv | Already lazy-loaded in EditEmployeeModal |
| Animation for chips | `framer-motion` AnimatePresence | CSS transition o sin animación | Chips son inline en EditEmployeeModal — mantener simple per CONTEXT.md |

**Key insight:** The project has established patterns for all common operations. Always copy from existing components rather than building new patterns.

---

## Common Pitfalls

### Pitfall 1: Forgetting to Register Service in Index
**What goes wrong:** New service not exported, downstream components fail to import.
**How to avoid:** Add export to `src/frontend/src/services/index.ts` after creating service.

### Pitfall 2: Missing useCallback in Hook Actions
**What goes wrong:** ESLint warnings, potential stale closures in component.
**How to avoid:** Wrap all async actions in `useCallback` per project convention.

### Pitfall 3: Not Handling Empty/Null employeeId
**What goes wrong:** Service calls `/employees/undefined/aliases`.
**How to avoid:** Guard all API calls with `if (!employeeId) return`.

### Pitfall 4: Duplicate Alias Error Not Handled
**What goes wrong:** Backend returns 409 on duplicate, UI shows generic error.
**How to avoid:** Handle 409 specifically, show inline error message below input (per D-04 discretion).

### Pitfall 5: Not Using Optimistic UI
**What goes wrong:** Wait for full re-fetch after every add/delete feels slow.
**How to avoid:** Update local state immediately, fallback to re-fetch on error only.

### Pitfall 6: POST y DELETE requieren rol `admin`
**What goes wrong:** Un usuario sin rol `admin` recibe 403 al intentar agregar o eliminar aliases — la UI no lo maneja y queda sin feedback.
**How to avoid:** Verificar que el usuario autenticado tenga rol `admin` antes de renderizar el input de agregar y los botones X. El hook puede exponer `canManage` basado en el rol del token.

---

## Code Examples

### Pattern Reference: EditEmployeeModal Section Insertion

**Target location:** `EditEmployeeModal.tsx` line 337-338 (before the border-t div at line 339)

```typescript
// Insert BEFORE line 339:
// Currently: <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">

<div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
  <h3 className="text-base font-medium text-zinc-700 dark:text-zinc-100 mb-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
    Aliases de Reloj
  </h3>
  
  {/* Aliases list as chips */}
  <div className="flex flex-wrap gap-2 mb-3">
    {aliases.map((alias) => (
      <span key={alias.id} className="chip-styles">
        {alias.name}
        <button onClick={() => removeAlias(alias.id)}>×</button>
      </span>
    ))}
  </div>

  {/* Inline input + button */}
  <div className="flex gap-2">
    <input
      value={newAlias}
      onChange={(e) => setNewAlias(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && handleAddAlias()}
      placeholder="Nuevo alias..."
      className="input-styles"
    />
    <button onClick={handleAddAlias} className="btn-primary">
      Agregar
    </button>
  </div>
</div>

<!-- THEN the existing border-t div continues -->
<div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
```

---

## Backend API Reference

All endpoints already implemented in Phase 41 and ready for frontend consumption:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/employees/:id/aliases` | GET | Fetch all aliases for employee |
| `/api/employees/:id/aliases` | POST | Create new alias (`{ alias_name }` body) |
| `/api/employees/:id/aliases/:aliasId` | DELETE | Remove alias by ID |

**Response codes:**
- 201: Created success
- 409: Duplicate alias (unique constraint)
- 404: Employee not found

---

## State of the Art

### Current Implementation Status
- **Backend (Phase 41):** COMPLETE - ClockAliasRoute, model, service, controller all implemented
- **Frontend (Phase 42):** IN PROGRESS - Service + hook + UI section needed

### What's Different from Previous Thinking
La sección de chips es inline en EditEmployeeModal — **no usar AnimatePresence**. Mantener simple: chips sin animación de entrada/salida. Esto es consistente con D-03/D-07 del CONTEXT.md.

---

## Open Questions

1. **Should chips use AnimatePresence?**
   - D-07 says "direct delete without modal" - doesn't specify animation
   - Discretion: Add for polish if easy, otherwise direct DOM remove
   - **Recommendation:** Keep simple, add if time permits

2. **Duplicate handling location?**
   - D-04 says "inline under input"
   - **Recommendation:** Use `<p className="text-sm text-red-600 mt-1">` below input field

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Next.js | Frontend build | ✓ | 14.x+ | — |
| framer-motion | Animations | ✓ | ^11.x | — |
| sonner | Toasts | ✓ | ^1.x | Use console.error |
| http.ts | API calls | ✓ | — | — |

**No external dependencies needed.**

---

## Validation Architecture

> Phase has nyquist_validation enabled (default). Include test coverage mapping.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + React Testing Library |
| Config file | `src/frontend/jest.config.js` |
| Quick run command | `npm test -- --watchAll=false` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|---------|----------|-----------|-------------------|-------------|
| REQ-42-01 | Alias section renders in modal | Component | Test file `clockAliasSection.test.tsx` | ❌ Wave 0 |
| REQ-42-02 | Chips display + delete button | Unit | `clockAliasService.test.ts` | ❌ Wave 0 |
| REQ-42-03 | Add alias via input | Integration | Add alias flow test | ❌ Wave 0 |
| REQ-42-04 | Delete triggers optimistic update | Unit | State update test | ❌ Wave 0 |

### Wave 0 Gaps
- [ ] `src/frontend/src/services/__tests__/clockAliasService.test.ts` — covers service methods
- [ ] `src/frontend/src/hooks/__tests__/useClockAliases.test.ts` — covers hook state
- [ ] Test install: `npm install vitest @testing-library/react` — if not present

---

## Sources

### Primary (HIGH confidence)
- `src/frontend/src/services/clockLogsService.ts` — service pattern reference
- `src/frontend/src/hooks/useEmployeeEdit.ts` — hook pattern reference
- `src/frontend/src/components/EditEmployeeModal.tsx` — target file, insertion point confirmed
- `src/backend/src/routes/ClockAliasRoute.ts` — backend API endpoints (Phase 41)

### Secondary (MEDIUM confidence)
- `src/frontend/src/components/VoidClockLogModal.tsx` — chip/badge UI reference
- `src/frontend/src/components/AddClockLogModal.tsx` — inline input pattern
- `src/frontend/src/services/http.ts` — HTTP client pattern

### Tertiary (LOW confidence)
- None needed — all patterns found in project

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project
- Architecture: HIGH - Pattern match from existing code
- Pitfalls: HIGH - All pitfalls documented from project experience

**Research date:** 2026-04-18
**Valid until:** 30 days (stable phase - only UI integration)