# TASKS — KATPUTALI

Implementation task breakdown, phased for solo execution. Mirrors the milestones in [[PRD]] §8. Each milestone should be fully working (even if visually rough) before moving to the next — no milestone depends on an unfinished later one.

## M0 — Project Scaffold

- [ ] Init Git repo, `npm init`, install `playcanvas` + `vite` + `vitest` (see [[TECH_STACK]])
- [ ] Set up `/src` folder structure per [[ARCHITECTURE]] §2
- [ ] Bootstrap a minimal PlayCanvas app (`main.js`) rendering an empty scene with a camera
- [ ] Set up GitHub Actions CI (test + build) per [[DEPLOYMENT]] §3
- [ ] Deploy the empty scene to the chosen static host per [[DEPLOYMENT]] §2 — confirms the full pipeline works end to end before any real content exists
- [ ] Add CSP meta tag and base `index.html` per [[SECURITY]] §5

## M1 — Grey-Box Level & Player Movement

- [ ] Block out all 13 rooms/4 floors at correct scale using primitive geometry, per [[LEVEL_DESIGN]] §3
- [ ] Implement `player-controller`: move/look/sprint/crouch/stamina, capsule collider, step-up, per [[CONTROLS]], [[PHYSICS]] §2, §4
- [ ] Implement basic collision categories (static geometry, doors) per [[PHYSICS]] §3
- [ ] Implement `interaction` raycast + contextual prompt stub per [[GAME_MECHANICS]] §1
- [ ] First performance check against [[PERFORMANCE]] §1 baseline on grey-box geometry

## M2 — Putli AI

- [ ] Implement the FSM skeleton (Idle/Patrol/Investigate/Chase/Search/Capture) per [[AI_SYSTEM]] §2, using the shared pattern in [[ARCHITECTURE]] §4
- [ ] Bake navmesh from grey-box geometry, implement patrol-loop waypoints per [[LEVEL_DESIGN]] §8, [[AI_SYSTEM]] §5
- [ ] Implement hearing and sight sensors, throttled tick per [[AI_SYSTEM]] §3
- [ ] Implement Search-state hiding-spot check per [[AI_SYSTEM]] §4
- [ ] Wire difficulty preset values from [[DATA_MODEL]] §4 (no hardcoded tuning values)
- [ ] Unit tests for FSM transitions per [[TESTING]] §2
- [ ] First playtest pass: is Putli detectable/evadable on grey-box alone (audio can be temp/placeholder)?

## M3 — Inventory, Puzzles, Escape Routes

- [ ] Implement `inventory` system (5 slots, pickup/drop/combine) per [[GAME_MECHANICS]] §2
- [ ] Populate item/interactable data per [[DATA_MODEL]] §5–6, matching [[LEVEL_DESIGN]] §5–6 exactly
- [ ] Implement all 3 escape-route puzzle chains end-to-end (Gate, Baori, Rooftop) as interactable stations
- [ ] Implement hiding-spot interactables (enter/exit, peek) per [[GAME_MECHANICS]] §3
- [ ] Implement noise-trap floor tiles per [[GAME_MECHANICS]] §3, [[LEVEL_DESIGN]]
- [ ] Unit tests for `inventory` combine logic per [[TESTING]] §2
- [ ] Playtest: confirm all 3 routes are completable with no soft-locks (grey-box acceptable)

*Scope gate: after M3, any new Must/Should feature addition requires the trade-off process in [[FEATURES]] §5.*

## M4 — Capture Loop, Nazar, Prahar, Win/Lose

- [ ] Implement `capture-struggle` system: QTE input validation, success/failure branching, respawn logic per [[GAME_MECHANICS]] §4, [[CONTROLS]] §4
- [ ] Implement `nazar-meter` fill/mitigate/penalty logic per [[GAME_MECHANICS]] §5
- [ ] Implement `prahar-timer` countdown, penalty application, Prahar-5 loss trigger per [[GAME_MECHANICS]] §6
- [ ] Wire all 4 endings (3 win + Bound) per [[STORY]] §5, [[SCENARIO]] §5–6
- [ ] Implement `save-manager` (`localStorage` settings + notes log) per [[DATA_MODEL]] §2–3
- [ ] Unit tests for capture-struggle, nazar-meter, prahar-timer, save-manager per [[TESTING]] §2
- [ ] Full playtest: complete a run start-to-finish on grey-box for each ending

## M5 — Art Pass

- [ ] Model/texture all environment geometry per [[LEVEL_DESIGN]] room tables and [[ASSETS]] §1, §3, §6 budgets
- [ ] Model, rig, and animate Putli per [[CHARACTERS]] §2, [[ASSETS]] §4, retargeting Mixamo base animations
- [ ] Model/animate Meera's first-person arms/view model per [[CHARACTERS]] §1
- [ ] Author/texture all puzzle props, ward items, lore note props per [[LEVEL_DESIGN]] §5–6
- [ ] Lighting pass (baked/static, warm/cold contrast) per [[ASSETS]] §1
- [ ] Populate [[ASSETS]] §5 license table for every sourced asset as it's added
- [ ] Performance check against [[PERFORMANCE]] §2 budgets — trim before proceeding if over budget

## M6 — Audio & UI/UX Polish

- [ ] Source/record and implement all Putli state audio tells per [[AUDIO]] §2–3
- [ ] Implement player footstep/breathing/interact audio per [[AUDIO]] §2
- [ ] Implement ambient layers per floor/room per [[AUDIO]] §2
- [ ] Implement music stingers at key tension beats per [[AUDIO]] §2
- [ ] Build full HUD (Prahar clock, capture pips, Nazar meter, inventory bar) per [[UI_UX]] §2
- [ ] Build Title/Settings/Difficulty-Select/Pause/End screens per [[UI_UX]] §1, §4–5
- [ ] Implement captions for all critical audio cues per [[UI_UX]] §6, [[AUDIO]] §5
- [ ] Implement colorblind-safe HUD toggle, camera-shake slider per [[UI_UX]] §6
- [ ] Implement full rebinding (keyboard + gamepad) per [[CONTROLS]] §3
- [ ] Accessibility testing pass per [[TESTING]] §5

## M7 — Performance, QA, Release

- [ ] Full performance profiling + device sweep per [[PERFORMANCE]] §5, [[TESTING]] §6
- [ ] Run full regression checklist per [[TESTING]] §7
- [ ] `npm audit` clean, dependency review per [[SECURITY]] §3
- [ ] Final structured playtest pass (comprehension, completability, fairness, pacing, hiding-spot balance) per [[TESTING]] §4
- [ ] Finalize Credits screen with complete attribution list per [[ASSETS]] §5, [[UI_UX]] §5
- [ ] Tag `v1.0.0`, deploy via CI per [[DEPLOYMENT]] §3–4
- [ ] Post-launch: monitor GitHub Issues for player-reported bugs, triage against [[FEATURES]] scope

## Ongoing (all milestones)

- [ ] Keep [[DATA_MODEL]] §4 tuning values updated as playtesting feedback comes in (see [[TESTING]] §4)
- [ ] Keep [[ASSETS]] §5 license table current with every asset addition
- [ ] Keep this file's checkboxes updated as the single source of truth for "what's actually done" — if a task here is done but not checked, or checked but not done, fix the checkbox before starting new work
