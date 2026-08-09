# TECH_STACK — KATPUTALI

Authoritative technology list. Anything not listed here requires a deliberate addition to this doc before use — keeps the solo-dev stack from sprawling (see [[CODING_RULES]] §1).

## 1. Core Engine: PlayCanvas

- **Choice:** [PlayCanvas Engine](https://playcanvas.com) — open-source (MIT-licensed) WebGL/WebGL2 3D engine, used as the **npm package (`playcanvas`), code-first**, not the hosted visual Editor.
- **Why engine-only over the hosted Editor:**
  - Keeps the entire project as plain text in one Git repository — critical for a solo, AI-pair-programming workflow where an AI assistant reads/writes source files directly (see [[CODING_RULES]] §6).
  - Avoids any dependency on PlayCanvas's cloud project/hosting limits — this project's own hosting is chosen independently (see [[DEPLOYMENT]]).
  - MIT license, npm-installable, zero cost at any scale, no account required to build or ship.
- **Version policy:** Pin to a specific published `playcanvas` npm major/minor version at project start; upgrade deliberately, not automatically (see [[CODING_RULES]] §1).
- **Engine features used:** Entity-Component-System scene graph, `pc.SoundComponent` (audio, see [[AUDIO]] §3), built-in `pc.CollisionComponent`/trigger system (see [[PHYSICS]] §1), animation state graph (`pc.AnimComponent`) for Putli/Meera animation states.
- **Pathfinding correction (M2):** the pinned `playcanvas@2.21.3` npm engine package ships no `pc.NavMesh`/`pc.NavMeshQuery`/Recast API at all (verified against the installed package's exports and source tree — zero matches) — that capability does not exist in the code-first engine package this project uses, whatever its origin (possibly an Editor-only tool or a different/older distribution). Putli's pathfinding instead uses a hand-rolled waypoint graph (room centers + door/stair connectors, Dijkstra-routed) — see [[AI_SYSTEM]] §8. No navmesh-baking dependency (WASM or otherwise) was added: doing so would reintroduce the same heavy-WASM cost this doc's §7 minimalism rule and [[PHYSICS]] §1 explicitly rejected for Ammo.js.

## 2. Build Tooling

- **Bundler/dev server:** [Vite](https://vitejs.dev) (MIT license, free) — fast dev server with hot reload, production build via Rollup under the hood. Chosen over webpack for solo-dev simplicity and speed.
- **Language:** Modern JavaScript (ES2020+ modules), no TypeScript for v1 — keeps the toolchain minimal for solo/AI-assisted iteration speed (revisit only if type-safety pain justifies the added build complexity, per [[CODING_RULES]] §1). Plain JSDoc comments used where types materially aid readability.
- **Package manager:** npm (ships with Node.js, free/open-source).
- **Target browsers:** latest two stable versions of Chrome, Firefox, Edge, Safari (desktop) with WebGL2 support — matches [[PRD]] §6 compatibility requirement.

## 3. Testing Tooling

- **Unit tests:** [Vitest](https://vitest.dev) (MIT, integrates natively with Vite) for pure-logic modules (AI state machine transitions, inventory/puzzle logic, Nazar/Prahar timer math) — see [[TESTING]] §2.
- **Manual/QA:** browser-based playtesting checklist, no paid device-lab service (see [[TESTING]] §1).

## 4. Content Creation Tools (all free/open-source)

| Purpose | Tool |
|---|---|
| 3D modeling | Blender |
| Texture painting | Krita / GIMP |
| Audio editing | Audacity |
| Music/SFX synthesis | LMMS (or original recording via Audacity) |
| Version control | Git + GitHub (free tier) |
| Code editor | VS Code (free) |

See [[ASSETS]] §2–3 for how these tools are used against sourced vs. original content.

## 5. Hosting & CI (zero-cost)

- **Static hosting candidates:** GitHub Pages, Cloudflare Pages, or itch.io (HTML5 upload) — all free at this project's traffic/asset-size scale. Primary choice and fallback order specified in [[DEPLOYMENT]] §2.
- **CI:** GitHub Actions (free tier minutes, ample for a static-site build-and-deploy pipeline) — see [[DEPLOYMENT]] §3.
- **No backend, no database, no server runtime** — the game is a fully static asset bundle (see [[ARCHITECTURE]] §1). This is the single biggest lever keeping the project at $0 recurring cost (see [[PRD]] §7).

## 6. Persistence

Browser `localStorage` only, for settings and the completionist notes-found log (see [[DATA_MODEL]] §2–3) — no cloud save, no accounts, no external database (see [[SECURITY]] §2).

## 7. Explicit Dependency Minimalism Rule

Before adding any new npm dependency: confirm it's free/MIT-or-equivalent-licensed, confirm PlayCanvas's built-ins can't already do the job (audio, physics, navigation, animation are all covered — see §1), and record it in this file. Known deliberately-excluded dependencies: Ammo.js/full physics middleware (see [[PHYSICS]] §1), Howler.js or other audio libraries (see [[AUDIO]] §3), any UI framework like React for HUD (HUD is built directly in PlayCanvas's screen/element system or lightweight DOM overlay — see [[ARCHITECTURE]] §3), any analytics/telemetry SDK (see [[SECURITY]] §2).

## 8. Out of Scope

No cloud engine services (PlayCanvas cloud hosting/multiplayer rooms), no native builds (Electron/Steam), no console SDKs, no WebXR/VR support in v1.
