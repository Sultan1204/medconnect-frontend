# MedConnect Saudi — Web frontend

Vue 3 + TypeScript SPA for the MedConnect Saudi telemedicine platform. Arabic is the default language (RTL), with full English (LTR) support.

> **Not production-ready.** The UI runs on demo data until the Laravel `/api/v1` endpoints exist. Security, clinical and regulatory review is still required.

## Quick start

```bash
npm install
npm run dev:mock      # demo data, no backend needed → http://localhost:5173
npm run dev           # real API via Vite proxy to DEV_BACKEND_URL (default http://localhost:8000)
```

Demo accounts (mock mode only). Password `Demo1234`; every OTP or MFA code is `123456`:

| Mobile | Role |
|---|---|
| 0500000001 | Patient |
| 0500000002 | Doctor (approved) |
| 0500000003 | Doctor (under review) |
| 0500000004 | Pharmacist |
| 0500000005 | Admin (MFA required) |

## Scripts

| Command | Purpose |
|---|---|
| `npm run build` | Type-check and production build (`dist/`) |
| `npm run typecheck` | `vue-tsc` only |
| `npm test` | Unit tests (Vitest) |
| `npx playwright install chromium` | One-time browser install |
| `npm run test:e2e` | E2E and accessibility tests against mock mode |
| `E2E_MODE=http npm run test:e2e` | E2E against the Laravel dev API |

## Environment

See `.env.example`. Every `VITE_*` variable ends up in the browser bundle, so never put secrets there. `.env.mock` switches to the mock API.

## Architecture

```
src/
  app/            router (routes, guards), layouts, providers (i18n), navigation config
  components/     ui/ (design system), forms/, layout/, doctors/
  features/       public, auth, doctors, patients, portal (page placeholders) …
  services/       api/ (http client, endpoint modules, errors), realtime/ (Echo)
  stores/         auth, preferences, toast (Pinia)
  composables/    useAsyncData, useForm, usePageMeta, useFormatters
  mocks/          DEMO ONLY: axios adapter implementing docs/API_CONTRACT.md
  locales/        ar.json, en.json
  utils/          formatting (SAR, Riyadh time), Saudi phone, validation, storage
```

Key decisions:
- **Auth:** Sanctum SPA cookies (HttpOnly session plus XSRF). No token in `localStorage`. `localStorage` holds only locale and theme.
- **Backend is authoritative:** roles, prices, availability, verification status and ratings come from the API. Route guards are UX only.
- **Mock isolation:** the mock adapter is imported behind a compile-time `VITE_API_MODE === 'mock'` check, so production bundles contain no demo data (verified).
- **Contrast:** brand teal `#0D9488` is 3.7:1 against white, so text and buttons use `#0F766E` (5.5:1). `#0D9488` is kept for accents.
- **RTL:** logical properties (`ms-`, `pe-`, `start-`), `rtl:` icon mirroring, and LTR isolation for phone numbers and codes.
- **Accessibility:** skip link, focus moves to `<main>` on navigation, labelled controls, error announcements, ≥44px targets, reduced-motion support, and axe checks in CI.

## Known limitations

- The backend has no `/api/v1` endpoints yet. The contract is in [docs/API_CONTRACT.md](docs/API_CONTRACT.md).
- Public pages are rendered on the client only. For SEO, add prerendering (e.g. `vite-ssg`) or SSR before launch.
- Privacy and terms pages need approved legal text.
- No Content Security Policy is configured yet. Set it at the web server (fonts are self-hosted, so `default-src 'self'` plus the Reverb `connect-src` is feasible).
- Progress tracking: [docs/PROGRESS.md](docs/PROGRESS.md).
