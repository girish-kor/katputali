# KATPUTALI

A short, standalone, single-player horror game. Escape a cursed Rajasthani haveli before a puppet-spirit named **Putli** catches you three times — or before dawn arrives.

Built with the [PlayCanvas Engine](https://playcanvas.com), runs entirely in the browser, no install, no account, no server. Designed and built solo, at zero recurring cost, using only free/open-source tooling and legally usable assets.

## About

You are **Meera Kanwar**, back at your family's ancestral haveli in **Kathgarh, Rajasthan** for one night. The gate is barred. Something that was never quite laid to rest is patrolling the halls — an animated *kathputli* marionette, bound to the spirit of a puppeteer killed here two centuries ago, still looking for one more performer.

Explore the haveli, gather items, solve three independent puzzle chains to unlock an escape route (the front gate, the basement stepwell tunnel, or a rooftop zipline), and avoid — or survive — Putli. Full narrative context lives in [STORY.md](docs/STORY.md).

## Core Loop

Explore → find and combine items → progress one of 3 escape routes → evade or survive capture (max 2 non-fatal) → escape before the 4th Prahar (dawn) ends the night.

A full session takes **20–35 minutes**. Full design detail in [GDD.md](docs/GDD.md); moment-to-moment breakdown in [GAMEPLAY.md](docs/GAMEPLAY.md).

## Quickstart (development)

```bash
git clone <this-repo>
cd katputali
npm install
npm run dev      # local dev server via Vite
```

```bash
npm run test      # unit tests (Vitest)
npm run build     # production static build → /dist
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for hosting/release steps and [TECH_STACK.md](docs/TECH_STACK.md) for the full toolchain.

## Controls (default, rebindable)

`WASD` move · Mouse look · `Shift` sprint · `Ctrl` crouch · `E` interact · `Tab` inventory · `Esc` pause. Gamepad supported. Full reference in [CONTROLS.md](docs/CONTROLS.md).

## Documentation Index

| Design | Technical | Production |
|---|---|---|
| [GDD.md](docs/GDD.md) — master design doc | [ARCHITECTURE.md](docs/ARCHITECTURE.md) — code architecture | [PRD.md](docs/PRD.md) — product requirements |
| [GAMEPLAY.md](docs/GAMEPLAY.md) — moment-to-moment loop | [TECH_STACK.md](docs/TECH_STACK.md) — tooling & engine | [FEATURES.md](docs/FEATURES.md) — MoSCoW scope |
| [GAME_MECHANICS.md](docs/GAME_MECHANICS.md) — system specs | [DATA_MODEL.md](docs/DATA_MODEL.md) — schemas & config | [TASKS.md](docs/TASKS.md) — implementation plan |
| [LEVEL_DESIGN.md](docs/LEVEL_DESIGN.md) — haveli layout | [AI_SYSTEM.md](docs/AI_SYSTEM.md) — Putli's state machine | [TESTING.md](docs/TESTING.md) — test plan |
| [CHARACTERS.md](docs/CHARACTERS.md) — cast | [PHYSICS.md](docs/PHYSICS.md) — collision/movement | [DEPLOYMENT.md](docs/DEPLOYMENT.md) — build & release |
| [STORY.md](docs/STORY.md) — lore bible | [CONTROLS.md](docs/CONTROLS.md) — input scheme | [PERFORMANCE.md](docs/PERFORMANCE.md) — targets & budgets |
| [SCENARIO.md](docs/SCENARIO.md) — beat-by-beat playthrough | [ASSETS.md](docs/ASSETS.md) — art direction & sourcing | [SECURITY.md](docs/SECURITY.md) — client-side security |
| [UI_UX.md](docs/UI_UX.md) — menus & HUD | [AUDIO.md](docs/AUDIO.md) — sound design | [CODING_RULES.md](docs/CODING_RULES.md) — code conventions |

## Scope

One location, one enemy, one night, three endings. No multiplayer, no mobile support, no monetization, no accounts, no analytics. See [FEATURES.md](docs/FEATURES.md) for the full in/out-of-scope breakdown and [PRD.md](docs/PRD.md) for why.

## Technology

- **Engine:** [PlayCanvas](https://playcanvas.com) (MIT-licensed, npm package, code-first)
- **Build:** [Vite](https://vitejs.dev)
- **Tests:** [Vitest](https://vitest.dev)
- **Hosting:** GitHub Pages / Cloudflare Pages / itch.io (free tier)
- **Persistence:** browser `localStorage` only — no backend, no database

Full detail in [TECH_STACK.md](docs/TECH_STACK.md).

## Assets & Credits

Every asset is CC0, CC-BY (attributed), a free-use license (e.g. Mixamo), or original work — see [ASSETS.md](docs/ASSETS.md) for the full sourcing policy and license table. Full attributions also ship in the game's in-app Credits screen.

## License

Game source code: choose and add a license (e.g. MIT) before public release. Third-party asset licenses are tracked individually in [ASSETS.md](docs/ASSETS.md) — the code license does not override those.

## Status

Pre-production / early development. See [TASKS.md](docs/TASKS.md) for the current milestone.
