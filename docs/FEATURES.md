# FEATURES — KATPUTALI

MoSCoW feature scope for v1. This is the project's hard scope-control document — when in doubt about whether to build something, check here first. Anything not listed as Must/Should is not built without first adding it here.

## 1. Must Have (v1 cannot ship without these)

- First-person movement: walk, sprint (stamina-limited), crouch — [[CONTROLS]], [[PHYSICS]]
- Single haveli location, 13 rooms across 4 floors — [[LEVEL_DESIGN]]
- Putli AI: full state machine (Idle/Patrol/Investigate/Chase/Search/Capture) — [[AI_SYSTEM]]
- Stealth system: noise levels, sight cone, hearing radius, 7 hiding spots — [[GAME_MECHANICS]] §3
- Inventory (5 slots) + item pickup/combine puzzle chains for 3 escape routes — [[GAME_MECHANICS]] §2, [[LEVEL_DESIGN]] §5
- Capture/struggle system, 3-strike loss condition — [[GAME_MECHANICS]] §4
- Nazar (curse) meter with ward-item mitigation — [[GAME_MECHANICS]] §5
- Prahar timer (4-Prahar countdown, dawn loss condition) — [[GAME_MECHANICS]] §6
- 3 win endings + 1 loss ending — [[STORY]] §5
- HUD (Prahar clock, capture pips, Nazar meter, inventory bar, interact prompts) — [[UI_UX]] §2
- Title/Settings/Difficulty-Select/Pause/End screens — [[UI_UX]] §1
- Rebindable keyboard + gamepad controls — [[CONTROLS]]
- Positional audio for all Putli states + captions for all critical cues — [[AUDIO]], [[UI_UX]] §6
- Settings persistence via `localStorage` — [[DATA_MODEL]] §2
- 3 difficulty presets (Easy/Normal/Hard) — [[GAME_MECHANICS]] §7
- Full art pass matching the Rajasthani-folklore direction (not grey-box) — [[ASSETS]]
- Runs at target performance on the baseline hardware — [[PERFORMANCE]]
- Zero-cost, zero-account static deployment — [[DEPLOYMENT]]

## 2. Should Have (strongly desired, cut only if timeline truly demands it — see [[TASKS]] milestone gating)

- 6 lore diary notes with full text — [[STORY]] §4, [[LEVEL_DESIGN]] §6
- Colorblind-safe HUD accessibility toggle — [[UI_UX]] §6
- Completionist "notes found" / "endings seen" tracking screen — [[DATA_MODEL]] §3, [[UI_UX]] §5
- In-game Credits screen listing all asset attributions — [[ASSETS]] §5
- Camera-shake/effect intensity accessibility slider — [[UI_UX]] §6
- Skippable tutorial prompts in the opening room — [[SCENARIO]] §1

## 3. Could Have (nice-to-have, only after all Must/Should are done and stable)

- Dynamic input-icon prompts (keyboard vs. gamepad glyphs auto-switching) — [[CONTROLS]] §5
- A short animated title-screen vignette (in place of a static title card)
- Additional ambient one-off environmental audio/visual details (e.g. a wandering courtyard peacock silhouette) that add atmosphere without touching gameplay systems

## 4. Won't Have (v1 — explicit exclusions, revisit only via a future scope decision)

- Multiplayer or any networked feature — [[PRD]] §3, [[ARCHITECTURE]] §9
- Mobile/touch input support — [[CONTROLS]] §5, [[UI_UX]] §8
- A second enemy type or hard-mode additional hunter — [[CHARACTERS]] §4
- Procedural level generation — [[LEVEL_DESIGN]] §9
- Mid-run save/resume — [[PRD]] §5.10
- Voice acting / spoken dialogue — [[CHARACTERS]] §1
- Localization beyond English — [[UI_UX]] §8
- Leaderboards, scoring, or social sharing — [[UI_UX]] §5
- Any monetization (ads, IAP, paid DLC) — [[PRD]] §1
- User accounts or cloud save — [[SECURITY]] §2
- Analytics/telemetry SDKs of any kind — [[SECURITY]] §2
- Combat mechanics of any kind — [[GAMEPLAY]] §7
- Ragdoll physics, destructible objects, vehicle physics — [[PHYSICS]] §7
- Third-party physics/audio middleware (Ammo.js, Howler, Wwise/FMOD) — [[TECH_STACK]] §7
- Paid assets, paid hosting, or paid CI — [[PRD]] §7

## 5. Scope-Change Process

Any addition to Must/Should after milestone M3 (see [[TASKS]]) requires removing or downgrading an existing item of equal-or-greater effort first — this document is a budget, not a wishlist. Any Won't-Have item being reconsidered must be promoted here explicitly before any code is written for it.
