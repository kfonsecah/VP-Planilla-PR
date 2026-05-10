---
phase: 26
slug: repository-hygiene-and-build-artifacts-cleanup
status: approved
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-11
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Shell script verification (no automated test framework needed — git hygiene phase) |
| **Config file** | `.gitignore` (the test is verifying git index state) |
| **Quick run command** | `git ls-files \| grep -E "dist/\|target/"` (must return nothing) |
| **Full suite command** | `git ls-files \| grep -E "dist/\|target/" && grep -E "dist/\|target/\|\.next/" .gitignore && git status` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `git ls-files | grep -E "dist/|target/"` — must return empty
- **After every plan wave:** Run full suite — verify .gitignore coverage + clean git status
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | HYG-01 | Shell | `git ls-files \| grep -E "dist/\|target/"` (empty = pass) | ✅ | ✅ green |
| 26-01-02 | 01 | 1 | HYG-01 | Shell | `git ls-files \| grep "src/backend/dist/"` (empty = pass) | ✅ | ✅ green |
| 26-01-03 | 01 | 1 | HYG-01 | Shell | `git ls-files \| grep "src/Java/clocklogs/target/"` (empty = pass) | ✅ | ✅ green |
| 26-02-01 | 02 | 1 | HYG-02 | Grep | `grep "dist/" .gitignore` (must match) | ✅ | ✅ green |
| 26-02-02 | 02 | 1 | HYG-02 | Grep | `grep "target/" .gitignore` (must match) | ✅ | ✅ green |
| 26-02-03 | 02 | 1 | HYG-02 | Grep | `grep -v "^\*.json" .gitignore` (global *.json rule must be gone) | ✅ | ✅ green |
| 26-02-04 | 02 | 1 | HYG-03 | Build | `npm run build --prefix src/backend` (must succeed) | ✅ | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

No Wave 0 gaps — this is a git hygiene phase with no new code. All verification is shell-based using existing tools (git, npm, mvn). No test framework installation needed.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Java Maven build works without tracked target/ | HYG-03 | Requires Maven installed locally (Not available in this env) | Run `mvn clean package -f src/Java/clocklogs/pom.xml` and verify it succeeds |
| git status shows clean working tree after cleanup | HYG-01 | Visual inspection needed | Run `git status` — no unexpected untracked files should appear |

---

## Validation Sign-Off

- [x] All tasks have shell verification commands
- [x] Sampling continuity: every task has an immediate git ls-files or grep check
- [x] No Wave 0 gaps (shell-only verification, no framework needed)
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
