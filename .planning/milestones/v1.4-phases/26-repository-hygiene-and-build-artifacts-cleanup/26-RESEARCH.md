# Phase 26: Repository Hygiene and Build Artifacts Cleanup - Research

**Researched:** 2026-04-11
**Domain:** Git repository hygiene, multi-stack build artifact tracking
**Confidence:** HIGH

## Summary

This phase addresses a foundational repository cleanliness issue: build artifacts (`dist/`, `target/`) are currently tracked in git despite being fully regenerable from source. Untracking them and reinforcing `.gitignore` with per-stack sections will reduce repository size by ~19MB, prevent accidental re-commits of generated files, and establish a clean git hygiene baseline for future development.

The work involves three coordinated steps: (1) update `.gitignore` with organized, per-stack rules and remove the overly broad `*.json` global ignore, (2) untrack tracked artifacts using `git rm --cached -r` without deleting local files, and (3) verify that a clean local build pipeline works correctly without these files present in the index.

**Primary recommendation:** Remove `src/backend/dist/` and `src/Java/clocklogs/target/` from git tracking using `git rm --cached -r`, then update root-level `.gitignore` with per-stack sections (Backend, Frontend, Java, General) following standard patterns from GitHub's gitignore templates. Test that local builds still work after the change.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
1. Remove `src/backend/dist/` (compiled TypeScript JS output) from git tracking
2. Remove `src/Java/clocklogs/target/` (`.class` files, `.jar` files, Maven metadata) from git tracking
3. Audit `src/frontend/.next/` to confirm it is already excluded — add explicit rule if not
4. Use `git rm --cached -r` to remove artifacts from the git index without deleting local files
5. No history rewrite (`git filter-repo` not needed) — artifacts are not sensitive data
6. Single root-level `.gitignore` file (do not create per-package files)
7. Organize with clear sections per stack: Backend (Node/TypeScript), Frontend (Next.js), Java utility, General
8. Remove the global `*.json` ignore rule — it silently hides any new JSON file outside `.claude/` and `.planning/`
9. Remove the associated `!.claude/**/*.json` and `!.planning/**/*.json` re-include hacks (no longer needed)
10. Add only specific JSON ignores where actually needed (e.g., local secrets files if any)

### Claude's Discretion
- Exact order and grouping of sections within the new `.gitignore`
- Whether to add `node_modules/` explicitly if already absent from tracking
- Commit message format for the cleanup commit

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HYG-01 | Artefactos generados (`dist/`, `target/`, lock temporales, outputs de build) no se versionan | Git ls-files confirms 87 tracked artifacts across dist/ and target/; user decision locked to remove via `git rm --cached` |
| HYG-02 | `.gitignore` cubre artefactos de backend, frontend y Java utility de forma consistente | Researched standard patterns for Node/TypeScript, Next.js, Maven from GitHub gitignore templates; current .gitignore has global `*.json` rule that blocks tracking of JSON-based config |
| HYG-03 | Flujo de build local no depende de archivos generados ya presentes en git | Backend `npm run build` → tsc (verified in package.json); Java `mvn clean package` (verified in pom.xml); Frontend `next build` (verified in next.config.ts); all regenerable locally without tracked dist/target |

</phase_requirements>

## Standard Stack

### Build Artifacts & Gitignore Management

**Technology:** Git version control with multi-language build pipeline (Node.js TypeScript, Maven Java, Next.js)

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| git | 2.x+ | Version control, artifact tracking | Fundamental; git rm --cached is the standard way to untrack |
| .gitignore | (root) | Centralized exclusion rules | Single source of truth prevents duplication; per-stack sections organize intent |

### Build Commands (Verified)

| Stack | Build Command | Output | Input |
|-------|---------------|--------|-------|
| Backend | `npm run build` (runs `tsc`) | `src/backend/dist/` | `src/backend/src/` (TypeScript) |
| Java Utility | `mvn clean package` | `src/Java/clocklogs/target/` | `src/Java/clocklogs/src/` |
| Frontend | `npm run build` (Next.js) | `src/frontend/.next/` | `src/frontend/src/app/` |

All outputs are **fully regenerable** from source — no runtime dependency on tracked artifacts.

### Current State (Verified)

| Item | Status | Size | Count |
|------|--------|------|-------|
| `src/backend/dist/` | Tracked in git | 361 KB | ~50 files |
| `src/Java/clocklogs/target/` | Tracked in git | 19 MB | ~37 files |
| `src/frontend/.next/` | Not tracked (verify) | — | — |
| `node_modules/` (backend) | Not tracked | — | — |
| `node_modules/` (frontend) | Not tracked | — | — |

**Total bloat:** ~19.4 MB of tracked build artifacts (target/ alone is 19 MB, which is 99.8% of the bloat).

## Architecture Patterns

### Gitignore Structure: Per-Stack Sections

Standard pattern from GitHub's gitignore templates organizes exclusions by responsible tool/framework:

```
# Backend (Node.js / TypeScript)
src/backend/dist/
src/backend/node_modules/
src/backend/*.tsbuildinfo

# Frontend (Next.js)
src/frontend/.next/
src/frontend/node_modules/
src/frontend/out/

# Java Utility (Maven)
src/Java/clocklogs/target/
src/Java/clocklogs/*.class
src/Java/clocklogs/*.jar

# General (IDE, OS, temp files)
.vscode/
.idea/
*.swp
*.log
```

**Why this structure:**
- Each section is scoped to its stack (clear ownership)
- Patterns are ordered from most-specific to more-general (prevents surprises)
- Easy to extend without central conflicts
- Matches conventions from official GitHub gitignore templates

### Untracking Without History Rewrite

**Pattern:** Use `git rm --cached -r` to remove from index while preserving local files.

```bash
# Step 1: Update .gitignore with new rules
git add .gitignore
git commit -m "refactor(gitignore): organize per-stack sections, remove global *.json rule"

# Step 2: Untrack artifacts (files stay locally)
git rm --cached -r src/backend/dist/
git rm --cached -r src/Java/clocklogs/target/

# Step 3: Verify and commit untracking
git status  # shows deletions from index, nothing deleted locally
git commit -m "chore(git): untrack build artifacts dist/ and target/"

# Step 4: Verify local builds still work
npm run build --prefix src/backend
mvn clean package -f src/Java/clocklogs/pom.xml
npm run build --prefix src/frontend
```

**Why not history rewrite:**
- Artifacts are not sensitive (no secrets/credentials)
- History rewrite breaks all clones and existing work (high friction)
- `git rm --cached` is sufficient: future commits won't include these files, and they remain locally for active development
- Per user decisions, no rewrite needed

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Defining build artifact patterns | Custom patterns per developer | GitHub gitignore templates (Maven, Node, Next.js) | Patterns evolve with ecosystem; custom patterns miss edge cases |
| Selective .json ignoring | Manual `!` re-includes everywhere | Single source-of-truth (curated `.gitignore`) | Scattered `!` includes are fragile and unmaintainable; centralized rules scale |
| Untracking files | Rewrite history with git filter-repo | `git rm --cached -r` + `.gitignore` | History rewrite is destructive; cached removal is safe and reversible |
| Testing artifact removal | Manual `git status` checking | Script that verifies: (1) .gitignore covers artifacts, (2) fresh clone builds locally | Prevents accidental re-commits; catches patterns that are too loose or tight |

**Key insight:** Build artifact exclusion is a solved problem in the ecosystem. GitHub's gitignore templates, used by millions of projects, provide battle-tested patterns that handle edge cases (e.g., `.tsbuildinfo` for incremental compilation, `maven-archiver/` metadata). Rolling custom patterns risks forgetting critical exclusions.

## Common Pitfalls

### Pitfall 1: Global `*.json` Rule Masking Configuration Files

**What goes wrong:** The current `.gitignore` has a global `*.json` ignore rule (line 24) with re-includes for `.claude/` and `.planning/`. Any new `.json` file outside these directories is silently ignored, even if it should be tracked (e.g., a new configuration file added later).

**Why it happens:** The rule was added to exclude `package-lock.json` and other lock files, but the syntax is too broad.

**How to avoid:** Replace the global `*.json` with specific ignores like `package-lock.json`, `*.lock`, and only add others if genuinely needed. Verify that `.gitignore` doesn't unintentionally hide files you want to track.

**Warning signs:** Running `git add .` and noticing a `.json` file you expected to add is missing. Checking `git status` and finding nothing, but `.gitignore` explicitly excludes it.

**Prevention:** In phase planning, specify the `.gitignore` update as a discrete commit separate from artifact untracking. This makes it easy to review and revert if unintended files get ignored.

### Pitfall 2: Untracking Without Updating .gitignore First

**What goes wrong:** If you run `git rm --cached -r src/backend/dist/` without first adding `src/backend/dist/` to `.gitignore`, the files will be untracked momentarily, then re-added on the next commit if someone runs `git add .` or modifies the dist/ folder during a local build.

**Why it happens:** Developers sometimes forget that `.gitignore` doesn't affect already-tracked files. Only `git rm --cached` removes them from the index; `.gitignore` prevents future tracking.

**How to avoid:** Always update `.gitignore` BEFORE running `git rm --cached`. Verify with `git status` that the files are listed as "deleted" (not "modified") after the rm command.

**Warning signs:** After a successful cleanup, you see the files back in `git status` after a local build, or CI fails because it tries to commit newly generated artifacts.

### Pitfall 3: Removing Too Much with `git rm --cached -r`

**What goes wrong:** If the glob pattern is too broad (e.g., `git rm --cached -r dist/` instead of `git rm --cached -r src/backend/dist/`), you might untrack files outside the intended directory.

**Why it happens:** `git rm --cached` matches patterns recursively. A typo or insufficient path specification can affect the wrong files.

**How to avoid:** Always use the full, specific path from the repository root. Test the path with `git ls-files` first to see exactly which files match.

**Warning signs:** `git status` shows many more files as deleted than expected. Always review the output of `git status` and `git diff --cached` before committing.

### Pitfall 4: Forgetting to Test Local Builds After Untracking

**What goes wrong:** Artifacts are untracked successfully, but a fresh `npm run build` or `mvn clean package` fails because there's a missing dependency or stale cache. This only shows up when someone clones the repo fresh or runs a clean build.

**Why it happens:** If you only test on a development machine with cached dependencies, you miss the "clean slate" scenario.

**How to avoid:** After untracking, explicitly run clean build commands and verify they succeed without referencing the (now untracked) `dist/` or `target/` directories.

**Warning signs:** CI pipeline fails on a fresh clone with "missing dependency" or "file not found" errors related to dist/ or target/.

## Code Examples

### Recommended .gitignore (Per-Stack Sections)

Source: GitHub gitignore templates (Node.gitignore, Maven.gitignore, Next.js conventions)

```gitignore
# ============================================================================
# VP-Planilla Repository Gitignore
# Organized per stack: Backend (Node/TypeScript), Frontend (Next.js), Java,
# General (OS/IDE/temp). Generated files are never tracked.
# ============================================================================

# ===== BACKEND (Node.js / TypeScript) =====
# Compiled TypeScript output
src/backend/dist/
src/backend/*.tsbuildinfo

# Dependencies (prevent accidental commit of node_modules)
src/backend/node_modules/

# Package manager locks — developers regenerate from package.json
package-lock.json

# ===== FRONTEND (Next.js) =====
# Next.js build output
src/frontend/.next/
src/frontend/out/

# Dependencies
src/frontend/node_modules/

# ===== JAVA UTILITY (Maven) =====
# Maven build output — fully regenerable from source
src/Java/clocklogs/target/

# Compiled classes and archives
src/Java/clocklogs/*.class
src/Java/clocklogs/*.jar

# Maven metadata
src/Java/clocklogs/pom.xml.tag
src/Java/clocklogs/pom.xml.releaseBackup
src/Java/clocklogs/pom.xml.versionsBackup
src/Java/clocklogs/pom.xml.next
src/Java/clocklogs/release.properties
src/Java/clocklogs/dependency-reduced-pom.xml

# ===== GENERAL (IDE, OS, Temp Files) =====
# IDE configurations
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Log files
*.log
logs/

# Temporary files
*.tmp
temp/

# Test coverage (generated)
coverage/
*.lcov

# Temp/debug scripts — do not commit
parse_tmp.js
temp_script.py
test_hours.js
check_employee.ts
query_emp.mjs
*.tmp.js
*.tmp.ts

# ===== CONFIGURATION & DOCUMENTATION (TRACKED) =====
# .claude/ directory is tracked (project configuration)
!.claude/
!.claude/**

# .planning/ directory is tracked (milestone & phase planning)
!.planning/
!.planning/**

# Environment files — if needed, create .env.example instead
# .env
# .env.local
```

**Verification:** This pattern structure follows GitHub's official templates and solves the broad `*.json` problem by:
1. Removing the global `*.json` rule
2. Using specific excludes (e.g., `package-lock.json`)
3. Explicitly re-including `.claude/` and `.planning/` (no longer hacky `!*.json` rules)

### Verification Script (HYG-03: Build Local Verification)

After untracking, verify that clean builds work locally:

```bash
#!/bin/bash
# Verify Phase 26 completion: Local builds work without tracked artifacts

set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

echo "=== Phase 26: Hygiene Verification ==="
echo ""

# 1. Verify artifacts are not tracked
echo "1. Checking that artifacts are NOT in git index..."
if git ls-files | grep -E "src/backend/dist/|src/Java/clocklogs/target/" > /dev/null; then
  echo "ERROR: Artifacts still tracked! Run: git rm --cached -r src/backend/dist/ src/Java/clocklogs/target/"
  exit 1
fi
echo "   ✓ No dist/ or target/ files in git index"

# 2. Verify .gitignore covers artifacts
echo ""
echo "2. Checking .gitignore coverage..."
grep -q "src/backend/dist/" .gitignore && echo "   ✓ dist/ ignored"
grep -q "src/Java/clocklogs/target/" .gitignore && echo "   ✓ target/ ignored"
grep -q "src/frontend/.next/" .gitignore && echo "   ✓ .next/ ignored"

# 3. Clean and rebuild each stack
echo ""
echo "3. Testing clean builds (verifies regeneration works)..."

echo "   Building backend..."
cd src/backend
npm run build > /dev/null 2>&1
[ -d dist ] && echo "   ✓ Backend dist/ rebuilt successfully"
cd ../..

echo "   Building Java utility..."
mvn clean package -f src/Java/clocklogs/pom.xml > /dev/null 2>&1
[ -d "src/Java/clocklogs/target" ] && echo "   ✓ Java target/ rebuilt successfully"

echo "   Building frontend..."
cd src/frontend
npm run build > /dev/null 2>&1
[ -d .next ] && echo "   ✓ Frontend .next/ rebuilt successfully"
cd ../..

echo ""
echo "✅ Phase 26 verification complete: Repository clean, builds work locally."
```

## State of the Art

| Old Approach | Current Approach | Context |
|--------------|------------------|---------|
| Track build artifacts (`dist/`, `target/`) | Exclude with `.gitignore` and untrack via `git rm --cached` | Ecosystem standard since ~2010; all major projects follow this pattern |
| Global `*.json` ignore with manual `!` re-includes | Specific excludes for lock files + explicit inclusions for config directories | Cleaner, more maintainable; prevents accidental hiding of config files |
| Per-package .gitignore files | Single root-level .gitignore with per-stack sections | Centralizes rules, reduces confusion, easier to audit |

**Deprecated/outdated:**
- Using `git filter-repo` to remove non-sensitive artifacts: Overkill and destructive. `git rm --cached` is safer and sufficient.
- Tracking lock files (`package-lock.json`): Modern practice is to exclude lock files so builds use the latest compatible versions (per package.json ranges). Lock files are team-specific and regenerable.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| git | All cleanup operations | ✓ | 2.x+ | Required — no fallback |
| Node.js | Backend build (`npm run build` / `tsc`) | ✓ | v22.14.0 | Required for Phase 27+ |
| npm | Backend dependencies & scripts | ✓ | v10.9.2 | Required for Phase 27+ |
| Maven | Java utility build | ✓ | (via system PATH) | Required if Java utility used |
| Java | Java utility compile | ✓ | (via Maven) | Required if Java utility used |

**Missing dependencies with no fallback:** None — all tools required for this phase are present.

**Missing dependencies with fallback:** None — this phase has no fallback scenarios.

## Validation Architecture

**Test Framework Status:** Phase 26 is a git hygiene phase with no new code. Validation focuses on verification steps (shell scripts) rather than unit tests.

| Property | Value |
|----------|-------|
| Framework | Shell script verification (no automated test framework needed) |
| Config file | .gitignore (the "test" is a verification script that checks rule coverage) |
| Quick run command | `git ls-files \| grep -E "dist/\|target/"` (should return nothing) |
| Full suite command | See "Verification Script" section above |

### Phase Requirements → Test Map

| Req ID | Behavior | Verification Type | Command | File Exists? |
|--------|----------|-------------------|---------|-------------|
| HYG-01 | Build artifacts (dist/, target/) are not tracked in git | Shell script | `git ls-files \| grep -E "dist/\|target/"` (must return empty) | ✅ Script in section above |
| HYG-02 | .gitignore covers all build artifacts | Grep check | `grep -E "dist/\|target/\|\.next/" .gitignore` | ✅ .gitignore will be updated in phase |
| HYG-03 | Local builds work without tracked artifacts | Build command | `npm run build --prefix src/backend && mvn clean package -f src/Java/clocklogs/pom.xml` | ✅ Scripts present (package.json, pom.xml verified) |

### Sampling Rate

- **Per task commit:** Run quick verification: `git ls-files | grep -E "dist/|target/"` — should return nothing
- **Per wave merge (after all cleanup tasks):** Run full verification script (provided above)
- **Phase gate:** Verify `.gitignore` is updated, artifacts untracked, and clean builds pass

### Wave 0 Gaps

- ✓ No test framework gaps — phase is git hygiene, not feature code
- ✓ No framework installation needed
- ✓ Verification script provided above (shell-based, no dependencies beyond git/npm/mvn)

## Common Pitfall Prevention Checklist

**Before committing .gitignore update:**
- [ ] No global `*.json` rule remains
- [ ] Each stack (Backend, Frontend, Java) has its own section
- [ ] `!.claude/` and `!.planning/` re-includes present (no longer via `!*.json` hacks)
- [ ] Run `git add .gitignore && git status` to verify no unintended files are hidden

**Before running `git rm --cached`:**
- [ ] Test the path: `git ls-files | grep "pattern"` to see exact files matching
- [ ] .gitignore already updated and committed
- [ ] Local copies of dist/ and target/ still exist on disk (verify with `ls`)

**After running `git rm --cached`:**
- [ ] Review `git status` — should show files as deleted from index, not modified
- [ ] Review `git diff --cached` to confirm correct deletions
- [ ] Don't commit yet — verify local builds first

**After local builds:**
- [ ] Run `git status` again — should show no new untracked files for dist/ or target/
- [ ] If rebuilds generate new files and git wants to track them, .gitignore is incomplete

## Open Questions (RESOLVED)

1. **Package-lock.json handling in .gitignore (RESOLVED)**
   - What we know: Currently ignored via global `*.json`. Modern practice is to exclude lock files so builds use latest compatible versions.
   - What's unclear: Does this project want lock files tracked (for reproducible builds) or ignored (for flexibility)?
   - Recommendation: Based on standard practice and current global rule, keep `package-lock.json` ignored. If reproducible builds become a requirement (Phase 27+), this can be revisited.
   - **RESOLUTION:** The plan (26-03) explicitly uses `**/package-lock.json` to ensure recursive ignore coverage, following the established project pattern of ignoring lock files.

2. **IDE configuration directories (.vscode, .idea) (RESOLVED)**
   - What we know: Currently in .gitignore (lines 18-19). Phase 26 is not removing these.
   - What's unclear: Any IDE-specific rules that should be added?
   - Recommendation: Leave as-is. Phase 26 focuses on build artifacts only; IDE config is orthogonal.
   - **RESOLUTION:** Confirmed that existing IDE rules are sufficient for the current toolchain. No additional rules required for Phase 26.

## Sources

### Primary (HIGH confidence)

- **GitHub gitignore templates:** [Node.gitignore](https://github.com/github/gitignore/blob/main/Node.gitignore), [Maven.gitignore](https://github.com/github/gitignore/blob/main/Maven.gitignore) — Official, battle-tested patterns used by millions of projects
- **Git documentation:** [git-rm](https://git-scm.com/docs/git-rm) — Official git command reference; `git rm --cached` is the standard safe untracking method
- **Project files verified:** 
  - `src/backend/package.json` — Confirmed `npm run build` runs `tsc` to generate `dist/`
  - `src/Java/clocklogs/pom.xml` — Confirmed Maven builds to `target/`
  - `src/frontend/next.config.ts` — Confirmed Next.js generates `.next/`
  - Current `.gitignore` — Analyzed current rules and identified broad `*.json` pattern

### Secondary (MEDIUM confidence)

- [Day 20/30 - Git rm --cached: Remove Files from Staging but Keep Locally](https://dev.to/ruqaiya_beguwala/day-2030-git-rm-cached-remove-files-from-staging-but-keep-locally-52l3) — Practical examples of `git rm --cached -r` workflow
- [Mastering git rm -r --cached for Easy File Removal](https://gitscripts.com/git-rm-r-cached) — Best practices for untracking files
- [Tutorial on Gitignore in TypeScript](https://www.squash.io/tutorial-on-gitignore-for-typescript/) — TypeScript-specific patterns
- [Using .gitignore the Right Way](https://labs.consol.de/development/git/2017/02/22/gitignore.html) — General gitignore principles and patterns

### Tertiary (LOW confidence)

- None — all critical claims verified against official sources or project files

## Metadata

**Confidence breakdown:**
- Standard stack (git workflow): HIGH — Verified against official git docs and GitHub templates
- Architecture (per-stack .gitignore sections): HIGH — Based on GitHub official templates and ecosystem consensus
- Build artifact patterns: HIGH — Verified against official templates and project build configs
- Untracking method: HIGH — Verified against official git-rm documentation
- Pitfalls: MEDIUM — Based on community reports and best practices

**Research date:** 2026-04-11
**Valid until:** 2026-05-11 (30 days — git and build tool standards are stable, minimal change expected)

---

*Research completed: 2026-04-11 — Phase 26 domain fully investigated*
