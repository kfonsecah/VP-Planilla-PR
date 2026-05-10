---
status: issues_found
phase: 26-repository-hygiene-and-build-artifacts-cleanup
reviewed: 2026-04-11
---

# Phase 26: Code Review Report — Repository Hygiene

## Summary
Phase 26 successfully restructured the `.gitignore` file into a maintainable, stack-based organization and removed 87 build artifact files (~19 MB) from the Git index. However, several repository hygiene issues remain.

## Findings

### WR-01: Aggressive Global `*.txt` Ignore
- **File:** `.gitignore:64`
- **Issue:** The rule `*.txt` is applied globally.
- **Fix:** Remove the global `*.txt` rule or scope it.

### IN-01: Untracked JSON Configuration Files
- **File:** `.gemini/`, `.opencode/`
- **Issue:** After removing the global `*.json` ignore rule, several JSON files are now untracked.
- **Fix:** Explicitly track or ignore.

### IN-02: Residual Tracked `.pyc` Artifacts
- **File:** `.opencode/skills/ui-ux-pro-max/scripts/__pycache__/*.pyc`
- **Issue:** Compiled Python files are currently tracked.
- **Fix:** `git rm --cached -r .opencode/skills/ui-ux-pro-max/scripts/__pycache__/` and add `__pycache__/` to `.gitignore`.

### IN-03: Inconsistent Lock File Ignore Policy
- **File:** `.gitignore:17`
- **Issue:** Root `.gitignore` ignores `package-lock.json`, but `src/backend/package-lock.json` is tracked.
- **Fix:** Use `**/package-lock.json` if intended to ignore all.
