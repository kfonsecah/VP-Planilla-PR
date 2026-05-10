# Phase 26 Plan 01: Repository Hygiene — .gitignore Structuring Summary

## Objective
Replace the global `*.json` ignore rule with explicit per-stack ignore sections for Backend (Node/TypeScript), Frontend (Next.js), and Java (Maven). Organize `.gitignore` to be more maintainable and prevent accidental tracking of build artifacts.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Replace .gitignore with per-stack structured version | f1bd1bb | `.gitignore` |

## Key Decisions
- **D-26-01-01: Structure .gitignore by stack.** Organized rules into Backend, Frontend, Java, and General sections for better clarity and maintenance.
- **D-26-01-02: Remove global *.json rule.** Switched from a broad wildcard (which required many re-include hacks) to specific ignores (like `package-lock.json`) and relying on explicit build output folder ignores.

## Deviations from Plan

### Auto-fixed Issues
None - plan executed as written.

### Observed Behavior
- **Untracked files surfaced:** After removing the global `*.json` rule, several JSON files in the `.gemini/` and `.opencode/` directories appeared as untracked in `git status`. These files were previously suppressed by the global rule. 
- **Decision to follow "Exact Content":** The plan specifically instructed to use "exact content" and "Do NOT add anything not listed here." Therefore, these surfaced files were left untracked to maintain literal compliance with the plan's provided `.gitignore` template. A future task (perhaps Plan 02) should address these if they are meant to be ignored.

## Verification: PASSED
- `grep "^\*.json" .gitignore` returns nothing (confirmed via `grep_search`).
- `src/backend/dist/`, `src/Java/clocklogs/target/`, and `src/frontend/.next/` are all present in `.gitignore`.
- `.claude/` and `.planning/` re-includes are preserved.
- Local settings and test coverage exclusions are preserved.
- `git status` confirms `.gitignore` is modified and staged/committed.

## Tech Stack Added/Patterns
- **Pattern: Sectioned .gitignore.** Using clear headers to organize ignore rules by project stack.

## Key Files Created/Modified
- `.gitignore` (Modified)

## Self-Check: PASSED
- [x] .gitignore file committed with per-stack organized sections
- [x] No global `*.json` rule present anywhere in the file
- [x] All three build outputs (dist/, .next/, target/) covered by explicit rules
- [x] .claude/ and .planning/ still trackable (re-includes present)
- [x] Local settings (.claude/settings.local.json, .claude/worktrees/) still excluded
- [x] git log shows the refactor commit
