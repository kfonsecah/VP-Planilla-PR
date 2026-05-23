---
status: investigating
trigger: "Investigate issue: perfil-empleado-salario-base-edicion-info"
created: 2026-04-19T00:00:00.000Z
updated: 2026-04-19T00:00:00.000Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->
hypothesis: [Initial state - gathering symptoms]
test: [Reviewing provided symptoms]
expecting: [Understand the reported issues]
next_action: [Read symptom details and begin investigation]

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->
expected: Salary base should show calculated monthly salary (regular hours × hourly rate); When editing personal info, modal should load all employee data
actual: Shows hourly rate instead of calculated base salary; Modal only loads name and surname, other fields remain blank
errors: No error messages observed in console or logs
reproduction: Navigate to /employee/[id] and observe compensation card
started: Issue has existed since feature implementation

## Eliminated
<!-- APPEND only - prevents re-investigating -->

## Evidence
<!-- APPEND only - facts discovered -->

## Resolution
<!-- OVERWRITE as understanding evolves -->
root_cause: [empty until found]
fix: [empty until applied]
verification: [empty until verified]
files_changed: []