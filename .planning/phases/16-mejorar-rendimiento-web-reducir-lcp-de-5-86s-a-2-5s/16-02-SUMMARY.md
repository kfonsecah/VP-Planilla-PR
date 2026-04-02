---
phase: 16-mejorar-rendimiento-web-reducir-lcp-de-5-86s-a-2-5s
plan: 02
subsystem: performance
tags: [nextjs, image-optimization, font-loading, compression, tree-shaking]

# Dependency graph
requires:
  - phase: 16-01
    provides: "Lazy-loading infrastructure for heavy third-party libraries"
provides:
  - Next.js compress and optimizePackageImports configuration
  - Font preload hints in root layout metadata
  - Optimized Image component loading strategies (priority/eager/lazy)
  - Quality settings for decorative vs brand images
  - CLS prevention across all Image components
affects: [frontend-performance, web-vitals, LCP-reduction]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Image loading strategy: priority for LCP-critical, eager for visible, lazy for below-fold"
    - "Font preload + font-display:swap for zero FOIT"
    - "Quality tuning: 40 for decorative backgrounds, 80 for brand logos"

key-files:
  created: []
  modified:
    - src/frontend/next.config.ts
    - src/frontend/src/app/layout.tsx
    - src/frontend/src/components/ui/Sidebar.tsx
    - src/frontend/src/components/SidebarItem.tsx
    - src/frontend/src/app/pages/auth/page.tsx
    - src/frontend/src/app/not-found.tsx
    - src/frontend/src/components/EmployeeIncidenceCard.tsx

key-decisions:
  - "Used metadata.other.link for font preload instead of next/font (custom local .woff files)"
  - "Sidebar desktop logo uses priority (brand, every page); mobile logo uses eager (above fold on mobile)"
  - "Auth background image quality=40 (decorative with opacity-15), logo quality=80 (brand)"

patterns-established:
  - "Image loading: priority for LCP-critical, eager for always-visible, lazy for below-fold"
  - "Font loading: preload in metadata + font-display:swap in CSS"

requirements-completed: [PERF-02]

# Metrics
duration: 5min
completed: 2026-04-02
---

# Phase 16 Plan 02: Next.js Performance Config & Font/Image Optimization Summary

**Next.js compression, package import optimization, font preloading, and Image component loading strategies to eliminate render-blocking resources and CLS**

## Performance

- **Duration:** 5 min
- **Started:** 2026-04-02T04:15:00Z
- **Completed:** 2026-04-02T04:20:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Configured `compress: true` and `optimizePackageImports` for @heroicons/react, lucide-react, @fullcalendar, framer-motion in next.config.ts
- Added font preload hints for VerdeFont.woff and PraderaFont.woff in root layout metadata
- Optimized 11 Image components across 5 files with appropriate loading strategies (priority/eager/lazy) and quality settings

## Task Commits

Each task was committed atomically:

1. **Task 1: Configure Next.js performance settings** - `42eb203` (feat)
2. **Task 2: Add font preload hints to root layout** - `ecf0426` (feat)
3. **Task 3: Optimize Image components for CLS prevention** - `8798845` (feat)

## Files Created/Modified
- `src/frontend/next.config.ts` - Added compress:true + optimizePackageImports for 5 libraries
- `src/frontend/src/app/layout.tsx` - Added font preload links in metadata.other
- `src/frontend/src/components/ui/Sidebar.tsx` - Mobile logo eager, desktop logo priority, logout lazy
- `src/frontend/src/components/SidebarItem.tsx` - Sidebar icons set to eager loading
- `src/frontend/src/app/pages/auth/page.tsx` - Background quality=40, logo quality=80 + priority
- `src/frontend/src/app/not-found.tsx` - 404 image set to lazy loading
- `src/frontend/src/components/EmployeeIncidenceCard.tsx` - All 4 incidence icons set to lazy loading

## Decisions Made
- Used `metadata.other.link` array for font preload instead of switching to next/font — custom brand fonts are local .woff files, not Google Fonts
- Sidebar has two logo instances: mobile (eager, above fold on small screens) and desktop (priority, brand visible on every page)
- Auth page background image gets quality=40 since it's decorative with opacity-15 overlay; brand logo gets quality=80

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript error in `attendance/page.tsx` (skipped_count property) — documented in STATE.md, not related to this plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 3 tasks complete, TypeScript passes (only pre-existing error)
- Font loading optimized, Image components prevent CLS, compression enabled
- Ready for next performance optimization plan

---
*Phase: 16-mejorar-rendimiento-web-reducir-lcp-de-5-86s-a-2-5s*
*Completed: 2026-04-02*

## Self-Check: PASSED

- [x] SUMMARY.md exists at `.planning/phases/16-mejorar-rendimiento-web-reducir-lcp-de-5-86s-a-2-5s/16-02-SUMMARY.md`
- [x] STATE.md exists and updated
- [x] ROADMAP.md exists and updated
- [x] All 4 commits verified in git log: `42eb203`, `ecf0426`, `8798845`, `68db272`

## Self-Check: PASSED

- [x] SUMMARY.md exists at `.planning/phases/16-mejorar-rendimiento-web-reducir-lcp-de-5-86s-a-2-5s/16-02-SUMMARY.md`
- [x] STATE.md exists and updated
- [x] ROADMAP.md exists and updated
- [x] All 4 commits verified in git log: `42eb203`, `ecf0426`, `8798845`, `68db272`
