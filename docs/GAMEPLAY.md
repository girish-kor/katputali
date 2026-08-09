# GAMEPLAY — KATPUTALI

Moment-to-moment player experience. For system-level implementation detail see [[GAME_MECHANICS]]; for the scripted beat order see [[SCENARIO]]; for enemy behavior see [[AI_SYSTEM]].

## 1. Session Shape

- **Length:** One continuous session, 20–35 minutes, no save-and-resume mid-run (see [[PRD]] §5.10, [[DATA_MODEL]] §2).
- **Structure:** Single location, non-linear exploration, real-time countdown pressure (4 Prahars). No levels/stages to select — the whole haveli is open from minute one.
- **Replayability:** Three distinct escape routes, difficulty presets, and a "find all 6 notes" completionist goal give reasons to replay without needing procedural content (see [[FEATURES]]).

## 2. Player Goals (in priority order, all pursued simultaneously)

1. **Survive** — avoid Putli, or escape her if caught (max 2 non-fatal captures).
2. **Explore** — find items, notes, and ward objects scattered through the haveli.
3. **Solve** — progress one or more of the three escape-route puzzle chains.
4. **Escape** — complete one full route before the Prahar 5 deadline.

## 3. Difficulty Settings

Selected at the title screen, cannot be changed mid-run (keeps the Prahar timer and AI tuning consistent for a session). Three presets — Easy, Normal, Hard — scale Putli's hearing radius, patrol speed, search persistence, and the Prahar duration. Exact values are data, not hardcoded — see [[DATA_MODEL]] §4 and [[GAME_MECHANICS]] §7. Default preset: **Normal**.

## 4. Moment-to-Moment Loop

A typical minute of play alternates between these player postures:

- **Cautious exploration:** walking pace, checking sightlines through *jaali* screens and doorways before entering a room, listening for Putli's wood-creak/bell cue (see [[AUDIO]]).
- **Active search:** opening containers, reading notes, picking up/combining items — all via the interact prompt (see [[CONTROLS]] §2).
- **Reactive stealth:** on hearing Putli approach, the player chooses to freeze, retreat, or duck into a hiding spot; sprinting is a last resort since it is the loudest movement state (see [[GAME_MECHANICS]] §3).
- **Puzzle execution:** at fixed interactable stations (smithy nook, stepwell pulley, rooftop chhatri), combining/using carried items to advance a route.
- **Recovery:** after a close call or capture, a brief safe moment to check the Nazar meter and use a ward item if needed (see [[GAME_MECHANICS]] §5).

## 5. Feedback the Player Always Has Access To

- Distance/intensity cue for Putli via audio panning/volume (never a UI radar — see [[AI_SYSTEM]] §7 on why no minimap/enemy-tracker exists, to preserve tension).
- HUD Prahar clock (time pressure), capture pips (how many strikes left), Nazar meter (curse pressure), inventory bar (current items) — full spec in [[UI_UX]] §2.
- Interact prompts only appear when in range of something usable — no permanent objective marker/waypoint arrow (deliberate: exploration and memory are part of the challenge).

## 6. Win / Lose (see [[GDD]] §4 for the authoritative statement)

Win by completing any one escape route. Lose on a third capture or on the Prahar timer reaching Prahar 5. Both are covered in full in [[SCENARIO]] §5–6.

## 7. What This Game Deliberately Does Not Ask of the Player

No combat inputs, no precision platforming, no timed reflex sequences outside the short capture-struggle QTE, no reading-heavy exposition gating progress, no backtracking required by design (all three routes are reachable from the central courtyard hub — see [[LEVEL_DESIGN]] §3). This keeps the skill floor low and the tension curve the primary difficulty driver, consistent with the Granny-inspired genre target (see [[GDD]] §2).
