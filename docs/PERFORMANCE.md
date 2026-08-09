# PERFORMANCE — KATPUTALI

Performance targets and budgets. Enforced from the grey-box milestone onward (see [[TASKS]] M1), not retrofitted at the end — matches [[PRD]] §6 non-functional requirements.

## 1. Targets

| Metric | Target | Rationale |
|---|---|---|
| Frame rate (mid-range 2020-era laptop iGPU, Chrome/Firefox) | ≥45 fps average, ≥30 fps floor | [[PRD]] §4 success criterion |
| Frame rate (dedicated GPU desktop) | 60 fps (uncapped or vsync) | Comfortable headroom above baseline |
| Initial load time (typical broadband) | ≤15s to interactive title screen | [[PRD]] §4 |
| Total build size (compressed) | ≤150MB, target ≤80MB | Keeps load time and free-hosting bandwidth reasonable — see [[DEPLOYMENT]] §2 |
| Memory footprint | ≤1GB browser tab RSS | Avoids tab crashes on lower-end laptops |

## 2. Scene & Asset Budgets

Whole haveli loads as one scene (see [[ARCHITECTURE]] §6) — budgets are for the *entire* level, not per-room, since everything is resident simultaneously:

| Category | Budget |
|---|---|
| Total scene triangle count | ≤400,000 tris (stylized low-poly per [[ASSETS]] §1 keeps this comfortable) |
| Draw calls (steady state) | ≤150, achieved via texture atlasing and material batching across the 13 rooms in [[LEVEL_DESIGN]] |
| Texture resolution — hero props (Putli, key items) | Up to 1024×1024 |
| Texture resolution — environment/kitbash | 512×512 typical, atlased where possible |
| Texture memory total | ≤256MB VRAM |
| Putli character (model + rig) | ≤8,000 tris, single skinned mesh, single material where feasible |
| Meera arms/hands (first-person view model) | ≤4,000 tris |
| Skybox/HDRI | Single baked/compressed cubemap, not a runtime-heavy dynamic sky |

## 3. Load Time Strategy

- Single static asset bundle, no level streaming needed given the small footprint (see [[ARCHITECTURE]] §6, [[LEVEL_DESIGN]] §1).
- Textures compressed to GPU-friendly formats where the target browser/engine pipeline supports it (e.g. Basis/KTX2 via PlayCanvas's texture pipeline) to reduce both download size and VRAM.
- Audio compressed to Ogg Vorbis (see [[AUDIO]] §3), short clips, no uncompressed WAV shipped in the production build.
- A minimal loading screen (see [[UI_UX]] §1 flow, inserted between Difficulty Select and In-Game) covers asset load; no mid-scene hitching expected given the up-front single-load approach.

## 4. Runtime Performance Practices

- AI sensor checks (Putli hearing/sight) run on a throttled tick (~150–200ms interval), not every frame — see [[AI_SYSTEM]] §3.
- Physics/collision uses PlayCanvas's lightweight built-in system, not Ammo.js, avoiding a heavy WASM physics step every frame — see [[PHYSICS]] §1.
- No per-frame garbage-generating allocations in hot paths (player movement, AI update, HUD refresh) — reuse vectors/objects per [[CODING_RULES]] performance conventions, to avoid GC-driven frame hitches.
- Positional audio limited to a small number of concurrent emitters (Putli + player + a handful of ambience sources) — no large simultaneous SFX pools.
- Lighting: baked/static lighting preferred over multiple real-time dynamic lights, consistent with the stylized flat-shaded art direction in [[ASSETS]] §1.

## 5. Profiling & Validation Plan

- Use PlayCanvas's built-in stats/profiler (frame time, draw calls, triangle count) during development, checked at the end of each milestone from M1 onward (see [[TASKS]]).
- Manual device sweep before release: at least one mid-range laptop (integrated GPU), one higher-end desktop, across Chrome and Firefox at minimum (Edge/Safari spot-checked) — see [[TESTING]] §3, §5.
- Any milestone that regresses the frame-rate floor below target blocks progression to the next milestone (performance debt is paid down immediately, not deferred to a "polish pass" that may not have time left — solo-dev risk mitigation per [[PRD]] §9).

## 6. Out of Scope

No dynamic level-of-detail (LOD) system (scene is small enough not to need it), no occlusion culling beyond PlayCanvas's default frustum culling, no platform-specific performance tiers/quality presets beyond the difficulty settings already covering gameplay tuning (a single quality profile ships, sized to the baseline target above).
