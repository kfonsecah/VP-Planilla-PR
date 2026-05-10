---
phase: 59
reviewers: [gemini, claude, codex, opencode]
reviewed_at: 2026-04-28T06:10:00Z
plans_reviewed: [59-01-PLAN.md, 59-02-PLAN.md]
---

# Cross-AI Plan Review — Phase 59

## Gemini Review

**Summary**
The implementation plans for Phase 59 are concise and well-targeted. They successfully decouple the hardcoded MTSS global minimum wage into the database `vpg_legal_params` and provide a robust fallback mechanism in the `LegalParamService`.

**Strengths**
- Uses the existing `upsert` pattern in the seed script.
- Excellent fallback logic (`1529.62`) ensures the system doesn't break if the parameter is missing.
- Strong automated verification steps (unit testing for the fallback and presence).

**Concerns**
- None regarding the backend logic.
- LOW: Hardcoding the fallback `1529.62` in code might require a code update next year, but since it's a fallback, the database parameter should ideally be the primary source.

**Suggestions**
- Consider logging a warning when the fallback is used, so administrators know the DB needs an update for the new year.

**Risk Assessment**
LOW. The changes are additive and have fallbacks, minimizing any disruption to the existing payroll motor.

---

## Claude Review

**Summary**
This is a straightforward and safe plan. Adding the `GLOBAL_MIN_WAGE_RATE` parameter via the database seed and exposing it in `LegalParamSet` perfectly aligns with the Phase 55/56 architecture.

**Strengths**
- Strict adherence to the `validFrom` pattern for historical parameters.
- Unit testing plan specifically addresses the fallback logic.
- Clear separation into two waves (DB Seeding vs Service Logic).

**Concerns**
- LOW: In `59-01-PLAN.md`, the loop modifier needs to ensure `id` uniquely identifies the parameter key AND the year/date so that both 2024 and 2025 records are properly inserted instead of overwriting each other in the `upsert`.

**Suggestions**
- Ensure `seed.ts` loop concatenates `param.key` and `param.validFrom` for the `id` field.

**Risk Assessment**
LOW. Very standard backend and DB update.

---

## Codex Review

**Summary**
Phase 59 accurately sets up the prerequisite data for the UI warnings planned in Phase 60. The integration points (`LegalParamService.ts` and `payroll.types.ts`) are well-identified.

**Strengths**
- Zero-regression design.
- Accurate mapping of MTSS reference rates.

**Concerns**
- MEDIUM: If multiple minimum wage rates exist for different positions, the *Global* minimum wage might not cover all edge cases.

**Suggestions**
- Explicitly document that `GLOBAL_MIN_WAGE_RATE` is only for the lowest unskilled worker reference warning, and not a definitive calculation rule for all professions.

**Risk Assessment**
LOW. 

---

## OpenCode Review

**Summary**
A solid plan that completes the parameterization of the minimum wage. The execution waves are logical.

**Strengths**
- Good use of `Prisma` seeding.
- The `getGlobalMinWageRate` method is simple and effective.

**Concerns**
- LOW: No frontend changes in this phase, which is correct as per the roadmap, but ensure Phase 60 relies exactly on `LegalParamSet`.

**Suggestions**
- None.

**Risk Assessment**
LOW.

---

## Consensus Summary

The reviewers uniformly agree that Phase 59 is a low-risk, well-structured addition that effectively uses the existing `vpg_legal_params` infrastructure. The plans correctly separate database seeding from service implementation.

### Agreed Strengths
- Strong use of the existing `LegalParamSet` and parameter history patterns.
- Excellent fallback mechanism (1529.62) to prevent runtime crashes.
- Clear, automated verification criteria via Jest unit tests.

### Agreed Concerns
- Ensuring the `seed.ts` upsert loop handles multiple records for the same key but different years correctly (Claude noted the ID concatenation requirement).
- The hardcoded fallback will need maintenance if the DB is not updated annually.

### Divergent Views
- Codex suggested that a "global" minimum wage might not cover all specific professions, whereas the other reviewers focused purely on the technical implementation of the MTSS reference rate.
