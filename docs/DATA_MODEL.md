# DATA_MODEL — KATPUTALI

Data structures and schemas. Two categories: **runtime config data** (loaded fresh each session, defines tunable values) and **persisted data** (survives between sessions via `localStorage`, owned solely by `save-manager` per [[ARCHITECTURE]] §7).

## 1. Runtime Session State (in-memory only, not persisted)

```js
RunState = {
  difficulty: "easy" | "normal" | "hard",
  prahar: { current: 1..4, secondsRemaining: number },
  captures: 0..3,
  nazar: { value: 0..100, hallucinating: bool, hallucinationSecondsRemaining: number },
  inventory: [ItemId, ...],       // max length 5, see GAME_MECHANICS §2
  notesReadThisRun: [NoteId, ...],
  routeProgress: {
    gate: { fragments: [bool, bool, bool], assembled: bool },
    baori: { parts: [bool, bool, bool], repaired: bool, torchLit: bool },
    rooftop: { rope: bool, hook: bool, counterweight: bool, rigged: bool }
  },
  putli: { state: "idle"|"patrol"|"investigate"|"chase"|"search"|"capture", currentLoop: string }
}
```
Reset in full on every "New Game" (no mid-run save/resume — see [[PRD]] §5.10, [[GDD]] §4).

**M3 addition:** `baori.repaired` was missing from the original schema even though LEVEL_DESIGN §5's Baori chain has a distinct "repair pulley" step between collecting parts and lighting the torch — added here per [[CODING_RULES]] §6 before implementing.

**M4 addition:** `nazar.hallucinating`/`hallucinationSecondsRemaining` were missing even though GAME_MECHANICS §5 describes an at-max "temporary hallucination state (data-driven duration)" — a state and a countdown are needed to actually drive that. Added per [[CODING_RULES]] §6 before implementing.

## 1a. Config Data — Capture Struggle & Nazar Timing (M4)

None of GAME_MECHANICS §4-5's illustrative mechanics ("fixed window," "fixed amount," "data-driven duration") had actual numbers recorded anywhere — added here before implementing, per [[CODING_RULES]] §6. Not difficulty-scoped (GAME_MECHANICS doesn't call these out as varying by preset, unlike AI_SYSTEM §6's sensor/speed values):

```js
CAPTURE_TIMING = {
  struggleWindowSeconds: 5,              // QTE §4 — fixed window for the alternating-input struggle
  struggleSuccessThreshold: 6,           // correct alternations needed within the window to break free
  struggleFailurePraharPenaltySeconds: 30, // subtracted from Prahar secondsRemaining on the 2nd failure
  respawnInvulnerabilitySeconds: 5       // post-respawn window where Putli's sight/hearing can't re-detect the player
}

NAZAR_TIMING = {
  fillPerSecond: 0.15,           // passive rise; ~11 real minutes to fill from 0 alone
  taintedRoomIncrement: 15,      // fixed bump entering courtyard puppet-stage or Sohni Bai's room, first visit/run
  wardMitigation: 30,            // fixed reduction per ward item used
  max: 100,
  hallucinationSeconds: 8,       // at-max penalty duration — visual/audio only, no sensor/hitbox effect
  baselineAfterPenalty: 40       // meter resets here (not 0) after the hallucination ends, so it can recur
}
```

## 2. Persisted Data — Settings

```json
{
  "audio": { "master": 1.0, "music": 0.8, "sfx": 1.0 },
  "controls": {
    "mouseSensitivity": 1.0,
    "invertY": false,
    "keybinds": { "moveForward": "KeyW", "interact": "KeyE", "...": "..." },
    "gamepadBinds": { "...": "..." }
  },
  "accessibility": {
    "captions": true,
    "colorblindSafeHUD": false,
    "cameraShakeIntensity": 1.0
  }
}
```
Stored under `localStorage` key `katputali:settings:v1`. See [[UI_UX]] §4, [[CONTROLS]] §3, [[AUDIO]] §5 for the UI/behavior this drives.

## 3. Persisted Data — Completionist Log

```json
{
  "notesFoundEver": ["note_sohni_1", "note_sohni_2", "..."],
  "endingsSeen": ["gate", "baori", "rooftop", "bound"]
}
```
Stored under `localStorage` key `katputali:progress:v1`. Purely informational (surfaced on the End Screen and optionally a Credits/stats readout, see [[UI_UX]] §5) — never gates gameplay, keeping every run fully self-contained per [[GDD]] §4.

**Versioning note:** the `:v1` suffix exists so a future schema-breaking change can key a new version and simply ignore/clear the old one rather than writing migration code — consistent with [[ARCHITECTURE]] §9's "no save migration system" decision.

## 4. Config Data — Difficulty Presets

Authoritative tunable values referenced throughout [[GAME_MECHANICS]] and [[AI_SYSTEM]]; illustrative defaults (exact numbers tuned during playtesting per [[TESTING]] §4):

```js
DIFFICULTY_PRESETS = {
  easy:   { praharSeconds: 240, hearingRadius: 6,  sightRange: 8,  sightAngleDeg: 60, patrolSpeed: 1.6, chaseSpeed: 2.6, searchPersistenceSec: 8,  hidingDiscoveryChance: 0.15 },
  normal: { praharSeconds: 180, hearingRadius: 8,  sightRange: 10, sightAngleDeg: 70, patrolSpeed: 1.9, chaseSpeed: 3.1, searchPersistenceSec: 12, hidingDiscoveryChance: 0.25 },
  hard:   { praharSeconds: 135, hearingRadius: 10, sightRange: 12, sightAngleDeg: 80, patrolSpeed: 2.2, chaseSpeed: 3.6, searchPersistenceSec: 16, hidingDiscoveryChance: 0.35 }
}
```
Player-side constants (stamina drain/regen rate, sprint/crouch/walk noise-radius multipliers, capture struggle window length and success threshold) live in the same config module, also difficulty-scoped where relevant — see [[GAME_MECHANICS]] §3–4, [[PHYSICS]] §4.

Putli AI timing constants, not difficulty-scoped (only sensor radii/speed/search-persistence/discovery-chance above vary by preset, per [[AI_SYSTEM]] §6):

```js
AI_TIMING = {
  activationGraceSeconds: 45,     // SCENARIO §1 — Idle -> Patrol delay
  sensorTickIntervalMs: 175,      // AI_SYSTEM §3's 150-200ms throttle
  investigateTimeoutSec: 6,       // Investigate -> Patrol if nothing found
  chaseToSearchTimeoutSec: 4,     // sustained loss-of-detection before Chase -> Search
  captureRadius: 0.75,            // m, Chase/Search -> Capture proximity trigger
  hidingSpotCheckCount: 2,        // nearest hiding spots Search evaluates, AI_SYSTEM §4
  captureSequenceSeconds: 2       // non-interactive beat before Capture -> Patrol
}
```

Noise-trap constant (GAME_MECHANICS §3 — "always emit a fixed 'loud' noise burst regardless of movement state"; not difficulty-scoped, same reasoning as AI_TIMING above):

```js
NOISE_TRAP_RADIUS = 10  // m, deliberately louder than even sprintNoiseRadius (8m above)
```

Player movement constants (not difficulty-scoped — only Putli's own speed/senses vary by preset above; illustrative defaults, tunable during playtesting per [[TESTING]] §4):

```js
PLAYER_MOVEMENT = {
  walkSpeed: 1.8,          // m/s
  sprintSpeed: 3.4,        // m/s
  crouchSpeed: 0.9,        // m/s
  capsuleRadius: 0.3,      // m, see PHYSICS §2
  standHeight: 1.75,       // m
  crouchHeight: 1.0,       // m
  crouchTransitionSec: 0.2,
  stepHeight: 0.2,         // m, see PHYSICS §2
  gravity: 18,             // m/s^2, downward acceleration on the kinematic controller
  staminaMax: 100,
  staminaDrainPerSec: 20,  // ~5s of continuous sprint
  staminaRegenPerSec: 12.5,
  staminaMinToSprint: 5,   // sprint cannot start below this; can continue until 0
  mouseSensitivity: 0.15,  // deg per pixel at the persisted settings.controls.mouseSensitivity default of 1.0 (see §2)
  maxPitchDeg: 85,         // camera pitch clamp, prevents look-axis flip
  crouchNoiseRadius: 1.5,  // m, how far Putli's hearing sensor can pick up this movement state
  walkNoiseRadius: 4,      // (GAME_MECHANICS §3) — actual detection also capped by the active
  sprintNoiseRadius: 8,    // difficulty preset's hearingRadius above (AI_SYSTEM §3)
  peekMaxYawDeg: 45        // GAME_MECHANICS §3 "camera limited to a peek view" while hiding
}
```

## 5. Config Data — Items

```js
ItemDefinition = {
  id: string,               // e.g. "key_fragment_kitchen"
  category: "key" | "ward" | "lore",
  displayName: string,
  route: "gate" | "baori" | "rooftop" | null,
  combinesWith: ItemId | StationId | null
}
```
Full populated list of all inventory items (3 key fragments, 3 pulley parts, rope/hook/counterweight, 3 ward items, 6 lore notes) mirrors [[LEVEL_DESIGN]] §5–6 exactly — that document is the design source of truth; this schema is how it's encoded in data.

## 6. Config Data — Rooms/Interactables (level metadata, not geometry)

```js
RoomDefinition = { id: string, name: string, floor: "basement"|"ground"|"first"|"roof", isHighNazar: bool }
InteractableDefinition = { id: string, roomId: string, type: "pickup"|"station"|"hidingSpot"|"noiseTrap"|"readable", itemId: ItemId|null }
```
Populated per the room tables in [[LEVEL_DESIGN]] §3–7; this is metadata consumed by gameplay systems (interaction, Nazar triggers, hiding-spot registry) layered on top of the actual 3D scene geometry, not a replacement for it.

## 7. No Server-Side Data

There is no user account, no server database, no analytics event schema — all data above is either ephemeral (in-memory `RunState`) or local-only (`localStorage`, §2–3). See [[SECURITY]] §2 and [[ARCHITECTURE]] §1.
