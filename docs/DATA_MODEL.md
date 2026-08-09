# DATA_MODEL — KATPUTALI

Data structures and schemas. Two categories: **runtime config data** (loaded fresh each session, defines tunable values) and **persisted data** (survives between sessions via `localStorage`, owned solely by `save-manager` per [[ARCHITECTURE]] §7).

## 1. Runtime Session State (in-memory only, not persisted)

```js
RunState = {
  difficulty: "easy" | "normal" | "hard",
  prahar: { current: 1..4, secondsRemaining: number },
  captures: 0..3,
  nazar: { value: 0..100 },
  inventory: [ItemId, ...],       // max length 5, see GAME_MECHANICS §2
  notesReadThisRun: [NoteId, ...],
  routeProgress: {
    gate: { fragments: [bool, bool, bool], assembled: bool },
    baori: { parts: [bool, bool, bool], torchLit: bool },
    rooftop: { rope: bool, hook: bool, counterweight: bool, rigged: bool }
  },
  putli: { state: "idle"|"patrol"|"investigate"|"chase"|"search"|"capture", currentLoop: string }
}
```
Reset in full on every "New Game" (no mid-run save/resume — see [[PRD]] §5.10, [[GDD]] §4).

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
