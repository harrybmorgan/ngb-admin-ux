# ngb-admin-ux

WEX-branded **employer admin** prototype that pairs with the consumer experience in [cxr-ux](../cxr-ux). Primary persona: **Shelly**, an HR admin at a small/mid-market employer (Summit Ridge Bakery Co. demo data).

## Prerequisites

- Node.js 22.x (see `.nvmrc`)
- Access to `@wexinc-healthbenefits/ben-ui-kit` on your WEX npm registry

## Setup

1. **Private UI kit (`@wexinc-healthbenefits/ben-ui-kit`)** resolves from WEX JFrog **`benefits-npm`** (see `package-lock.json`). Without a local `.npmrc`, npm hits the public registry and you get **E401**.
   - Copy the template: `cp .npmrc.example .npmrc`
   - Create a token in **Artifactory / JFrog** (identity token or team-documented npm credential; same pattern as **cxr-ux**).
   - In the same shell: `export ARTIFACTORY_NPM_TOKEN="…"` then `npm install`
2. Install dependencies. If `patch-package` errors appear during `@wexinc-healthbenefits/ben-ui-kit` postinstall, use:
   ```bash
   npm install --ignore-scripts
   ```
3. Run the app:
   ```bash
   npm run dev
   ```
   Default Vite port is **5175** (see `vite.config.ts`).

## What’s included

- **Login**: First-time flow (username + temporary password → create new password).
- **Dashboard**: Consumer-style hero, onboarding CTA, gated “frequent tasks,” launch status (localStorage).
- **Setup wizard**: Company profile, employees, products, plan framework, rates decoupling, eligibility, integrations + mapping wizard sheet, branding handoff, review & launch.
- **Enrollment**: Searchable/paginated roster, quick-add menu, person detail sheet with tabs.
- **Billing & invoicing**: Tabs for marketplace financials, reconciliation, payment methods, COBRA counts, accounting tools.
- **Reporting & analytics**: NL prompt, service KPI cards, report library.
- **Content**: Documents / videos / tutorials + drag-drop placeholder.
- **Communications**: Builder, delivery settings, employee prefs, provisioning templates.
- **Branding**: Full theming engine (same module set as `cxr-ux` “Elizabeth” / partner appearance studio).

## Related repo

Consumer portal: `cxr-ux` (sibling folder). Design tokens and Vite token CSS plugin are mirrored here for the same look and feel.

## GitHub Pages (stakeholder demo)

Workflow: [`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml) builds on every push to **`main`** and publishes **`dist/`** to Pages.

**One-time (GitHub UI)**

1. **Settings → Pages → Build and deployment**: set **Source** to **GitHub Actions** (not “Deploy from a branch”).
2. **Settings → Secrets and variables → Actions**: add **`ARTIFACTORY_NPM_TOKEN`** (exact name) as a **repository secret** with your JFrog npm identity token — the same value you use locally with `export ARTIFACTORY_NPM_TOKEN=…`. The workflow writes `.npmrc` during the job using this secret. If the secret is missing or wrong, `npm ci` fails with **E401**.

**Live URL** (project site): `https://<owner>.github.io/<repo>/` — e.g. `https://harrybmorgan.github.io/ngb-admin-ux/`. The workflow sets `VITE_BASE_PATH=/<repo>/` so assets and `react-router` match that path (see [`src/main.tsx`](src/main.tsx) `routerBasename()`). `postbuild` already copies `index.html` to `404.html` for SPA reloads.

**Preview a Pages build locally**

```bash
VITE_BASE_PATH=/ngb-admin-ux/ npm run build && npm run preview
```

(Replace `ngb-admin-ux` with your repository name if different.)

## Scripts

| Script        | Description                          |
| ------------- | ------------------------------------ |
| `npm run dev` | Vite dev server                      |
| `npm run build` | Tokens build + `tsc` + production bundle |
| `npm run preview` | Preview production build         |
