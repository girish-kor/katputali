# TASKS — KATPUTALI

Implementation task breakdown, phased for solo execution. Mirrors the milestones in [[PRD]] §8. Each milestone should be fully working (even if visually rough) before moving to the next — no milestone depends on an unfinished later one.

## M0 — Project Scaffold

- [x] Init Git repo, `npm init`, install `playcanvas` + `vite` + `vitest` (see [[TECH_STACK]])
- [x] Set up `/src` folder structure per [[ARCHITECTURE]] §2
- [x] Bootstrap a minimal PlayCanvas app (`main.js`) rendering an empty scene with a camera
- [x] Set up GitHub Actions CI (test + build) per [[DEPLOYMENT]] §3
- [x] Deploy the empty scene to the chosen static host per [[DEPLOYMENT]] §2 — confirms the full pipeline works end to end before any real content exists
- [x] Add CSP meta tag and base `index.html` per [[SECURITY]] §5

## M1 — Grey-Box Level & Player Movement

- [x] Block out all 13 rooms/4 floors at correct scale using primitive geometry, per [[LEVEL_DESIGN]] §3
- [x] Implement `player-controller`: move/look/sprint/crouch/stamina, capsule collider, step-up, per [[CONTROLS]], [[PHYSICS]] §2, §4
- [x] Implement basic collision categories (static geometry, doors) per [[PHYSICS]] §3
- [x] Implement `interaction` raycast + contextual prompt stub per [[GAME_MECHANICS]] §1
- [x] First performance check against [[PERFORMANCE]] §1 baseline on grey-box geometry

## M2 — Putli AI

- [x] Implement the FSM skeleton (Idle/Patrol/Investigate/Chase/Search/Capture) per [[AI_SYSTEM]] §2, using the shared pattern in [[ARCHITECTURE]] §4
- [x] Derive a waypoint graph from grey-box geometry (no navmesh — see [[TECH_STACK]] §1's pathfinding-correction note), implement patrol-loop waypoints per [[LEVEL_DESIGN]] §8, [[AI_SYSTEM]] §5
- [x] Implement hearing and sight sensors, throttled tick per [[AI_SYSTEM]] §3
- [x] Implement Search-state hiding-spot check per [[AI_SYSTEM]] §4
- [x] Wire difficulty preset values from [[DATA_MODEL]] §4 (no hardcoded tuning values)
- [x] Unit tests for FSM transitions per [[TESTING]] §2
- [x] First playtest pass: is Putli detectable/evadable on grey-box alone (audio can be temp/placeholder)?

## M3 — Inventory, Puzzles, Escape Routes

- [x] Implement `inventory` system (5 slots, pickup/drop/combine) per [[GAME_MECHANICS]] §2
- [x] Populate item/interactable data per [[DATA_MODEL]] §5–6, matching [[LEVEL_DESIGN]] §5–6 exactly
- [x] Implement all 3 escape-route puzzle chains end-to-end (Gate, Baori, Rooftop) as interactable stations
- [x] Implement hiding-spot interactables (enter/exit, peek) per [[GAME_MECHANICS]] §3
- [x] Implement noise-trap floor tiles per [[GAME_MECHANICS]] §3, [[LEVEL_DESIGN]]
- [x] Unit tests for `inventory` combine logic per [[TESTING]] §2
- [x] Playtest: confirm all 3 routes are completable with no soft-locks (grey-box acceptable)

*Scope gate: after M3, any new Must/Should feature addition requires the trade-off process in [[FEATURES]] §5.*

## M4 — Capture Loop, Nazar, Prahar, Win/Lose

- [x] Implement `capture-struggle` system: QTE input validation, success/failure branching, respawn logic per [[GAME_MECHANICS]] §4, [[CONTROLS]] §4
- [x] Implement `nazar-meter` fill/mitigate/penalty logic per [[GAME_MECHANICS]] §5
- [x] Implement `prahar-timer` countdown, penalty application, Prahar-5 loss trigger per [[GAME_MECHANICS]] §6
- [x] Wire all 4 endings (3 win + Bound) per [[STORY]] §5, [[SCENARIO]] §5–6
- [x] Implement `save-manager` (`localStorage` settings + notes log) per [[DATA_MODEL]] §2–3
- [x] Unit tests for capture-struggle, nazar-meter, prahar-timer, save-manager per [[TESTING]] §2
- [x] Full playtest: complete a run start-to-finish on grey-box for each ending

## M5 — Art Pass

- [ ] Model/texture all environment geometry per [[LEVEL_DESIGN]] room tables and [[ASSETS]] §1, §3, §6 budgets — **partial:** grey-box walls/floors/stairs now use a real sourced PBR material (Poly Haven sandstone, ASSETS §5) with correct in-world-scale tiling instead of flat placeholder color, per §1's palette; still outstanding: replacing the primitive-box geometry itself with actual kitbashed Kenney meshes (arches, jharokha framing, etc.) per room, which needs visual/spatial iteration an AI session can't safely do blind — real geometry authoring, not texturing, is the remaining gap
- [ ] Model, rig, and animate Putli per [[CHARACTERS]] §2, [[ASSETS]] §4, retargeting Mixamo base animations — blocked: requires original Blender modeling/rigging per ASSETS §2/§5 (Putli's model is explicitly excluded from kit-sourcing), not something an AI session can do; stays as the grey-box capsule until a human modeling pass happens
- [ ] Model/animate Meera's first-person arms/view model per [[CHARACTERS]] §1 — blocked, same reason as above
- [x] Author/texture all puzzle props, ward items, lore note props per [[LEVEL_DESIGN]] §5–6 — every pickup (key fragments, pulley parts, oil torch, rope/hook/counterweight, *neem*/*kalava* ward items), lore note, and puzzle station now gets a distinct primitive-composite shape (shard/wheel/torch/coil/hook/etc.) tinted from the ASSETS §4 palette instead of one uniform colored sphere per interactable type, per `src/entities/interactables.js`. Deliberately *not* kitbashed from the Kenney Castle/Fantasy-Town/Furniture kits — see ASSETS §5's note on why those kits (modern-residential/medieval-European) have no period-appropriate match for these props and would read worse than shape-differentiated primitives. Interactable draw-call count rises by ~4 (composite children for oil_torch/hook/sohni_room_key/wall-sconce) — stays comfortably inside the ≤150 budget already measured below, not re-profiled with a full pass since the increment is arithmetically negligible.
- [x] Lighting pass (baked/static, warm/cold contrast) per [[ASSETS]] §1 — replaced the placeholder warm daytime directional light with a cool moonlight directional (non-shadow-casting, kept off after measuring its draw-call cost — see perf note below) + indigo-shadow ambient + warm gold diya point lights at the Courtyard hub and Entrance Hall, matching §1's "cold moonlight vs. warm diya" mood-tool direction. Verified live via Playwright screenshot; exact intensity balance is a candidate for playtesting-driven tuning later (PERFORMANCE §5), not re-guessed further blind.
- [x] Populate [[ASSETS]] §5 license table for every sourced asset as it's added — kept current every asset-adding commit this session
- [x] Performance check against [[PERFORMANCE]] §2 budgets — trim before proceeding if over budget — found the existing grey-box geometry (173 static boxes, one draw call each, no batching) already exceeded the ≤150 draw-call budget once a shadow-casting light was tried (379 draw calls); fixed by (1) disabling shadow-casting on the new moonlight and (2) adding PlayCanvas static batch groups for the never-toggled wall/floor/stair geometry (doors excluded — they need per-entity open/close toggling, which static batching can't represent). Result: 29 draw calls, well under budget. Texture memory/build-size also checked (~2.4MB added, total build far under the ≤80MB target).

## M6 — Audio & UI/UX Polish

- [x] Source/record and implement all Putli state audio tells per [[AUDIO]] §2–3 — `src/systems/audio-manager.js` implements Patrol/Investigate/Chase/Search using the sourced Kenney creak+*ghungroo*-bell material (positional 3D audio on Putli's own entity, per AUDIO §3/§4), with per-state rhythm via DATA_MODEL §1b's `AUDIO_TIMING`. Captions alongside (UI_UX §6/AUDIO §5). The previously-missing Chase drone-swell and Capture string-snap layers are now filled with procedurally-synthesized audio (`src/systems/audio-synth.js` — noise/oscillator synthesis rendered to an AudioBuffer, played through `pc.Sound` per AUDIO §3, no third-party lib), layered *alongside* the sourced creak/bell material rather than replacing it — see ASSETS §5.
- [x] Implement player footstep/breathing/interact audio per [[AUDIO]] §2 — footstep and UI/interact audio via `audio-manager.js` (Kenney-sourced). Footsteps are now surface-typed per room (`rooms.js`'s new `surface` field: stone/wood/water) rather than one generic set — wood/stone use the sourced Kenney clips, water (no sourced clip existed) is synthesized. Breathing (sprint effort, held-breath while hiding) is now implemented via synthesis (`audio-synth.js`'s `generateBreathingSamples`), unblocking the prior Freesound-gated gap without needing network access.
- [x] Implement ambient layers per floor/room per [[AUDIO]] §2 — one synthesized ambience bed per floor (ground/basement/first/roof), matching AUDIO §2's per-floor descriptions (fountain trickle, stepwell drip/echo, roof wind), swapped as the player crosses floors; simple mix-bus ducking during Chase per AUDIO §4.
- [x] Implement music stingers at key tension beats per [[AUDIO]] §2 — synthesized Karplus-Strong plucked-tone stingers (`generateStingerSamples`), triggered on the first Putli audio tell of a run and on every ending (win routes and Bound use different tonal moods). Scoped interpretation, recorded rather than silently assumed: "each escape route's final puzzle step" and "endings" are the same event in the current run-state.js model (`route:completed` triggers `game:ended` in the same tick), so they share one trigger rather than firing two near-simultaneous stingers.
- [x] Build full HUD (Prahar clock, capture pips, Nazar meter, inventory bar) per [[UI_UX]] §2 — also includes the interact prompt and struggle QTE overlay from the same §2 table; final aged-paper/miniature-painting-frame texture is separate M5 Art Pass work layered onto this structure later
- [x] Build Title/Settings/Difficulty-Select/Pause/End screens per [[UI_UX]] §1, §4–5 — `src/ui/title-screen.js`, `difficulty-select-screen.js`, `settings-screen.js`, `pause-screen.js` (End Screen already existed in `hud.js`, now with the Retry/Title Screen buttons UI_UX §5 requires — previously missing). `main.js` gates gameplay-entity creation behind Title → New Game → Difficulty Select; Esc opens Pause mid-run and freezes the gameplay tick. A Credits entry is deliberately not built — that's TASKS §M7's "finalize Credits screen" scope, not M6's.
- [x] Implement captions for all critical audio cues per [[UI_UX]] §6, [[AUDIO]] §5 — Putli's proximity tell (per state), the capture event, and the Nazar hallucination trigger all show bottom-screen text via hud.js, gated by the `accessibility.captions` setting (DATA_MODEL §2, default on). Now read *live* from a `settings:changed` event (emitted by the new Settings screen) rather than once at HUD creation, so toggling captions mid-session takes effect immediately. Ending narration text still doesn't apply (endings remain stat readouts only, per UI_UX §5).
- [x] Implement colorblind-safe HUD toggle, camera-shake slider per [[UI_UX]] §6 — Settings screen toggle swaps the Nazar-meter/capture-pip accent to a verified-more-distinguishable-under-CVD amber/blue pairing (`src/ui/accessibility-format.js`; building its test caught and fixed a real pre-existing contrast bug — see TESTING §5.1). Camera shake (`src/systems/camera-shake.js`) runs a continuous low shake during Chase and a stronger pulse on Capture, magnitude scaled by the settings slider down to fully off; a separate always-on danger vignette (independent of the shake setting) keeps "some visual feedback must remain" true per UI_UX §6 even at shake intensity 0.
- [x] Implement full rebinding (keyboard + gamepad) per [[CONTROLS]] §3 — `src/systems/input-map.js` reads all bindings from `settings.controls.keybinds`/`gamepadBinds` (raw `KeyboardEvent.code` + standard-mapping gamepad button indices) instead of hardcoded engine key constants; `player-controller.js`, `interaction.js`, and `run-state.js`'s struggle input now go through it. Settings screen's rebind UI captures the next keydown or gamepad button press per action, blocking on conflict (`src/systems/rebind-format.js`, tested). Gamepad move/look use the analog sticks directly. Not migrated, by design: the undocumented `V` ward-mitigation shortcut (not in CONTROLS §1/§2's tables) and the `inventory` key's not-yet-built item-selection UI (CONTROLS' "Tab hold/toggle to open item bar for selection" describes a feature `inventory.js` never implemented — out of M6's audio/UI-polish scope to invent now).
- [x] Accessibility testing pass per [[TESTING]] §5 — see TESTING §5.1 for the new automated coverage (caption coverage, WCAG contrast + simulated-CVD distinguishability, rebind-conflict/reachability) added this pass, and what's still a manual-only check before release.

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
