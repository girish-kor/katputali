# SCENARIO — KATPUTALI

Beat-by-beat playthrough scenario, from boot to ending. This is the "walkthrough" reference used to validate that [[LEVEL_DESIGN]], [[GAME_MECHANICS]], and [[AI_SYSTEM]] actually add up to a completable, roughly 20–35 minute session (target session length, see [[PRD]] and [[GDD]]).

## 0. Frame

One night, one location (Haveli Kesar Mahal, Kathgarh), one antagonist (Putli). No day/hub structure, no travel between locations. Real-time night divided into **4 Prahars** (~3 real-world minutes each at Normal difficulty — see [[GAME_MECHANICS]] §6 for exact timer values) — reaching the start of Prahar 5 (Brahma Muhurta / pre-dawn) without escaping is a loss.

## 1. Opening Beat (0:00–1:30)

- Black screen, ambient village night sound, single title card line establishing Meera's arrival for her grandmother's rites (no voiceover — see [[STORY]] §6 on tone).
- Player gains control already inside the haveli's entrance hall (Room 1). Front gate is visibly barred from the courtyard side (a puzzle-object, not yet solvable — teaches the player this is *the* eventual exit).
- Tutorial prompts (skippable, see [[UI_UX]]) teach move / interact / inventory in this room only — no forced walk-and-talk.
- Ambient light: last of dusk through jaali screens. Putli is dormant/off-patrol for the first ~45 seconds (grace period) so the player can get oriented before any threat is live.

## 2. Inciting Beat (~1:30–3:00)

- Player finds Sohni Bai's first diary page in Room 1 or 2, hinting something is wrong with the house at night.
- First audible-but-not-visible Putli cue (distant wood-creak + bell) plays, establishing the threat exists before it's ever seen. This is the game's only scripted/forced audio cue — after this, all Putli audio is purely diegetic and state-driven (see [[AI_SYSTEM]]).
- Putli's AI activates fully at this point (patrol begins) — see [[AI_SYSTEM]] §2 for the activation trigger.

## 3. Core Loop (majority of playtime, ~15–25 minutes)

Repeats and interleaves freely — this is not a strict order, by design (open, Granny-style non-linear exploration):

1. **Explore** a room or floor area, watching/listening for Putli.
2. **Search** containers (almirahs, chests, drawers, niches) for puzzle items and lore notes — see [[GAME_MECHANICS]] §2 and [[LEVEL_DESIGN]] room tables for what's where.
3. **Evade** — if Putli's patrol enters the player's area, use noise discipline (crouch, stop sprinting) or duck into a hiding spot (see [[GAME_MECHANICS]] §3) until it disengages (Search → Patrol state, [[AI_SYSTEM]] §4).
4. **Solve** partial puzzles as items are collected — the three escape routes (Gate, Baori, Rooftop) are all progressable in parallel; the player is never gated onto one path (see [[LEVEL_DESIGN]] §5).
5. **Manage Nazar (curse) meter** — passively rises over time and spikes near certain rooms/props; player uses found ward items (neem bundle, kalava thread) to reduce it before it triggers a hallucination penalty (see [[GAME_MECHANICS]] §5).
6. **Risk capture** — if spotted and chased and caught, enter the Capture beat (below), then resume exploration from a nearby room, missing whatever was held.

Design intent: a player who plays cautiously can complete any one route in ~15 minutes of real time within the 4-Prahar budget; a player who explores fully (all three routes, all lore) uses closer to the full budget. See [[TESTING]] §4 for how this pacing is validated.

## 4. Capture Beat (can occur 0–2 times without ending the run)

1. Putli catches the player (state machine reaches Capture — [[AI_SYSTEM]] §2).
2. Screen-constrict transition (no gore, no violence depicted) — player is shown bound in the courtyard puppet-stage cage (Room 0 / central courtyard, see [[LEVEL_DESIGN]]).
3. **Struggle minigame**: timed alternating-input QTE (see [[CONTROLS]] §4, [[GAME_MECHANICS]] §4) — succeed to break free and respawn at a nearby safe room, having dropped one currently-held (non-quest-critical) item; fail the timer and Putli's Prahar clock advances by a penalty amount, then a second struggle attempt is granted automatically (only the *third total capture* is fatal, matching Granny's three-strike convention referenced in [[GDD]]).
4. Capture count increments in the HUD (see [[UI_UX]] §2).

## 5. Escape Beats (three variants, mutually exclusive per playthrough — first one completed ends the game)

- **Gate route:** reassemble the 3-piece iron key at the ground-floor smithy nook, or solve the diya-pattern lock using the fresco clue in the library, then interact with the front gate in Room 1.
- **Baori route:** repair the stepwell pulley (3 parts) in the basement, light the passage with the recovered oil torch, then interact with the tunnel grate.
- **Rooftop route:** rig the zipline (rope + hook + counterweight) at the rooftop chhatri, then interact with the launch point.

Full puzzle steps and item locations are specified in [[LEVEL_DESIGN]] §5–6 and [[GAME_MECHANICS]] §2. Completing any one route triggers that route's ending cinematic (short, ~10–20s, camera-only — no new gameplay systems) as defined in [[STORY]] §5.

## 6. Loss Beats

- **Third capture:** Bound ending plays immediately (no further struggle chance) — see [[STORY]] §5.
- **Prahar timer reaches Prahar 5:** regardless of player position, a short forced sequence plays (lights fail, Putli converges on player's last known position) leading to the same Bound ending. This is the only case where the game takes control away from the player before an ending — kept intentionally short (<15s) to respect player agency, per [[UI_UX]] design principles.

## 7. Post-Game

- Any ending returns to a minimal results screen: elapsed Prahars, capture count, ending name, notes-found count (out of 6) — no scoring/leaderboard (no backend, see [[ARCHITECTURE]] and [[SECURITY]]).
- "Retry" restarts a fresh run (Prahar timer, item state, and Putli state all reset — see [[DATA_MODEL]] §2 for what persists vs. resets between runs, which is only settings and a "notes found" completionist log).
