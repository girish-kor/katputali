# CODING_RULES — KATPUTALI

Code style and project conventions for a solo developer working with AI pair-programming assistance. The goal is consistency a single person (plus an AI assistant with no persistent memory of past sessions) can maintain without a team-wide style debate.

## 1. General Principles

- **Minimal dependencies.** Before adding any library, check whether PlayCanvas already provides it (see [[TECH_STACK]] §1, §7) and record any addition in [[TECH_STACK]].
- **Plain JavaScript (ES2020+ modules), no TypeScript in v1** — see [[TECH_STACK]] §2 for rationale. Use JSDoc type comments on exported functions where a signature isn't obvious from its name and arguments.
- **No premature abstraction.** Three similar lines beat a speculative shared helper; systems in [[ARCHITECTURE]] §3 are only split into further sub-modules when a file actually becomes hard to navigate, not in anticipation of future needs.
- **Match the doc set.** Gameplay values (radii, speeds, timers) live in [[DATA_MODEL]] §4–6 config, never hardcoded inline — this is enforced, not a suggestion, since it's what makes playtesting-driven tuning (see [[TESTING]] §4) fast.

## 2. File & Folder Conventions

- Follow the structure in [[ARCHITECTURE]] §2 exactly — one system per file under `/src/systems`, one entity setup helper per file under `/src/entities`.
- File names: `kebab-case.js`. Class/constructor names: `PascalCase`. Functions/variables: `camelCase`. Constants (config values, enums): `UPPER_SNAKE_CASE`.
- One default export per system module (the system's public interface); internal helpers stay unexported unless reused elsewhere.

## 3. State Machines

Any state-driven behavior (Putli AI, capture struggle, menu screen flow) uses the shared FSM pattern from [[ARCHITECTURE]] §4: an explicit string-enum state list, and `enter(state)`/`update(state, dt)`/`exit(state)` handling — no ad hoc boolean-flag soups for state (e.g. no `isChasing && !isSearching && !justCaptured`-style flag combinations standing in for a real state). See [[AI_SYSTEM]] §8 for the canonical instance.

## 4. Events & Coupling

Cross-system communication goes through the lightweight event bus described in [[ARCHITECTURE]] §3/§5 (e.g. `putli:state-changed`), not direct imports between unrelated systems (e.g. `ai-putli` must never import `audio-manager` directly — it emits an event that `audio-manager` subscribes to). This keeps each system unit-testable in isolation per [[TESTING]] §2.

## 5. Performance-Sensitive Code

- No per-frame allocations in hot paths (`player-controller.update`, `ai-putli.update`, HUD refresh) — reuse vector/object instances, per [[PERFORMANCE]] §4.
- AI sensor checks and any other non-critical-path logic use the throttled tick pattern from [[AI_SYSTEM]] §3, not full per-frame execution, unless a specific system genuinely needs per-frame precision (player movement/collision does; AI sensing does not).

## 6. AI-Assisted Development Workflow

This project is built solo with AI pair-programming assistance. Conventions that make that workflow reliable:
- Every doc in this set (`GDD.md` through `TASKS.md`) is treated as ground truth an AI assistant should be pointed to before implementing a system — cross-references (`[[LikeThis]]`) exist specifically so a partial-context AI session can follow links to the authoritative spec instead of guessing.
- When an AI assistant proposes a value, mechanic, or asset not covered by these docs, resolve it by updating the relevant doc first (especially [[FEATURES]] and [[DATA_MODEL]]), then implement — keeps design and code from silently diverging.
- AI-generated code is reviewed by the solo dev for adherence to this file before merging — same bar as hand-written code, no separate lower standard.
- AI-assisted authorship is fine for code and original art per [[ASSETS]] §7's license-provenance caveat for shipped visual/audio assets specifically (not code).

## 7. Licensing Discipline

Any new asset must be added to [[ASSETS]] §5's license table in the same commit that introduces it — no "add the credit later" debt. Any new dependency must be added to [[TECH_STACK]] in the same commit.

## 8. Comments & Documentation

- Default to no comments; code should be self-explanatory through naming (see the project-wide "why, not what" rule — comments only for non-obvious constraints, e.g. *why* the QTE rejects same-key repeats, not restating the code).
- No stale TODOs left in merged code — either fix it now, or file a GitHub Issue and reference it in [[TASKS]] if it's a real deferred item.

## 9. Commit Conventions

Short, imperative commit messages (`Add Putli search-state hiding-spot check`, not `Added stuff`). One logical change per commit where practical. No direct commits to `main` bypassing the CI checks in [[DEPLOYMENT]] §3.

## 10. Testing Expectations

Any new non-trivial branching logic in a system listed in [[ARCHITECTURE]] §3 ships with at least one Vitest case per [[TESTING]] §2 before being considered done — not deferred to "add tests later."

## 11. Out of Scope

No enforced linter/formatter config is mandated by this doc beyond consistent manual adherence to the conventions above (a lightweight ESLint/Prettier setup is a reasonable early addition under [[TECH_STACK]] but isn't itself a design requirement) — the actual hard rule is the set of principles above, however they're enforced tooling-wise.
