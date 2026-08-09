# Game Design Document — KATPUTALI

**Status:** v1.0 scope-locked · **Genre:** First-person stealth-escape horror · **Platform:** Browser (desktop) · **Players:** 1 (single-player only) · **Engine:** PlayCanvas (see [[TECH_STACK]])

This is the master design reference. It summarizes every system at a design level; implementation detail lives in the linked docs. If this document and a linked doc ever disagree, this document wins and the other doc should be corrected.

## 1. One-Line Pitch

A short, single-player browser horror game where you must escape a cursed Rajasthani haveli before a puppet-spirit named Putli catches you three times or dawn arrives — inspired by *Granny*'s capture-and-escape loop, reimagined through Rajasthani folklore, architecture, and art.

## 2. Design Pillars

1. **Small and finishable.** One location, one enemy, one ~20–35 minute session. Every feature decision is filtered through "does this fit a solo dev's zero-cost, browser-first scope?" — see [[FEATURES]] and [[PRD]].
2. **Fair dread, not cheap scares.** The player can always hear Putli coming (see [[AUDIO]], [[AI_SYSTEM]]). Jump-scares are rare and earned, not spammed.
3. **Folklore-authentic, not costume-horror.** Rajasthani architecture, art direction, and mythic logic (tantra, wards, kathputli puppetry) are researched and used with respect, not generic "spooky India" set dressing. See [[STORY]] and [[ASSETS]].
4. **Granny-structure, not Granny-clone.** Keep the proven skeleton (explore → item-puzzles → 3-strike stealth → multiple exits → timer) but every mechanic, item, room, and character is original to this setting.

## 3. Core Gameplay Loop

`Explore rooms → find/combine items → solve one of 3 escape-route puzzles → evade or survive Putli encounters (max 2 non-fatal captures) → escape before Prahar 5 (dawn)`

Full breakdown in [[GAMEPLAY]] and beat-by-beat walkthrough in [[SCENARIO]].

## 4. Win / Lose Conditions

- **Win:** Complete any one of the three escape routes (Gate / Baori / Rooftop) — see [[LEVEL_DESIGN]] §5, [[SCENARIO]] §5.
- **Lose:** Third capture by Putli, or in-game clock reaches Prahar 5 without escaping — see [[SCENARIO]] §6, [[GAME_MECHANICS]] §6.

No partial-progress save mid-run (a run is short by design); settings and a completionist "notes found" log persist between runs via `localStorage` (see [[DATA_MODEL]]).

## 5. World

**Setting:** Haveli Kesar Mahal, fictional town of Kathgarh, Rajasthan, present day, one night. Three floors: basement (stepwell/*baori*), ground floor (courtyard, kitchen, smithy nook, entrance), first floor (bedrooms, library, family shrine), and rooftop (*chhat* with *chhatris*). Full room-by-room layout in [[LEVEL_DESIGN]].

**Architecture & art direction:** Sandstone haveli construction, central *aangan* (courtyard) as the hub space, *jharokha* balconies, carved *jaali* lattice screens (used for both visual atmosphere and gameplay — sightlines/hiding, see [[GAME_MECHANICS]] §3), fresco walls, *chhatri* domes on the roof. Stylized low-poly art style for performance; palette drawn from Rajasthani miniature painting (indigo, ochre, vermillion, gold) against cold moonlight blues. Full direction in [[ASSETS]].

## 6. Characters

Two characters total by design: Meera Kanwar (player) and Putli (antagonist). Full bios, visual design, and rationale for keeping the cast this small in [[CHARACTERS]].

## 7. Core Systems Summary

| System | Summary | Full spec |
|---|---|---|
| Stealth & noise | Crouch/walk/sprint noise levels, hiding spots, Putli sight cone + hearing radius | [[GAME_MECHANICS]] §3, [[AI_SYSTEM]] |
| Inventory & puzzles | Small carry-limited inventory, combine/use items to solve 3 escape routes | [[GAME_MECHANICS]] §2, [[LEVEL_DESIGN]] §5–6 |
| Capture & struggle | 3-strike capture system with a QTE struggle minigame | [[GAME_MECHANICS]] §4, [[SCENARIO]] §4 |
| Curse (Nazar) meter | Passive dread meter, mitigated with ward items, triggers hallucination penalty at max | [[GAME_MECHANICS]] §5 |
| Prahar timer | 4-Prahar real-time countdown to dawn/loss | [[GAME_MECHANICS]] §6 |
| Enemy AI | Idle/Patrol/Investigate/Chase/Search/Capture state machine | [[AI_SYSTEM]] |
| Difficulty | Easy/Normal/Hard presets scaling AI + timer values | [[GAME_MECHANICS]] §7, [[DATA_MODEL]] |

## 8. UI/UX Summary

Minimal diegetic-leaning HUD: Prahar clock, capture pips (3), Nazar meter, small inventory bar. Menu flow: Title → (New Game / Continue Settings / Credits) → Game → End Screen. Full spec in [[UI_UX]]; input scheme in [[CONTROLS]].

## 9. Audio Direction

Diegetic-first sound design — Putli's wood-creak/*ghungroo* audio is the primary fairness and tension tool. Sparse, folk-instrument-inspired ambient score (public-domain/CC-licensed sources only). Full spec in [[AUDIO]].

## 10. Technical Summary

PlayCanvas Engine (npm, code-first) + Vite, static-hosted, zero backend, zero-cost hosting (GitHub Pages/Cloudflare Pages/itch.io). Full stack in [[TECH_STACK]] and [[ARCHITECTURE]]; performance targets in [[PERFORMANCE]].

## 11. Scope Boundaries (hard "won't do" list)

No multiplayer, no mobile/touch support in v1, no voice acting, no second enemy, no procedural level generation, no monetization/IAP, no analytics/telemetry, no user accounts or cloud save, no paid asset or service dependency. See [[FEATURES]] for the full MoSCoW table and [[PRD]] for the product-level rationale.

## 12. Success Definition

A first-time player can, without external help, understand the goal within 2 minutes, complete one full escape route within 35 minutes, and describe the setting as "distinctly Rajasthani horror" rather than "generic haunted house." See [[PRD]] §4 for measurable success criteria and [[TESTING]] for how this is validated pre-release.
