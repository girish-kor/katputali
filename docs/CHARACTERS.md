# CHARACTERS — KATPUTALI

Full cast is two characters. This is deliberate — see [[FEATURES]] for scope rationale. Lore names referenced but never seen on-screen (Bhairo Nath, Sohni Bai) are covered here for completeness since they inform visual/audio design.

## 1. Meera Kanwar (Player Character)

- **Role:** Playable protagonist, first-person (body not visible except hands/shadow — see [[CONTROLS]] and [[UI_UX]]).
- **Age / background:** 24, grew up partly in this haveli, now lives in Jaipur. Practical, not a fighter — the design intent is "resourceful visitor," not "trained survivor," which justifies why she never fights back.
- **Visual design:** Simple modern travel clothing (kurta + dupatta, walking shoes) — a light present-day silhouette against the haveli's historical architecture, reinforcing "outsider returning to old family history." Dupatta color: dusty rose, doubles as a readable silhouette accent in dark scenes without being a light source.
- **Voice:** No voiced dialogue (cost/scope control). Non-verbal vocalizations only (breathing, gasps, effort grunts on sprint/hide) sourced per [[AUDIO]].
- **Player-facing stats:** None visible as numbers except the HUD elements defined in [[UI_UX]] (Prahar clock, capture count, inventory, Nazar meter). No health bar — capture count is the failure resource, matching Granny's "no HP, capture-based" loop (see [[GAME_MECHANICS]]).
- **Capabilities:** Walk, sprint (limited stamina), crouch, interact, pick up/combine items, hide, peek from hiding spots. No combat, no jumping puzzles beyond simple step-ups (see [[PHYSICS]]).

## 2. Putli (Antagonist)

- **Role:** Sole enemy AI, patrols and hunts Meera through the haveli. Full behavioral spec in [[AI_SYSTEM]].
- **Nature:** An animated wooden marionette approximately 1.65m tall, carved in a stylized human likeness, possessed by the bound spirit of puppeteer Bhairo Nath (see [[STORY]]). Not undead, not a "monster" in the creature sense — its horror comes from wrongness of movement, not gore.
- **Visual design:**
  - Jointed limbs with visible wooden ball-and-socket joints at shoulders, elbows, hips, knees — silhouette reads as "puppet" even in low light.
  - Faded, cracked painted face — wide fixed eyes, a painted smile that doesn't match its actions. No animated facial rig needed (scope/perf control — a static painted expression is intentional, not a limitation to hide).
  - Traditional *kathputli* costume: flared skirt, embroidered angrakha-style jacket, small turban — deep red, indigo, and faded gold, matching the Rajasthani miniature-painting palette used throughout (see [[ASSETS]]).
  - Faint, near-invisible black threads trail from its wrists and the crown of its head, catching light only at specific story beats (rooftop ending, capture cutscene) — implies Bhairo Nath is still "above," pulling strings, without ever showing him.
- **Movement design:** Deliberately non-human gait — head leads the body, joints rotate slightly too far, movement has a marionette's snap-and-pause rhythm rather than continuous human locomotion. Achieved via keyframed animation states, not physics ragdoll (see [[PHYSICS]] for why ragdoll is out of scope).
- **Audio identity:** Wooden creak + faint *ghungroo* (ankle bell) jingle as a constant "tell" while patrolling — this is a core fairness mechanic (player can always hear Putli coming if not sprinting past its detection radius). Full cue list in [[AUDIO]].
- **AI states:** Idle → Patrol → Investigate → Chase → Search → Capture, detailed in [[AI_SYSTEM]]. No dialogue, no bark lines — communicates purely through sound design and animation.
- **Difficulty scaling:** Patrol speed, hearing radius, and search persistence scale with the three difficulty presets (Easy / Normal / Hard) — see [[GAME_MECHANICS]] §7 and [[DATA_MODEL]] for the config schema.

## 3. Referenced-Only Characters (never rendered)

| Name | Role | Where referenced |
|---|---|---|
| Bhairo Nath | 19th-century puppeteer, source of the curse | Diary pages, troupe poster prop, implied by Putli's threads |
| Sohni Bai | Meera's grandmother, diary author | Diary pages, her locked bedroom (Room 6, see [[LEVEL_DESIGN]]) |
| The missing child | Unresolved historical victim | Basement wall tally + shoe prop, deliberately never explained |

These exist only as environmental storytelling per [[STORY]] §4 — no additional character art, rigging, or animation budget is spent on them. This boundary is intentional; do not add cutscene appearances for these characters without revisiting [[FEATURES]] scope.

## 4. Out of Scope

No second enemy variant (e.g., a "hard mode" additional hunter), no companion NPC, no customizable player appearance, no branching dialogue system. If a future version wants a second antagonist, it must go through [[FEATURES]] as a stretch item — v1 ships with exactly one enemy for AI complexity and QA reasons (see [[AI_SYSTEM]] §6, [[TESTING]]).
