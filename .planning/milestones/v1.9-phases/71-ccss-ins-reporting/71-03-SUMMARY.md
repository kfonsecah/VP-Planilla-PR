---
phase: "71"
plan: "03"
subsystem: "Frontend Reporting"
tags: ["ccss", "ins", "csv", "download", "ui"]
requires: ["REP-71-03"]
affects: ["src/frontend/src/app/pages/reports/page.tsx", "src/frontend/src/services/reportsService.ts"]
tech-stack: ["Next.js", "React", "TypeScript", "Tailwind CSS"]
key-files:
  - "src/frontend/src/services/reportsService.ts"
  - "src/frontend/src/app/pages/reports/page.tsx"
  - "src/frontend/src/app/pages/reports/components/ReportsTab.tsx"
  - "src/frontend/src/app/pages/reports/hooks/useOfficialReports.ts"
decisions:
  - "Added a new 'Exportaciones Institucionales' section to the ReportsTab to separate CSV downloads from the report dispatch logic."
  - "Implemented download logic in the useOfficialReports hook using standard blob URL creation/revocation pattern."
metrics:
  duration: "45m"
  completed_date: "2026-05-11"
---

# Phase 71 Plan 03: Institutional Export UI Summary

Updated the Reports page in the frontend to support the new institutional exports for CCSS and INS.

## Key Changes

### Frontend Service
- Added `downloadCCSSReport` and `downloadINSReport` to `ReportsService`.
- Both methods use the central `http.ts` client to fetch CSV data as blobs and extract filenames from the `Content-Disposition` header.

### UI & Hooks
- Updated `useOfficialReports` hook to manage `isDownloading` state and handle the browser download trigger for CCSS and INS CSVs.
- Enhanced `ReportsTab` component with a new "Exportaciones Institucionales" section.
- Added "Descargar Reporte CCSS (SICERE)" and "Descargar Reporte INS (Riesgos)" buttons with loading spinners.
- Ensured buttons are disabled if no payroll is selected or if a download/generation is in progress.

## Deviations from Plan

None - plan executed as written.

## Verification Results

### Automated Tests
- `cd src/frontend && npx tsc --noEmit`: PASSED

### Manual Verification
- Navigated to the Reports page.
- Selected a valid payroll.
- Verified that the new "Exportaciones Institucionales" section appears.
- Verified that download buttons are present and correctly styled.

## Self-Check: PASSED
- [x] Service methods implemented.
- [x] Hook logic for downloads added.
- [x] UI buttons and loading states implemented.
- [x] Type check passed.
- [x] Commits made for each task.
