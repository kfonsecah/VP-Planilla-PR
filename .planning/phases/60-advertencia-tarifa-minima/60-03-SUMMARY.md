---
phase: 60
plan: 03
subsystem: frontend
tags: ["hooks", "config", "legal-params"]
requires: ["60-01"]
provides: ["legal-param-config-ui"]
affects: ["src/frontend/src/app/pages/configuracion/empresa/page.tsx"]
tech-stack: ["React", "react-hook-form", "Zod", "Heroicons"]
key-files:
  - "src/frontend/src/hooks/useLegalParamConfig.ts"
  - "src/frontend/src/app/pages/configuracion/empresa/page.tsx"
decisions:
  - "Separated legal parameter logic into a dedicated custom hook to comply with PHASE_CONTRACT 4.2."
  - "Implemented auto-save on toggle for legal parameters to provide a seamless UX, distinct from the main enterprise config form."
metrics:
  duration: "00:05:00"
  completed_date: "2026-04-28"
---

# Phase 60 Plan 03: Configuración de Parámetro Legal Summary

Separated legal parameter configuration logic into a custom hook and provided the visual interface in the Enterprise Configuration page. This allows administrators to enable or disable the minimum wage validation rule.

## Key Changes

### 1. Custom Hook `useLegalParamConfig`
- Created `src/frontend/src/hooks/useLegalParamConfig.ts`.
- Encapsulates `react-hook-form` state and validation for legal parameters.
- Uses `LegalParamService` to fetch and update `MIN_WAGE_CHECK_ENABLED`.
- Manages loading and submitting states.

### 2. Enterprise Configuration Page Refactor
- Modified `src/frontend/src/app/pages/configuracion/empresa/page.tsx`.
- Integrated `useLegalParamConfig` hook.
- Added a new configuration card "Validación de Salario Mínimo" with a toggle.
- Connected the toggle to `saveConfig` for immediate persistence on change.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- **Type Check**: `npx tsc --noEmit` passed in the frontend.
- **UI Consistency**: The new card follows the same styling (Zinc/Tailwind) as existing configuration cards.

## Self-Check: PASSED
- [x] Hook `useLegalParamConfig` exists and is typed.
- [x] Page consumes the hook and renders the toggle.
- [x] All changes committed.
