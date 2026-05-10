# Research: Phase 25 — HTTP Client Layer Enforcement

## Objective
Standardize all frontend API communications by enforcing the usage of `src/frontend/src/services/http.ts`, eliminating direct `fetch` calls and manual error handling in business logic.

## Analysis of `http.ts`
The existing client provides:
- **Automatic Auth**: Handles `Authorization` header and `refresh_token` lifecycle.
- **Error Normalization**: Maps various backend error formats to a structured `ApiError`.
- **Response unwrapping**: Automatically extracts `data` from `{ success, data }` wrappers.
- **Type Safety**: Works well with TypeScript generics.

## Current Bypasses (Violations)

### 1. Services using raw `fetch`
These services bypass the auth-refresh logic and error normalization:
- `src/frontend/src/services/auditLogsService.ts`
- `src/frontend/src/services/branchService.ts`
- `src/frontend/src/services/payrollEmployeesService.ts`

### 2. Utilities using raw `fetch`
- `src/frontend/src/utils/weather.ts`: Uses `fetch` for OpenWeatherMap. 
  - *Decision*: Since it's an external API, it shouldn't use our `http` client which attaches our backend's `Authorization` header and uses our `API_BASE`. However, it should use a standardized external fetcher if we want to satisfy **HTTP-03** strictly.

### 3. Components with manual fetch/refetch logic
- `src/frontend/src/app/pages/clocklogs/list/page.tsx`: Contains `handleFetch`.
- Other pages use `refetch()` from custom hooks; need to verify if those hooks use `http`.

## Strategy for Standardization

### Step 1: Service Refactoring
Migrate non-compliant services to `http`.
Example change for `auditLogsService.ts`:
```typescript
// BEFORE
const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
if (!response.ok) throw new Error(...);
return await response.json();

// AFTER
return await http.get(`audit-logs?${params}`);
```

### Step 2: External API Exception
Explicitly allow (or wrap) external API calls. I propose creating a `src/frontend/src/services/externalHttp.ts` for calls that MUST NOT include our backend tokens, keeping `http.ts` strictly for our internal API.

### Step 3: Verification
Use grep to ensure 0 matches of `fetch(` in `src/frontend/src/services/` (excluding `http.ts` and `externalHttp.ts`).

## Implementation Plan (25-01-PLAN.md)
1. **Refactor Services**: Update `auditLogsService`, `branchService`, `payrollEmployeesService`.
2. **Refactor Utilities**: Address `weather.ts` via `externalHttp`.
3. **Verify Components**: Audit `clocklogs/list/page.tsx` and ensure all hooks use `http`.
4. **Final Audit**: Automated grep check.

---
*Created: 2026-04-10*
