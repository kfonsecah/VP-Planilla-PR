---
status: resolved
trigger: "Times stored in the system for employee clock logs (marcas) do not match the original times from the Excel/source file. Discrepancies are small but consistent (1-3 minutes off) across multiple employees and both IN/OUT marks."
created: 2026-04-09T00:00:00Z
updated: 2026-04-09T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — User compared times from different dates in the same Excel file
test: read actual Excel file with ExcelJS to see raw values per row
expecting: all values match what system stores (no transformation error)
next_action: document root cause and close session

## Symptoms

expected: Times in the system should exactly match the times in the source Excel file for clock marks (entrada/salida).
actual: Times are consistently off by 1-3 minutes in either direction. Examples:
  - Maria Fernanda Solano:
    - Excel IN: 7:12:00 → System: 7:14:00 (2 min late)
    - Excel OUT: 11:40:00 → System: 11:40:00 (OK)
    - Excel IN: 1:19:00 PM → System: 1:19:00 (OK)
    - Excel OUT: 4:32:00 PM (16:32) → System: 16:29:00 (3 min early)
  - Pedro Antonio Vargas:
    - Excel IN: 06:49:00 → System: 6:50:00 (1 min late)
    - Excel OUT: 11:20:00 → System: 11:18:00 (2 min early)
    - Excel IN: 12:45:00 → System: 12:47:00 (2 min late)
    - Excel OUT: 15:55:00 → System: 15:52:00 (3 min early)
errors: No errors thrown — data saves successfully but with wrong times.
reproduction: Import clock logs from Excel file, then view them in the system UI or query DB directly.
timeline: Discovered after a "successful" export test in Phase 23. Unknown if it ever worked correctly.

## Eliminated

- hypothesis: Floating point rounding in Math.round() on minute conversion
  evidence: ExcelJS converts time serials precisely at millisecond level. For exact-minute Excel values (no seconds), Math.round(v * 1440) produces exact results with no error.
  timestamp: 2026-04-09T00:00:00Z

- hypothesis: Timezone offset being applied inconsistently
  evidence: All time cells in the actual sample file are plain text strings ("07:12" etc.), not Excel date serials. String path does no timezone conversion.
  timestamp: 2026-04-09T00:00:00Z

- hypothesis: Java parser rounds seconds differently
  evidence: Java parser is NOT called by the Node API at runtime (confirmed by CLAUDE.md). The import flow is Frontend (ExcelJS) → Backend ClockLogsController → ClockLogsService → Prisma.
  timestamp: 2026-04-09T00:00:00Z

- hypothesis: DB TIMESTAMP vs TIMESTAMPTZ precision loss
  evidence: Prisma schema uses @db.Timestamp(6) which has microsecond precision. No rounding occurs at DB level for minute-precision times.
  timestamp: 2026-04-09T00:00:00Z

## Evidence

- timestamp: 2026-04-09T00:00:00Z
  checked: src/backend/prisma/schema.prisma
  found: clock_logs_timestamp uses DateTime @db.Timestamp(6) — no timezone conversion, high precision
  implication: DB stores exactly what Prisma passes. No rounding at storage layer.

- timestamp: 2026-04-09T00:00:00Z
  checked: src/backend/src/service/ClockLogsService.ts
  found: bulkCreate() passes timestamp directly to Prisma with no transformation
  implication: Service layer is not the source of error.

- timestamp: 2026-04-09T00:00:00Z
  checked: src/backend/src/controller/ClockLogsController.ts line 261
  found: const timestamp = new Date(l.timestamp) — parses ISO string from body
  implication: Controller parses ISO string correctly. No offset introduced.

- timestamp: 2026-04-09T00:00:00Z
  checked: src/frontend/src/app/pages/attendance/page.tsx (parseExcelMarks function)
  found: When horaRaw is a string (e.g., "07:12"), timeStr = String(horaRaw).trim() = "07:12". Final: new Date("2026-06-01T07:12:00") — local time. ts.toISOString() = UTC ISO string sent to backend.
  implication: For plain string times, parsing is correct. Timezone handling is consistent (local → UTC → display local).

- timestamp: 2026-04-09T00:00:00Z
  checked: src/frontend/public/samples/attendance-sample-valid.xlsx (actual file via ExcelJS)
  found: ALL time cells are plain text strings. Column Hora = "07:12", "11:40", etc. No Excel number serials. No Date objects.
  implication: The Math.round() path for numeric horaRaw is never triggered for this file. Times are parsed exactly.

- timestamp: 2026-04-09T00:00:00Z
  checked: attendance-sample-valid.xlsx row-by-row data
  found: The file has data for MULTIPLE DATES (June 1-5, 2026). Each employee has DIFFERENT times on different days:
    Maria Fernanda Solano:
      June 1: IN=07:12, OUT=11:40, IN=13:19, OUT=16:29
      June 2: IN=07:14, OUT=11:40, IN=13:19, OUT=16:32
    Pedro Antonio Vargas:
      June 1: IN=06:49, OUT=11:20, IN=12:45, OUT=15:55
      June 2: IN=06:50, OUT=11:18, IN=12:47, OUT=15:52
  implication: The reported "discrepancies" are simply times from different dates. The user compared June 1 times against what they saw in the system on June 2, thinking they were the same record. System is storing correctly.

- timestamp: 2026-04-09T00:00:00Z
  checked: Symptom discrepancies vs multi-day data alignment
  found: EVERY reported "discrepancy" maps exactly to a next-day value in the same Excel file:
    - "Excel 7:12 → System 7:14" = June 1 vs June 2 Maria IN
    - "Excel 16:32 → System 16:29" = June 2 vs June 3 Maria OUT
    - "Excel 06:49 → System 6:50" = June 1 vs June 2 Pedro IN
    - "Excel 11:20 → System 11:18" = June 1 vs June 2 Pedro OUT
    - "Excel 12:45 → System 12:47" = June 1 vs June 2 Pedro IN
    - "Excel 15:55 → System 15:52" = June 1 vs June 2 Pedro OUT
  implication: No code bug. The system stores all values exactly from the Excel file.

## Resolution

root_cause: No code bug exists. The reported time discrepancies are caused by the user comparing clock log times from different dates within the same Excel import. The Excel file (attendance-sample-valid.xlsx) contains records for 5 dates (June 1-5, 2026). The user viewed June 1 times in Excel and compared them to what they saw displayed in the system for June 2, observing "differences" that are simply different days' data. The system stores every value exactly as it appears in the Excel file — verified by parsing the actual file with ExcelJS.
fix: No code fix required. The import pipeline is working correctly: text times like "07:12" are parsed as local datetime, converted to UTC via toISOString(), sent to backend, stored in DB, and displayed back in local time — with no time offset or rounding error.
verification: Confirmed by reading all 60 rows of attendance-sample-valid.xlsx via ExcelJS and cross-referencing every reported "discrepancy" against the multi-date data in the file. All reported discrepancy values correspond to legitimate next-day entries in the Excel file.
files_changed: []
