# Phase 39: Frontend Fix Employee Edit Position Selector - Research

**Researched:** 2026-04-17
**Domain:** React/Next.js frontend component bug fix
**Confidence:** HIGH

## Summary

This is a straightforward bug fix phase addressing a visual display issue in the employee position selector. The root cause is that `AddEmployeeModal.tsx` does not pass the `selectedLabel` prop to the Select component, causing the position ID to display instead of the position name. Additionally, there are type safety issues in the ID comparison logic across all three files.

**Primary recommendation:** Add `selectedLabel` prop using `String()` comparison pattern to all three files (AddEmployeeModal, EditEmployeeModal, EditEmployeePage).

## User Constraints

There is no CONTEXT.md file for this phase. All implementation decisions are within the agent's discretion.

## Standard Stack

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x (latest) | UI framework | Required by Next.js 15 |
| Next.js | 15.x | Full-stack framework | Project standard |
| @radix-ui/react-select | ^2.1.0 | Select component | UI primitive for accessibility |
| react-hook-form | ^7.53.x | Form handling | Project standard |
| zod | ^3.23.x | Schema validation | Project standard |
| framer-motion | ^11.x | Animations | Project standard for modals |

**Installation:** No new packages required - all dependencies already in use.

## Architecture Patterns

### Recommended Fix Pattern

The Select component from `@/components/ui/Select.tsx` expects a `selectedLabel` prop to display the human-readable label instead of the raw value:

```tsx
// In AddEmployeeModal.tsx - ADD missing selectedLabel
<Select
  value={field.value || ''}
  selectedLabel={positionOptions.find(p => String(p.id) === String(field.value))?.name}
  onValueChange={field.onChange}
  disabled={positionsLoading}
  placeholder={positionsLoading ? 'Cargando posiciones...' : 'Seleccionar posición'}
  className="..."
>
```

### Type-Safe ID Comparison

The position IDs come from the backend as numbers, but the form field can be string or number. Always use `String()` coercion for robust comparison:

```typescript
// WRONG - fails when types don't match
selectedLabel={positionOptions.find(p => p.id === field.value)?.name}

// CORRECT - handles string/number mismatch
selectedLabel={positionOptions.find(p => String(p.id) === String(field.value))?.name}
```

### Project Structure
```
src/frontend/src/
├── components/
│   ├── AddEmployeeModal.tsx      # BUG: missing selectedLabel
│   ├── EditEmployeeModal.tsx     # Has selectedLabel but unsafe comparison
│   └── ui/Select.tsx             # Already supports selectedLabel prop
├── hooks/
│   ├── usePositions.ts           # Cache invalidation logic
│   └── useEmployeeList.ts        # Refresh synchronization
└── app/pages/employee/edit/[id]/page.tsx  # Has selectedLabel but unsafe comparison
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Select dropdown | Custom dropdown with divs | Radix UI Select | Accessibility, keyboard nav, proper ARIA |
| Cache invalidation | Manual state management | `invalidateCache()` from sessionCache | Already implemented in usePositions |
| ID comparison | Strict equality (`===`) | `String()` coercion | Robust against API type inconsistencies |

## Common Pitfalls

### Pitfall 1: ID Type Mismatch
**What goes wrong:** Position IDs from API are numbers, but form state may store strings. Direct equality (`===`) fails silently.
**Why it happens:** Backend returns `position.id` as number, but react-hook-form may coerce to string.
**How to avoid:** Always use `String(p.id) === String(field.value)` pattern.
**Warning signs:** selectedLabel shows `undefined` or selector shows ID instead of name.

### Pitfall 2: Missing selectedLabel Prop
**What goes wrong:** Select component displays the raw value (position ID) instead of the label.
**Why it happens:** Developer forgot to pass the `selectedLabel` prop to the Select component.
**How to avoid:** Ensure all Select components with `value` also pass `selectedLabel`.
**Warning signs:** "123" displayed instead of "Gerente" in selector.

### Pitfall 3: Cache Not Invalidated After Position Update
**What goes wrong:** Employee forms show stale position list after creating/updating a position.
**Why it happens:** Cache key not invalidated before refetch.
**How to avoid:** Call `invalidateCache(CACHE_KEY)` before any manual refetch in usePositions.
**Warning signs:** New position not appearing in dropdown until page refresh.

## Code Examples

### Correct Select Implementation (AddEmployeeModal)

```tsx
// Source: This codebase - based on existing EditEmployeeModal pattern
<Controller
  name="employee_position_id"
  control={control}
  render={({ field }) => (
    <Select
      value={field.value || ''}
      selectedLabel={positionOptions.find(p => String(p.id) === String(field.value))?.name}
      onValueChange={field.onChange}
      disabled={positionsLoading}
      placeholder={positionsLoading ? 'Cargando posiciones...' : 'Seleccionar posición'}
      className="..."
    >
      {positionOptions.map((position) => (
        <SelectItem key={position.id} value={position.id}>
          {position.name} - ₡{position.salary.toLocaleString()}
        </SelectItem>
      ))}
    </Select>
  )}
/>
```

### Fix for usePositions refetch

```typescript
// Source: This codebase - extending existing pattern
const refetch = useCallback(async () => {
  invalidateCache(CACHE_KEY);  // Ensure fresh fetch
  await fetchAll();
}, [fetchAll]);
```

## State of the Art

This is a bug fix phase - no SOTA changes. The Select component pattern using Radix UI is current and appropriate.

**Existing infrastructure:**
- AddEmployeeModal: Missing selectedLabel (BUG)
- EditEmployeeModal: Has selectedLabel but unsafe comparison (BUG)
- EditEmployeePage: Has selectedLabel but unsafe comparison (BUG)
- usePositions: Already has cache invalidation in create/update/remove
- useEmployeeList: Already has refreshPositions exported

## Open Questions

1. **Why is AddEmployeeModal missing selectedLabel?**
   - Likely an oversight during initial implementation
   - No technical reason - should be added

2. **Should refreshEmployees also refresh positions?**
   - Plan 2 suggests this, but it's optional enhancement
   - Not strictly required for the selector display fix
   - Can be added as polish if time permits

## Environment Availability

> Step 2.6: SKIPPED (no external dependencies - pure code fix)

This phase involves only in-code modifications to existing React components. No external tools, services, or runtimes required beyond the existing development environment.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (from project config) |
| Config file | vitest.config.ts |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|---------------|
| UX-03 | Position selector displays name instead of ID | Visual/Manual | N/A (UI verification) | N/A |

### Wave 0 Gaps
- No test files required - this is a UI bug fix that requires visual verification
- Automated tests cannot verify the display label without complex DOM testing
- Manual verification recommended: Open AddEmployeeModal and verify position name shows

## Sources

### Primary (HIGH confidence)
- src/frontend/src/components/ui/Select.tsx - Confirm selectedLabel prop exists
- src/frontend/src/components/AddEmployeeModal.tsx - Identify missing prop
- src/frontend/src/components/EditEmployeeModal.tsx - Identify unsafe comparison

### Secondary (MEDIUM confidence)
- src/frontend/src/hooks/usePositions.ts - Verify cache invalidation pattern
- src/frontend/src/hooks/useEmployeeList.ts - Verify refresh pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are project standard and already in use
- Architecture: HIGH - Simple bug fix with clear pattern from existing code
- Pitfalls: HIGH - Type safety issues are well-documented in this codebase

**Research date:** 2026-04-17
**Valid until:** 90 days (stable pattern - no fast-moving changes expected)