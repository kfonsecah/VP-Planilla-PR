---
phase: 25-http-client-layer-enforcement
reviewed: 2026-04-10T23:45:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/frontend/src/services/auditLogsService.ts
  - src/frontend/src/services/branchService.ts
  - src/frontend/src/services/payrollEmployeesService.ts
  - src/frontend/src/services/externalHttp.ts
  - src/frontend/src/utils/weather.ts
findings:
  critical: 0
  warning: 2
  info: 3
  total: 5
status: issues_found
---

# Phase 25: Code Review Report

**Reviewed:** 2026-04-10T23:45:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

The core objective of Phase 25—enforcing a standard HTTP client layer and preventing direct `fetch()` bypasses—has been successfully implemented. A new `externalHttp` client has been introduced specifically for third-party API calls, ensuring internal authentication tokens are not leaked to external services. The review confirmed that all direct `fetch()` calls are now centralized in the service layer (`http.ts` and `externalHttp.ts`).

However, some logic errors in filter handling and a lack of defensive programming in the weather utility were identified.

## Critical Issues

No critical issues were found. All reviewed files meet basic security standards for token management.

## Warnings

### WR-01: Filter values of `0` are ignored in `getAuditLogs`

**File:** `src/frontend/src/services/auditLogsService.ts:20`
**Issue:** The service uses falsy checks for `limit` and `offset`. If a caller passes `0` (e.g., for `offset`), the parameter will not be appended to the query string.
**Fix:**
```typescript
    if (filters) {
      if (filters.userId !== undefined) queryParams.append('userId', filters.userId.toString());
      if (filters.action) queryParams.append('action', filters.action);
      if (filters.entity) queryParams.append('entity', filters.entity);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.limit !== undefined) queryParams.append('limit', filters.limit.toString());
      if (filters.offset !== undefined) queryParams.append('offset', filters.offset.toString());
    }
```

### WR-02: Potential crash in `useWeather` with API response

**File:** `src/frontend/src/utils/weather.ts:46`
**Issue:** The hook assumes the OpenWeatherMap API always returns a non-empty `weather` array and a `main` object. If the API response is malformed, the application will crash.
**Fix:**
```typescript
        const weatherObj = data.weather?.[0];
        const mainObj = data.main;

        if (weatherObj && mainObj) {
          setWeather({
            description: weatherObj.description,
            temperature: Math.round(mainObj.temp),
            icon: weatherObj.icon,
            city: data.name || forcedCityName || FALLBACK_LOCATION.label,
          });
        } else {
           throw new Error('Malformed weather data');
        }
```

## Info

### IN-01: Hook misplaced in `utils/` directory

**File:** `src/frontend/src/utils/weather.ts`
**Issue:** This file contains a React hook (`useWeather`), but is located in `src/frontend/src/utils/`. The internal comment even suggests it belongs in `src/hooks/`.
**Fix:** Move the file to `src/frontend/src/hooks/useWeather.ts` and update the import in `Header.tsx`.

### IN-02: `externalHttp` header spreading limitation

**File:** `src/frontend/src/services/externalHttp.ts:38`
**Issue:** Spreading `options.headers` assumes it is a plain object. If a `Headers` instance is passed, it will not be spread correctly.
**Fix:** Use `new Headers(options.headers)` to merge headers safely.

### IN-03: Security Hardening: Explicitly strip tokens in `externalHttp`

**File:** `src/frontend/src/services/externalHttp.ts`
**Issue:** While `externalHttp` does not automatically add tokens, it doesn't prevent them from being passed via `options.headers`.
**Fix:** Add `headers.delete('Authorization')` to ensure no accidental leakage of internal tokens to external domains.

---

_Reviewed: 2026-04-10T23:45:00Z_
_Reviewer: gsd-code-reviewer_
_Depth: standard_
