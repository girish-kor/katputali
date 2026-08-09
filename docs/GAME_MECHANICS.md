# GAME_MECHANICS — KATPUTALI

Detailed system specs. This doc defines exact rules/values (tunable via data — see [[DATA_MODEL]] §4) that implement the loop described in [[GAMEPLAY]] and [[GDD]].

## 1. Interaction System

- **Interact range:** 1.8m from camera, requires line of sight (no interact-through-walls).
- **Interact prompt:** contextual world-space icon/text, only visible in range (see [[UI_UX]] §3).
- **Interact types:** Pick up (adds to inventory), Use-in-place (levers, gates, torches), Combine (select a carried item, then interact with a target item/station), Read (notes — opens a non-pausing text overlay, see [[UI_UX]] §5).

## 2. Inventory & Puzzle System

- **Carry limit:** 5 item slots. Deliberately small — forces prioritization, keeps UI simple (see [[UI_UX]] §2).
- **Item categories:** Key items (route-critical, e.g. key fragments, pulley parts, rope/hook/counterweight), Ward items (neem bundle, kalava thread — consumed on use against the Nazar meter, §5), Lore items (notes — read then removed from inventory into a permanent "read" log, don't occupy slots after reading).
- **Combination logic:** each of the 3 routes is a short linear chain of 2–3 combine/use steps; chains do not share items, so partial progress on one route never blocks another (see [[LEVEL_DESIGN]] §5 for exact chains and item locations).
- **Dropped items:** on capture, the player drops one random non-key item (if any) as inventory "cost" (see §4); key items are never dropped on capture, only lost if the player never picks them up in the first place — this avoids run-ending softlocks.
- **No fail-state combination:** wrong item pairings simply show a "doesn't fit" prompt; no wasted resources from experimenting (kept simple deliberately — no crafting-game complexity).

## 3. Stealth & Noise System

- **Movement noise levels (low → high):** Crouch-walk < Walk < Sprint. Each has a noise radius value (data-driven, see [[DATA_MODEL]] §4) that determines whether Putli's hearing sensor can detect it — see [[AI_SYSTEM]] §3.
- **Floor triggers:** certain tiles (old wood boards, loose stepwell stone) always emit a fixed "loud" noise burst regardless of movement state, telegraphed visually (subtle texture difference) — rewards observant players, punishes rushing blindly (see [[LEVEL_DESIGN]] for placement).
- **Sight cone:** Putli detects the player via a forward vision cone (angle + range, data-driven) that respects occlusion (walls, closed doors, *jaali* screens partially occlude — see [[PHYSICS]] §3 for how *jaali* screens use a partial-occlusion trigger instead of full raycast blocking, letting them function as a gameplay-relevant "can hide sightline, not soundline" element).
- **Hiding spots:** fixed, pre-placed interactable spots — under a *charpai* bed, inside an *almirah* wardrobe, behind courtyard pillars, in stepwell alcoves. Entering a hiding spot: player becomes untargetable by sight (still audible if noisy), camera limited to a peek view, one interact press to exit. Putli's Search state has a chance to check nearby hiding spots (see [[AI_SYSTEM]] §4) — hiding is risk-reduction, not a guaranteed safe room.
- **No permanent invisibility:** there is no state in which the player is 100% safe indefinitely except being far enough outside both sensors' range.

## 4. Capture & Struggle System

- **Trigger:** Putli's state machine reaches Capture (see [[AI_SYSTEM]] §2) when it reaches the player's position while in Chase state.
- **Capture count:** persistent for the run, max 3. Shown as 3 pips in the HUD (see [[UI_UX]] §2).
- **Captures 1 and 2 ("Bound" — non-fatal):**
  1. Short forced camera transition to the courtyard puppet-stage cage.
  2. Struggle QTE: alternating left/right input prompts (keyboard: A/D or ←/→, gamepad: shoulder buttons) for a fixed window (data-driven duration, see [[DATA_MODEL]] §4); success threshold is a target number of correct alternations within the window.
  3. **Success:** player is released, respawns at the nearest of a fixed set of "safe re-entry rooms" (never the room they were caught in, to avoid instant re-capture), drops one random non-key inventory item.
  4. **Failure:** one automatic retry is granted (never more) — a second failure still releases the player (same respawn rule) but adds a time penalty to the Prahar clock, representing lost time struggling. This guarantees a capture is never an instant unrecoverable loss on its own.
- **Capture 3 (fatal):** no struggle chance — immediately triggers the Bound bad ending (see [[STORY]] §5, [[SCENARIO]] §6).
- **Post-capture grace:** Putli returns to Patrol (not Chase) and a short (data-driven) player invulnerability-to-detection window applies at the respawn point, preventing "spawn camped" unfairness.

## 5. Nazar (Curse) Meter

- **Purpose:** secondary pressure system independent of Putli, reinforcing the folk-horror theme (the house itself is hostile, not just the entity — see [[STORY]] §1).
- **Fill behavior:** rises slowly and passively over real time; gains additional fixed increments when the player enters specific "tainted" rooms/props (e.g., the puppet-stage room, Sohni Bai's locked room) for the first time each visit.
- **Mitigation:** ward items (neem leaf bundle, *kalava* red thread) are consumable pickups placed near the tainted rooms; using one (interact from inventory) reduces the meter by a fixed amount and is consumed.
- **At-max penalty:** triggers a temporary "hallucination" state (data-driven duration) — visual/audio distortion (desaturation pulse, false Putli audio cue, brief vignette) that does not affect hitboxes or sensors, purely a tension/misdirection effect. Meter resets to a lowered baseline (not zero) after the penalty ends, so it can recur if ignored.
- **Explicitly not a loss condition:** the Nazar meter alone never ends the run — it only makes evasion harder to judge, adding pressure without a second unforgiving fail-state stacked on captures. This boundary is intentional; do not wire it to game-over without revisiting [[FEATURES]].

## 6. Prahar Timer

- **Structure:** 4 real-time-countdown Prahars per run; reaching the start of "Prahar 5" ends the run in the Bound ending (see [[SCENARIO]] §6).
- **Default (Normal) duration:** 3 real-world minutes per Prahar (~12 minutes hard ceiling), extended effectively by the non-linear, no-forced-backtrack level layout keeping actual solve time within budget (validated per [[SCENARIO]] §3 pacing target and [[TESTING]] §4). Difficulty presets adjust this — see §7.
- **Penalties:** failed struggle attempts (see §4) subtract a fixed chunk of remaining time rather than adding real elapsed time, keeping the total session length predictable for playtesting/QA.
- **Display:** stylized diegetic clock element (oil lamp burning down / moon position) plus a precise HUD readout — see [[UI_UX]] §2.

## 7. Difficulty Presets

All values below are illustrative defaults; authoritative values live in the data config (see [[DATA_MODEL]] §4) so they can be tuned during playtesting without code changes.

| Preset | Prahar length | Putli hearing radius | Putli patrol speed | Search persistence |
|---|---|---|---|---|
| Easy | 4.0 min | Smaller | Slower | Shorter |
| Normal | 3.0 min | Default | Default | Default |
| Hard | 2.25 min | Larger | Faster | Longer |

## 8. Explicitly Out of Scope

No crafting beyond fixed 2–3-step combine chains, no skill trees, no upgrade currency, no random item placement (fixed layout for consistent QA and fair first-time play — see [[TESTING]]), no difficulty auto-adjustment mid-run.
