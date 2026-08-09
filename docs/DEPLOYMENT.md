# DEPLOYMENT — KATPUTALI

Build and release process. Entirely static-site deployment, zero recurring cost — see [[TECH_STACK]] §5 and [[PRD]] §7.

## 1. Build Process

```bash
npm install       # install pinned dependencies (see TECH_STACK §1, SECURITY §3)
npm run test      # Vitest unit suite — see TESTING §2
npm audit         # dependency vulnerability check — see SECURITY §3
npm run build     # vite build → /dist static bundle
```
The `/dist` output is a fully static bundle (HTML/JS/CSS/assets) with no server-side component — deployable to any static host as-is (see [[ARCHITECTURE]] §1, §8).

## 2. Hosting Choice

**Primary: GitHub Pages.** Free, directly integrated with the project's GitHub repo, HTTPS by default, sufficient bandwidth/storage for a game well under the [[PERFORMANCE]] §1 size budget (≤150MB).

**Fallback options (equally valid, zero-cost, chosen if GitHub Pages proves limiting for any reason — e.g. wanting custom headers for the CSP in [[SECURITY]] §5):**
- **Cloudflare Pages** — free tier, generous bandwidth, easy custom-header/CSP configuration, HTTPS by default.
- **itch.io** — free HTML5 game upload/hosting, natural fit for the target audience described in [[PRD]] §4, built-in discoverability.

All three require no payment method, no usage-based billing risk, and no server maintenance — satisfying [[PRD]] §7's zero-cost constraint at any realistic traffic level for a short indie horror game.

## 3. CI Pipeline (GitHub Actions, free tier)

On every push to `main`:
1. Install dependencies, run unit tests (see [[TESTING]] §2), run `npm audit`.
2. If on the release branch/tag only: run `vite build` and deploy `/dist` to the chosen static host (GitHub Pages via the official `actions/deploy-pages` action, or an equivalent step for Cloudflare Pages/itch.io if used instead).
3. Fail the pipeline (block deploy) on any test failure, build error, or high/critical audit finding — matches the pre-release gate in [[TESTING]] §7.

Feature/dev branches run steps 1 only (fast feedback, no deploy) — keeps CI minutes comfortably within GitHub Actions' free tier for a solo project.

## 4. Versioning & Releases

- Semantic-ish version tags (`v0.1.0` pre-milestone builds through `v1.0.0` launch) matching the milestone progression in [[TASKS]] and [[PRD]] §8.
- Each tagged release corresponds to one deployed build — the live static host always reflects the latest tagged release, not every commit, keeping the public build stable between intentional releases.
- Release notes summarize what changed, referencing the relevant [[FEATURES]] items completed.

## 5. Rollback

Both GitHub Pages and Cloudflare Pages retain previous deployments/history natively — rollback is re-deploying the last known-good tag via the same CI pipeline (re-run the workflow against the previous tag), not a manual server operation. Since there is no database or user data (see [[SECURITY]] §7), rollback carries no data-loss risk beyond players' own local `localStorage` settings, which are forward/backward compatible within a schema version (see [[DATA_MODEL]] §3).

## 6. Environment Configuration

No environment-specific secrets/API keys exist (no backend, no third-party service credentials — see [[ARCHITECTURE]] §1, [[SECURITY]] §2). Build output is identical regardless of target host; only the CI deploy step's destination differs.

## 7. Domain

Ships initially on the free subdomain provided by the chosen host (e.g. `<username>.github.io/katputali`, a `pages.dev` subdomain, or an itch.io game page URL) — no purchased custom domain required for v1, keeping the $0 constraint intact (see [[PRD]] §7). A custom domain remains an optional future addition, not a launch requirement.

## 8. Out of Scope

No blue-green/canary deployment infrastructure (unnecessary for a static single-player game with no live traffic-sensitive backend), no CDN configuration beyond what the chosen free static host already provides out of the box, no paid uptime/monitoring service (a static site on a major free host has no meaningful uptime risk to monitor beyond what the host itself reports).
