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

Workflow: [`.github/workflows/pages.yml`](.github/workflows/pages.yml) runs on pushes to **`main`** (and **workflow_dispatch**). It builds with `VITE_BASE_PATH=/<repo>/`, runs **`postbuild`** (copies `dist/index.html` → `dist/404.html` for client-side routing), then pushes **`dist/`** to the **`gh-pages`** branch via [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages) using **`GITHUB_TOKEN`**.

**Repository secrets** (Settings → Secrets and variables → Actions):

- **`ARTIFACTORY_NPM_TOKEN`** (required)
- **`ARTIFACTORY_NPM_USERNAME`** (optional; often needed for JFrog Basic auth — see workflow comments)

**Enable Pages in GitHub (after the first successful workflow run creates `gh-pages`)**

1. Open the repo on GitHub → **Settings** → **Pages** (left sidebar, under “Code and automation”).
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch** (not “GitHub Actions” for this setup).
3. **Branch**: select **`gh-pages`** and folder **`/ (root)`** → **Save**.

**Live URL** (project site): `https://<owner>.github.io/<repo>/` — e.g. `https://harrybmorgan.github.io/ngb-admin-ux/`. `VITE_BASE_PATH` matches that path (see [`src/main.tsx`](src/main.tsx) `routerBasename()`).

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
