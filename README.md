# cxr-admin-ux

WEX-branded **employer admin** prototype that pairs with the consumer experience in [cxr-ux](../cxr-ux). Primary persona: **Shelly**, an HR admin at a small/mid-market employer (Summit Ridge Bakery Co. demo data).

## Prerequisites

- Node.js 22.x (see `.nvmrc`)
- Access to `@wexinc-healthbenefits/ben-ui-kit` on your WEX npm registry

## Setup

1. Copy `.npmrc.example` to `.npmrc` and add your registry token (same pattern as `cxr-ux`).
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
- **Dashboard**: CXR-style hero, onboarding CTA, gated “frequent tasks,” launch status (localStorage).
- **Setup wizard**: Company profile, employees, products, plan framework, rates decoupling, eligibility, integrations + mapping wizard sheet, branding handoff, review & launch.
- **Enrollment**: Searchable/paginated roster, quick-add menu, person detail sheet with tabs.
- **Billing & invoicing**: Tabs for marketplace financials, reconciliation, payment methods, COBRA counts, accounting tools.
- **Reporting & analytics**: NL prompt, service KPI cards, report library.
- **Content**: Documents / videos / tutorials + drag-drop placeholder.
- **Communications**: Builder, delivery settings, employee prefs, provisioning templates.
- **Branding**: Full theming engine (same module set as cxr-ux “Elizabeth” / partner appearance studio).

## Related repo

Consumer portal: `cxr-ux` (sibling folder). Design tokens and Vite token CSS plugin are mirrored here for the same look and feel.

## Scripts

| Script        | Description                          |
| ------------- | ------------------------------------ |
| `npm run dev` | Vite dev server                      |
| `npm run build` | Tokens build + `tsc` + production bundle |
| `npm run preview` | Preview production build         |
