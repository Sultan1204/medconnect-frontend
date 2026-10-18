# Development checklist

Legend: ✅ done and tested · 🟡 partial · ⏳ pending · ⛔ blocked

## Phase 1 — Foundation ✅
- ✅ Vue 3 + TypeScript + Vite 8, strict TS
- ✅ Tailwind CSS v4 design tokens, light and dark themes, AA-contrast palette
- ✅ Vue Router with typed meta and auth/role/approved-doctor guards
- ✅ Pinia stores (auth, preferences, toast)
- ✅ Vue I18n: Arabic (default, RTL) and English (LTR); key-parity test
- ✅ UI kit: button, input, textarea, select, checkbox, card, badge, alert, modal, confirm dialog, toaster, skeleton, empty and error states, avatar, pagination
- ✅ Layouts: public, auth, portal (sidebar, mobile drawer, bottom nav) for patient, doctor, pharmacy and admin
- ✅ API client (Sanctum cookies, CSRF refresh, safe retry, cancellation, error normalisation, 401 handling)
- ✅ Mock API adapter, kept out of production builds
- ✅ Echo/Reverb client service (connection status, backend channel auth)

## Phase 2 — Public website ✅ (on mock data)
- ✅ Home, doctor search (URL-synced filters, pagination), doctor profile (slot picker), specialties, specialty, how it works, about, contact, FAQ, patient safety, 404
- 🟡 Privacy and terms show a "pending legal review" notice; the legal text is needed
- ⏳ Prerendering or SSR of public pages for SEO (see README, Known limitations)

## Phase 3 — Authentication 🟡
- ✅ Login, patient registration, doctor account registration, OTP, MFA, forgot and reset password, logout confirmation, role routing, session-expiry handling
- ⏳ Doctor multi-step verification wizard (Phase 5, `/doctor/verification`)

## Phases 4–10 ⏳
- Portal routes exist with navigation. Pages not yet built show a "Phase N" placeholder.
- ⛔ Phase 9 (Flutter): Flutter SDK is not installed on this machine.
- ⛔ HTTP integration: the backend has no `/api/v1` endpoints yet (see docs/API_CONTRACT.md).

## Test status (last run)
- Unit (Vitest): 66 passing
- E2E (Playwright, desktop and Pixel 7, mock mode): 60 passing, including axe WCAG 2.2 AA scans and no-horizontal-overflow checks
