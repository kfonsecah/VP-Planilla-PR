---
status: investigating
trigger: "Diagnose root causes of 5 UAT issues found during Phase 13 verification"
created: 2026-04-01T00:00:00Z
updated: 2026-04-01T00:00:00Z
---

## Current Focus

hypothesis: All 5 issues identified with root causes. Compiling final diagnosis.
test: N/A - diagnosis complete
expecting: Return structured root cause analysis
next_action: Return diagnosis report

## Symptoms

expected: 1. Toast notifications (sonner) show on success/error. 2. Skeleton loading rows appear during data fetch. 3. Error banner shows when backend unavailable (not empty state). 4. Labor event assignment succeeds with valid labor_event_id. 5. Success messages use toast, not system modal.
actual: 1. System modal with "Entendido" button shows instead of toast. 2. Text "Cargando posiciones..." shows instead of skeleton rows. 3. "No hay posiciones registradas" shows instead of error banner. 4. `labor_event_id: undefined` in Prisma create call. 5. Same as issue 1.
errors: ["labor_event_id: undefined"]
reproduction: See individual issues below
started: Phase 13 verification

## Eliminated

- hypothesis: Toaster component not mounted in app layout
  evidence: Toaster IS mounted in src/frontend/src/layouts/main.tsx line 87-99, inside ThemeProvider/AuthProvider. It is correctly rendered.
  timestamp: 2026-04-01T00:00:00Z

## Evidence

- timestamp: 2026-04-01T00:00:00Z
  checked: src/frontend/src/layouts/main.tsx
  found: Toaster from sonner is mounted at line 87-99, inside ClientLayout → ThemeProvider → after InnerLayout. It IS present and should render.
  implication: Toast infrastructure is correctly set up. The problem is not missing Toaster.

- timestamp: 2026-04-01T00:00:00Z
  checked: src/frontend/src/hooks/useModal.tsx
  found: useModal hook provides showSuccess/showError methods that open a custom Modal component (not toast). showSuccess uses confirmText '¡Perfecto!', showError uses confirmText 'Entendido'.
  implication: Pages using useModal().showSuccess() will show a modal dialog, NOT a sonner toast.

- timestamp: 2026-04-01T00:00:00Z
  checked: src/frontend/src/app/pages/positions/list/page.tsx lines 33, 45, 50, 58, 61
  found: All success/error handling uses modal.showSuccess() and modal.showError() from useModal hook, NOT toast.success/toast.error.
  implication: Positions page will show system modal with "Entendido" button, not toast notifications.

- timestamp: 2026-04-01T00:00:00Z
  checked: src/frontend/src/app/pages/bonuses/list/page.tsx lines 41, 44, 48, 56, 59
  found: Same pattern - uses modal.showSuccess() and modal.showError() from useModal hook.
  implication: Bonuses page also shows system modal, not toast notifications.

- timestamp: 2026-04-01T00:00:00Z
  checked: src/frontend/src/hooks/usePositions.ts lines 25-31, 34-41, 43-49
  found: create/update/remove methods set setIsLoading(true) during mutation operations.
  implication: isLoading becomes true during create/update/delete, triggering skeleton display in Table component even when data already exists.

- timestamp: 2026-04-01T00:00:00Z
  checked: src/frontend/src/components/ui/Table.tsx lines 72-101
  found: Table renders skeleton when isLoading=true (line 72), but this check comes BEFORE the data rendering (line 103). If isLoading=true AND data exists, skeleton still shows.
  implication: During CRUD operations, users see skeleton rows instead of existing data.

- timestamp: 2026-04-01T00:00:00Z
  checked: src/frontend/src/components/ui/Table.tsx lines 44-69
  found: Table renders error state when error prop is truthy (line 44). Error state takes priority over loading (checked first).
  implication: If error is set, error banner should show. But if error is null/empty and data is empty, empty state shows instead.

- timestamp: 2026-04-01T00:00:00Z
  checked: src/frontend/src/hooks/usePositions.ts lines 10-21
  found: fetchAll sets setError with error message on catch. But if the error message is empty string or the API returns empty array on failure, error might not be set properly.
  implication: If backend is unavailable and error message is somehow falsy, Table shows empty state instead of error.

- timestamp: 2026-04-01T00:00:00Z
  checked: src/frontend/src/services/laborEventsService.ts lines 42-48
  found: assignLaborEventToEmployee sends payload with `labor_event_ids: [data.labor_event_id]` (plural, array).
  implication: Frontend sends labor_event_ids (plural) as array.

- timestamp: 2026-04-01T00:00:00Z
  checked: src/backend/src/controller/LaborEventsController.ts lines 118-119
  found: Controller destructures `labor_event_id` (singular) from req.body. Frontend sends `labor_event_ids` (plural).
  implication: labor_event_id is undefined because frontend sends labor_event_ids. This undefined value flows to Prisma create call.

- timestamp: 2026-04-01T00:00:00Z
  checked: src/backend/src/service/LaborEventsService.ts lines 150-158
  found: Prisma create uses data.labor_event_id which is undefined from controller.
  implication: Prisma throws error because labor_event_id is required but undefined.

## Resolution

root_cause: ""
fix: ""
verification: ""
files_changed: []
