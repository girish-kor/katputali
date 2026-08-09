# CONTROLS — KATPUTALI

Input scheme for v1 (desktop browser, keyboard + mouse primary, gamepad supported). Mobile/touch is explicitly out of scope — see §5.

## 1. Default Keyboard & Mouse Bindings

| Action | Binding | Notes |
|---|---|---|
| Move | W A S D | Standard FPS-style, relative to camera facing |
| Look | Mouse | Sensitivity adjustable in Settings, see [[UI_UX]] §4 |
| Sprint | Left Shift (hold) | Highest noise level, drains stamina — see [[GAME_MECHANICS]] §3 and [[PHYSICS]] §4 |
| Crouch | Left Ctrl (toggle) | Lowest noise level, reduced camera height |
| Interact | E | Contextual — pick up / use / combine / read, see [[GAME_MECHANICS]] §1 |
| Inventory | Tab (hold or toggle, configurable) | Opens item bar for selection, does not pause the game/AI — see [[UI_UX]] §2 |
| Drop selected item | G | Only for non-key items, see [[GAME_MECHANICS]] §2 |
| Hide (enter/exit spot) | E (context-sensitive, same as Interact) | No separate dedicated key — reduces input surface |
| Peek while hidden | Mouse (limited range) | See [[GAME_MECHANICS]] §3 |
| Pause / Settings | Esc | Only true full-pause in the game — mid-run pausing does freeze AI/timer (single-player, no fairness concern) |
| Struggle QTE inputs | A / D (or Left/Right arrows) | Alternating input during capture struggle, see [[GAME_MECHANICS]] §4 |

## 2. Gamepad Bindings (Xbox-layout reference; PlayCanvas Gamepad API)

| Action | Binding |
|---|---|
| Move | Left stick |
| Look | Right stick |
| Sprint | Left stick click (L3) |
| Crouch | B |
| Interact | A |
| Inventory | Y (hold) |
| Drop | X |
| Pause | Start |
| Struggle QTE | LB / RB alternating |

Gamepad support targets a single connected controller (no multi-controller/player-select UI needed — single-player, see [[UI_UX]] §1).

## 3. Rebinding

All keyboard/mouse and gamepad bindings are rebindable from the Settings screen (see [[UI_UX]] §4); stored in `localStorage` per [[DATA_MODEL]] §3. Conflicts (two actions bound to one key) are flagged and blocked at rebind time, not discovered at runtime.

## 4. QTE Input Detail (Capture Struggle)

The struggle minigame (see [[GAME_MECHANICS]] §4) reads raw alternating key-down events on the two bound "struggle" keys within the active time window; inputs outside the window or same-key repeats without an intervening opposite key do not count, to prevent simple key-mashing/macro exploitation of a single key. Implementation detail in [[ARCHITECTURE]] §3.

## 5. Explicit Non-Goals for v1

- No touchscreen/virtual-joystick support (desktop browser only, see [[PRD]] §3, [[UI_UX]] §1).
- No control-scheme auto-detection popups beyond a simple "last input device used" indicator in prompts (e.g., showing "E" vs. "A" button icon dynamically) — nice-to-have, not required for launch (see [[FEATURES]]).
- No remappable struggle-QTE keys beyond the two general "struggle" bindings above (kept simple — see [[CODING_RULES]] on avoiding over-engineered input abstraction for a 2-input minigame).
