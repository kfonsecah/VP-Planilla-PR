---
phase: 63-panel-admin-parametros-legales
reviewed: 2026-04-29T00:00:00Z
depth: standard
files_reviewed: 14
files_reviewed_list:
  - src/backend/src/controller/LegalParamController.ts
  - src/backend/src/routes/LegalParamRoute.ts
  - src/backend/src/service/LegalParamService.ts
  - src/frontend/src/app/pages/configuracion/page.tsx
  - src/frontend/src/app/pages/configuracion/parametros-legales/page.tsx
  - src/frontend/src/app/pages/payroll/wizard/page.tsx
  - src/frontend/src/components/FeatureFlagToggle.tsx
  - src/frontend/src/components/LegalParamCard.tsx
  - src/frontend/src/components/LegalParamDrawer.tsx
  - src/frontend/src/components/LegalParamHistoryModal.tsx
  - src/frontend/src/components/MinWageBulkUpdateModal.tsx
  - src/frontend/src/components/SidebarItem.tsx
  - src/frontend/src/components/ui/Sidebar.tsx
  - src/frontend/src/services/legalParamService.ts
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 63: Code Review Report

**Reviewed:** 2026-04-29
**Depth:** standard
**Files Reviewed:** 14
**Status:** issues_found

## Summary

Phase 63 implements a Legal Parameters Admin Dashboard with backend endpoints (`GET /legal-params/active`, `POST /legal-params/min-wages/bulk`) and a full frontend UI at `/pages/configuracion/parametros-legales`. The architecture is sound: insert-only audit trail, password confirmation for critical params, role-based access, and `$transaction` wrapping of writes.

One critical bug was found: a false-positive authorization bypass in `upsertParam` and `bulkUpsertMinWages` controllers — a user with `id = 0` or a JWT whose `user.id` is falsy passes the auth check. Five warnings cover a service type-mismatch consumed by the history modal, an unvalidated `value` field in the bulk update path, an uncontrolled loading race on the parametros-legales page, the `loadParams` missing from the `useEffect` dependency array, and the `LegalParamService.getParamHistory` return-type mismatch with its consumer. Four info items cover minor quality concerns.

---

## Critical Issues

### CR-01: Auth check allows user with id=0 to bypass authorization

**File:** `src/backend/src/controller/LegalParamController.ts:95-98` (same pattern at lines 141-145 and 183-186)

**Issue:** The guard converts `req.user?.id` to string with `String(... ?? '')`, then checks `if (!userId)`. `String(0)` evaluates to `"0"` which is truthy — so the guard passes correctly for numeric id=0. However if `req.user` is present but `req.user.id` is `undefined` or `null`, the expression produces `String('')` which is `""` — an empty string — and `!""` is `true`, so it correctly rejects. **But** `String(0 ?? '')` is `"0"`, which is truthy, so a user whose `id` is the integer `0` (if the DB allows it) would pass. More importantly, the actual downstream call to `AuthService.verifyPasswordForUser(userId, ...)` receives `"0"`, and `parseInt("0", 10)` in the audit log write at `LegalParamService._upsertParamTx:256` becomes `0` — this is a valid but unintended user ID that could silently create audit log entries attributed to user 0. The real risk is if the `adminOnly` middleware at the route layer already rejects non-admins — it does — but the inner `userId` guard was intended to catch a missing user identity after JWT verification. The dual cast pattern makes this fragile.

**Fix:** Use a strict check against the raw numeric id before stringifying:
```typescript
// In upsertParam, bulkUpsertMinWages, patchParam controllers:
const rawId = (req as any).user?.id;
if (rawId === undefined || rawId === null) {
  res.status(401).json({ success: false, error: 'Unauthorized' });
  return;
}
const userId = String(rawId);
```

---

## Warnings

### WR-01: `getParamHistory` service return type does not match consumer expectation

**File:** `src/frontend/src/services/legalParamService.ts:47-49`

**Issue:** `getParamHistory` is typed as returning `Promise<LegalParam[]>`. However, `http.ts` unwraps `{ success: true, data: [...] }` responses by returning `parsed.data` directly, so the actual resolved value is already the array. The consumer `LegalParamHistoryModal.tsx:26-30` calls `.then((res) => { if (res.success && res.data) { setHistory(res.data); } })` — it expects `{ success: boolean; data: LegalParam[] }`. Because `http.ts` has already stripped the wrapper, `res` is actually a `LegalParam[]`, not an object with `.success` and `.data`. As a result, `res.success` is `undefined` (falsy) and the condition `if (res.success && res.data)` is never true — the history is never populated and the UI always shows "Error al cargar historial".

**Fix:** Update `legalParamService.ts` to declare the raw wrapper type, or update the modal to use the already-unwrapped array:

Option A — fix the service type to match what `http` actually returns, and update the modal:
```typescript
// legalParamService.ts
getParamHistory: async (key: string): Promise<LegalParam[]> => {
  return http.get(`/legal-params/history/${key}`);
},
```
```typescript
// LegalParamHistoryModal.tsx — replace lines 26-32:
.then((data: LegalParam[]) => {
  setHistory(data ?? []);
})
```

Option B — keep the modal logic and fix the service to NOT use `http.get` for history (preserving wrapper), but this contradicts the project's `http.ts` convention. Option A is the correct fix.

### WR-02: Bulk update `value` field is not validated as a finite number before DB write

**File:** `src/backend/src/controller/LegalParamController.ts:148`

**Issue:** The controller validates that `updates` is an array and `validFrom` and `source_decree` are present, but does not validate that each `update.value` is a finite number. If a client sends `{ key: "MIN_WAGE_GENERAL", value: "DROP TABLE..." }` or `NaN`, Prisma will either throw an opaque error or silently coerce. The `bulkUpsertMinWages` service also does not validate individual entry values — it passes them directly to `_upsertParamTx`.

**Fix:** Add per-entry validation in the controller before delegating:
```typescript
for (const update of updates) {
  if (!update.key || typeof update.key !== 'string') {
    res.status(400).json({ success: false, error: 'Each update must have a string key' });
    return;
  }
  const num = Number(update.value);
  if (!isFinite(num) || num < 0) {
    res.status(400).json({ success: false, error: `Invalid value for key ${update.key}: must be a non-negative finite number` });
    return;
  }
}
```

### WR-03: `loadParams` is called from `useEffect` but not listed in the dependency array

**File:** `src/frontend/src/app/pages/configuracion/parametros-legales/page.tsx:53-61`

**Issue:** `loadParams` is defined as a plain `async` function (not wrapped in `useCallback`) inside the component body, so it is re-created on every render. The `useEffect` at line 53 has `[user, router]` as dependencies. React's exhaustive-deps rule would flag `loadParams` as a missing dependency. While the current behavior is not broken (the effect only re-runs when `user` or `router` changes), any future refactor relying on lint enforcement will silently skip re-runs. Additionally, `loadParams` is exposed via the `onClick` of the "Reintentar" button at line 79 — this is fine — but it captures stale closures from the render where it was defined, which can cause issues if `user` changes mid-load.

**Fix:** Wrap `loadParams` in `useCallback` and add it to the dependency array:
```typescript
const loadParams = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await LegalParamService.getActiveParams();
    setParams(data || []);
  } catch (err: unknown) {
    console.error('Error loading params:', err);
    setError('Error al cargar los parámetros legales');
  } finally {
    setLoading(false);
  }
}, []); // no deps needed — does not close over any state

useEffect(() => {
  if (!user) return;
  if (user.role !== 'admin' && user.role !== 'payroll_manager') {
    router.push('/pages/main');
    return;
  }
  loadParams();
}, [user, router, loadParams]);
```

### WR-04: `LegalParamDrawer` does not reset form when `param` changes while drawer is already open

**File:** `src/frontend/src/components/LegalParamDrawer.tsx:48-59`

**Issue:** The `useEffect` resets the form when `isOpen && param` changes. However, the drawer is closed and re-opened each time (`setIsDrawerOpen(false)` + `setSelectedParam(null)` with a 300ms delay), so this mostly works. But if the user rapidly opens the drawer for param A, then for param B before the 300ms timeout fires, `isOpen` remains `true` and only `param` changes — the `useEffect` dependency `[isOpen, param, reset]` will trigger on `param` change, which is correct. This is actually safe as coded. However, the `pendingData` state is **not reset** on re-open if only `param` changes (`setPendingData(null)` is only called when `isOpen && param` is truthy, which it is — so this is also fine). No actual bug here, but the 300ms `setTimeout` dance in the parent (page.tsx line 177) is fragile. Flagging as a warning because a stale `pendingData` from a prior critical-param interaction could theoretically be submitted to a different param.

**Specific risk:** If a user: (1) opens drawer for a critical param → gets to password modal → clicks outside drawer (triggers `onClose`) → `setIsConfirming` is NOT reset in `onClose` — only in the `useEffect`. If `onClose` fires before the effect re-runs, and the user quickly reopens the drawer for a non-critical param, `isConfirming` may still be `true` from the prior session and the `PasswordConfirmModal` could appear for a non-critical param.

**Fix:** Reset all modal state in `onClose` as well:
```typescript
// In LegalParamDrawer, add to onClose handling or expose a resetState util:
// Ensure isConfirming is also reset on close:
const handleClose = () => {
  setIsConfirming(false);
  setPendingData(null);
  setPasswordError(undefined);
  onClose();
};
// Use handleClose in place of onClose on the backdrop and X button.
```

### WR-05: Route ordering — `/legal-params/active` must be registered before `/legal-params/:key` would shadow it, but the current order is correct; the risk is in `PATCH /legal-params/:key` vs `POST /legal-params/min-wages/bulk`

**File:** `src/backend/src/routes/LegalParamRoute.ts:24-28`

**Issue:** `POST /legal-params/min-wages/bulk` is registered before `POST /legal-params` (line 207). In Express, route matching is order-dependent. The path `/legal-params/min-wages/bulk` would NOT be matched by `POST /legal-params` since the path is different. However, `PATCH /legal-params/:key` at line 257 with `:key = "min-wages"` could match a `PATCH /legal-params/min-wages/bulk` if Express does partial matching — but it does not for exact path segments. The true issue is that `GET /legal-params/active` and `GET /legal-params/all` and `GET /legal-params/history/:key` are registered BEFORE `GET /legal-params` (line 58-62), which is correct. But `GET /legal-params/category/:category` at line 146 is registered AFTER `GET /legal-params` — for a GET to `/legal-params/category/CCSS`, Express would first test `/legal-params` which requires a `key` query param, find no match in the route handler's validation (it would match the path since there's no `:param` in `/legal-params`), and then... actually `/legal-params/category/CCSS` does NOT match the router pattern `/legal-params` (exact path). So the ordering is safe for Express path matching. No runtime routing bug, but the inconsistent registration order (some specific routes before base, some after) creates maintenance risk.

**Actual risk:** The `GET /legal-params/active` route is registered before `GET /legal-params`. This is correct and necessary because Express would never match `GET /legal-params/active` against `GET /legal-params` (different path). No bug, but worth noting as a pattern to preserve for future route additions.

**True warning:** `PATCH /legal-params/:key` will match `PATCH /legal-params/min-wages` — meaning there is no guard against patching a key literally named "min-wages" via PATCH, which would skip the `source_decree` requirement enforced in the bulk endpoint. This is an authorization logic gap, not a routing bug.

**Fix:** This is low risk given the frontend never calls `PATCH /legal-params/min-wages` directly. Document the gap:
```typescript
// In patchParam controller, consider adding:
if (key === 'min-wages') {
  res.status(400).json({ success: false, error: 'Use the bulk endpoint for min-wage updates' });
  return;
}
```

---

## Info

### IN-01: `(req as any).user` pattern repeated in three controller methods

**File:** `src/backend/src/controller/LegalParamController.ts:95, 141, 183`

**Issue:** The `(req as any).user` pattern suppresses TypeScript for the authenticated user. The project already has `AuthMiddleware` that sets `req.user` — the `Request` type should be augmented to include it. This is a known pattern in the codebase (likely pre-existing), but each new controller that copies it increases the surface area of the `any` cast.

**Fix:** Add a type augmentation once in `src/backend/src/types/express.d.ts`:
```typescript
declare namespace Express {
  interface Request {
    user?: { id: number | string; role: string };
  }
}
```
Then remove the `as any` cast from all controllers.

### IN-02: `console.log` debug statement in `http.ts` always runs in production browser builds

**File:** `src/frontend/src/services/http.ts:9`

**Issue:** `console.log('[http] API_BASE =', API_BASE)` fires on every page load in the browser. This leaks the internal API base URL to the browser console in production. It is guarded by `typeof window !== 'undefined'` (SSR safe) but not by a `NODE_ENV` check.

**Fix:**
```typescript
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('[http] API_BASE =', API_BASE);
}
```

### IN-03: Magic number `1529.62` hardcoded as min wage fallback

**File:** `src/backend/src/service/LegalParamService.ts:67`

**Issue:** `return 1529.62;` is a hardcoded fallback for `GLOBAL_MIN_WAGE_RATE`. This value will silently become incorrect as legal rates change. There is no constant or comment linking it to a specific legal instrument.

**Fix:** Extract to a named constant with a comment:
```typescript
/** Costa Rica reference hourly minimum wage (Decreto N° XXXX, effective 2026-01-01). Update when new decree issues. */
const FALLBACK_GLOBAL_MIN_WAGE_RATE = 1529.62;
```

### IN-04: Commented-out `TODO` in `LegalParamService.getParamSetAtDate`

**File:** `src/backend/src/service/LegalParamService.ts:32-33`

**Issue:** Two `// TODO: Phase 66` comments document that `regularHoursPerDay: 8` and `regularHoursPerWeek: 48` are hardcoded pending a future phase. This is tracked, but the hardcoded values will silently override any `REGULAR_HOURS_*` keys that may already exist in the DB from the legal params table, creating a potential inconsistency if Phase 66 is delayed and an admin manually updates those keys.

**Fix:** No code change needed now, but ensure Phase 66 planning references `LegalParamService.getParamSetAtDate:32-33` as the touch point.

---

_Reviewed: 2026-04-29_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
