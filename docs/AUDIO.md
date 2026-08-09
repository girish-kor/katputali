# AUDIO — KATPUTALI

Sound design and implementation spec. Audio is this game's primary fairness tool (see [[AI_SYSTEM]] §7) — treat cue clarity as a functional requirement, not just atmosphere.

## 1. Sourcing Policy

Same zero-cost, legally-clean policy as [[ASSETS]] §2: CC0 preferred, CC-BY acceptable with tracked attribution, no paid libraries. Sources: Freesound.org (CC0/CC-BY foley and ambience), Zapsplat (free tier, attribution), original recording/Foley (household objects for footsteps/wood-creak layering) and original simple music composition/synthesis using free tools (e.g. LMMS, Audacity — both free/open-source, see [[TECH_STACK]] §4). All entries tracked in [[ASSETS]] §5.

## 2. Sound Categories & Design Intent

### Putli Audio Tells (the core fairness system, see [[AI_SYSTEM]] §7)
| State | Cue | Design intent |
|---|---|---|
| Patrol | Constant low wood-creak + faint *ghungroo* (ankle bell) jingle, volume/pan reflects distance | Player can always locate Putli's general direction/proximity without seeing her |
| Investigate | Distinct "listening" beat — creak pauses, a single sharper bell note | Telegraphs "she heard something," giving the player a chance to freeze/retreat |
| Chase | Faster, louder creak rhythm + heavier bell + a low string-tension drone that swells | Unmistakably different from Patrol — no ambiguity about being spotted |
| Search | Slower, deliberate creak with pauses (searching a room) | Signals "still dangerous nearby" but distinct from active Chase |
| Capture | Sharp sting + string-snap sound | One-time, matches the screen transition in [[GAME_MECHANICS]] §4 |

### Player Audio
- Footsteps: distinct layered sets for crouch/walk/sprint and for wood/stone/water surface types, directly reflecting the noise-radius values in [[GAME_MECHANICS]] §3 so audio and mechanical noise level always agree.
- Breathing: subtle effort audio on sprint and during hiding (tense held-breath loop) — never gameplay-functional, purely atmosphere.
- Interact/UI sounds: soft, non-jarring confirmation tones for pickup/combine/read (see [[UI_UX]] §3), distinct "wrong fit" negative tone for failed combinations (see [[GAME_MECHANICS]] §2).

### Environmental Ambience
- Base layer per floor/room type (courtyard night air + fountain trickle, basement stepwell water drip/echo, rooftop wind) — reinforces the readable-geography goal in [[LEVEL_DESIGN]] §1 (a player can partially tell which floor they're on by ambience alone).
- Nazar meter hallucination stinger (see [[GAME_MECHANICS]] §5) — a brief distorted/reversed ambience layer, always paired with the visual effect and always captioned (see [[UI_UX]] §6).
- Diya/torch crackle near warm-light sources, contrasted with a subtle cold "wind through *jaali*" layer near moonlit openings — supports the warm/cold lighting contrast from [[ASSETS]] §1.

### Music
- Sparse, folk-instrument-inspired (implied *sarangi*/*dholak*-style tones via free/CC sample sources or simple original synthesis — no licensed sample libraries) ambient score, used only at key tension beats (first Putli cue, each escape route's final puzzle step, endings) rather than continuous underscore — silence itself is a design tool for dread (see [[GDD]] §2 pillar 2).
- No music during core exploration/stealth loop by default, keeping the diegetic Putli audio tells maximally legible (a constant music bed would mask them) — this is a deliberate mix decision, not an oversight.

## 3. Implementation

- Use **PlayCanvas's built-in `pc.Sound`/`pc.SoundComponent` system** (positional 3D audio via the Web Audio API, already part of the engine) rather than adding a third-party audio library — consistent with [[TECH_STACK]] §1's minimal-dependency principle. Positional audio is required for the distance/pan-based Putli tells in §2 to function.
- Putli's audio emitter is attached to its root entity so PlayCanvas's built-in distance attenuation naturally drives volume; state-change cues layered as one-shot sounds triggered directly by [[AI_SYSTEM]] §2 state-transition events (not polled).
- Footstep/surface audio driven by a simple surface-type tag read from the floor collider under the player (see [[PHYSICS]] §3) crossed with current movement state (see [[GAME_MECHANICS]] §3).
- All audio assets compressed to a web-friendly format (Ogg Vorbis primary, per [[TECH_STACK]] §2 browser-target baseline) and kept short/loop-friendly to control build size (see [[PERFORMANCE]] §3 load budget).

## 4. Spatial/Mix Rules

- Putli cues always route through 3D positional audio; UI/HUD sounds and music are always 2D (non-positional), so the player never confuses a menu sound for a diegetic threat cue.
- Loudness gently ducks non-critical ambience during Chase state to keep the chase audio legible (simple mix-bus ducking, not a full dynamic mixing framework).

## 5. Volume & Accessibility

Master/Music/SFX sliders in Settings (see [[UI_UX]] §4), all persisted via `localStorage` (see [[DATA_MODEL]] §3). Every state-defining audio cue in §2 has a corresponding caption/subtitle per [[UI_UX]] §6 — this is a hard requirement, not optional polish, since it's load-bearing for both accessibility and the [[AI_SYSTEM]] §7 fairness contract.

## 6. Out of Scope

No dynamic/adaptive music middleware (e.g. Wwise/FMOD — paid or overkill for this scope), no voice acting/dialogue (see [[CHARACTERS]] §1), no binaural/HRTF-specific mixing beyond the engine's standard positional audio, no per-room dynamic reverb zones beyond simple pre-authored ambience differences (see [[PERFORMANCE]] for why real-time reverb zones are avoided).
