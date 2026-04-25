---
status: investigating
trigger: "position-not-in-edit-form + phone-gender-null-on-save"
created: 2026-04-16T00:00:00.000Z
updated: 2026-04-16T00:00:00.000Z
---

## Current Focus

hypothesis: "Two separate bugs: (1) Position not loaded into edit form, (2) Phone/gender not sent in save request"
test: "Find employee edit form component and trace data flow"
expecting: "Find where position is loaded (or missing), find where phone/gender are omitted in save"
next_action: "Find frontend employee edit form and backend employee update endpoint"

## Symptoms

expected:
- Position should display in edit form (dropdown pre-filled)
- Phone and gender should persist after saving

actual:
- Position shows in table but NOT in edit form (dropdown empty)
- Phone becomes NULL in DB after edit
- Gender becomes NULL in DB after edit

errors: []
reproduction: "1. Open employee table - position displayed correctly\n2. Click edit on employee\n3. Position dropdown is empty\n4. Change something and save5. Check DB - phone and gender are NULL"
started: "User edited employee from frontend, saved, then checked Prisma Studio"

## Eliminated

## Evidence

- timestamp: 2026-04-16T00:00:00.000Z
  checked: "Looking for employee edit form component"
  found: "Need to trace frontend and backend code"
  implication: "Investigate both form loading and form saving logic"

## Resolution

root_cause: ""
fix: ""
verification: ""
files_changed: []