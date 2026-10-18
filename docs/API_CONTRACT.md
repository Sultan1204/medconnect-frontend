# MedConnect API contract — required backend additions

**Status:** The Laravel backend in `../backend` currently exposes only `GET /api/user`.
Every endpoint below is **a required addition, not an existing endpoint**. The web
frontend is built against this contract and runs today on the in-browser mock adapter
(`src/mocks/`, `VITE_API_MODE=mock`), which implements exactly this contract.

When the backend implements an endpoint, export the OpenAPI spec with Scramble
(already installed: `php artisan scramble:export`) and generate TypeScript types to
replace the hand-written ones in `src/types/domain.ts`.

## Conventions

| Topic | Contract |
|---|---|
| Base path | `/api/v1` |
| Auth (web) | Sanctum SPA cookie auth. SPA calls `GET /sanctum/csrf-cookie` and sends `X-XSRF-TOKEN`. Session cookie is HttpOnly, Secure, SameSite=Lax. |
| Auth (mobile) | Sanctum personal access tokens (stored in platform secure storage). Separate endpoints, to be specified in Phase 9. |
| Locale | `Accept-Language: ar` or `en`. Backend returns localised names and messages, including validation messages. |
| Single resource | `{ "data": { … } }` (Laravel API Resource) |
| Collections | `{ "data": [ … ], "meta": { current_page, last_page, per_page, total } }` |
| Validation | `422 { "message": "…", "errors": { "field": ["…"] } }` |
| Other errors | 401 unauthenticated, 403 forbidden, 404, 419 CSRF expired (the SPA refreshes the cookie and retries once), 429 with `Retry-After` |
| Money | Integer **halalas** + currency: `{ "amount": 15000, "currency": "SAR" }`. All prices, fees, balances are computed server-side. |
| Times | ISO-8601 UTC strings. The UI shows them in `Asia/Riyadh`. |
| Phone | E.164: `+9665XXXXXXXX` |

## Authentication

| Method & path | Body | Response |
|---|---|---|
| `GET /auth/me` | – | `{ data: User }` or 401 |
| `POST /auth/login` | `{ identifier, password, remember }` (identifier = E.164 phone or email) | `{ status: "authenticated", user }` · `{ status: "mfa_required", challenge_id, channel: "sms"\|"totp" }` · `{ status: "phone_verification_required", phone }` |
| `POST /auth/mfa/verify` | `{ challenge_id, code }` | `{ data: User }` |
| `POST /auth/register/patient` | `{ name, phone, email?, password, password_confirmation, accept_terms, accept_privacy }` | `{ phone }` (sends OTP) |
| `POST /auth/register/doctor` | same, `email` required | `{ phone }`. Creates a doctor with `doctor_status: "draft"`. |
| `POST /auth/otp/send` | `{ phone, purpose: "phone_verification"\|"login"\|"password_reset" }` | `{ resend_available_in: seconds }` |
| `POST /auth/otp/verify` | `{ phone, code, purpose }` | phone_verification → `{ data: User }` (signs in) · password_reset → `{ reset_token }` |
| `POST /auth/forgot-password` | `{ identifier }` | 204. **Identical response whether or not the account exists.** Email → link to `/reset-password?token=…&identifier=…`; phone → SMS code. |
| `POST /auth/reset-password` | `{ token, identifier, password, password_confirmation }` | 204 |
| `POST /auth/logout` | – | 204 |

`User`: `{ id, name, email, phone, roles: ("patient"|"doctor"|"pharmacist"|"admin")[], locale, phone_verified_at, mfa_enabled, doctor_status? }`

`doctor_status`: `draft | submitted | under_review | more_info_required | approved | rejected | suspended`.
**The backend must refuse every live-consultation action for doctors who are not `approved`**;
the frontend guard only hides those screens.

Rate-limit login, OTP send/verify and password reset (return 429 + `Retry-After`).

## Public catalogue

| Method & path | Notes |
|---|---|
| `GET /specialties` | `{ data: Specialty[] }` — `{ id, slug, name, description, icon, doctors_count }` |
| `GET /specialties/{slug}` | `{ data: Specialty }` |
| `GET /doctors` | Query: `search, specialty (slug), consultation_type (chat\|video), language (ISO 639-1), min_price, max_price (SAR), available (today\|week), verified (bool), page, per_page`. Returns paginated `DoctorSummary`. Only publicly listable doctors. |
| `GET /doctors/featured` | `{ data: DoctorSummary[] }` — selection logic is the backend's. |
| `GET /doctors/{id}` | `{ data: DoctorProfile }` |
| `GET /doctors/{id}/availability?from&to` | `{ data: [{ starts_at, ends_at, consultation_types[] }] }` — bookable slots only. |
| `GET /doctors/{id}/reviews?page` | Paginated `{ id, rating, comment, created_at, author_display_name }` (anonymised server-side). |
| `POST /contact` | `{ name, email, subject, message }` → 204 |

`DoctorSummary`: `{ id, name, title, avatar_url, specialty: {id, slug, name}, qualifications[], languages[], consultation_offers: [{ type, price: Money, duration_minutes }], is_verified, rating: {average, count} | null, next_available_at }`

- `is_verified` must be `true` **only** when the platform has verified the professional licence.
- `rating` must be `null` until the backend's minimum-review threshold is met.

`DoctorProfile` adds `{ bio, experience_years, experience: [{ title, organization, from_year, to_year }] }`.

## Real-time

- Reverb (already installed). The SPA authorises private and presence channels via `POST /broadcasting/auth` using the session cookie.
- Channel names, events and payloads for chat, consultation status and notifications will be specified in Phase 6. Payloads must not contain more medical data than the subscriber is entitled to see.

## Coming in later phases

Endpoints for appointments and booking (Phase 4), payments (provider-hosted checkout sessions only), doctor verification and availability (Phase 5), messaging and video session credentials (Phase 6), prescriptions and pharmacy (Phase 7), and administration (Phase 8) will be added to this document before their UI is built.

## Backend notes found during inspection

- `php artisan route:list` currently fails: `BROADCAST_CONNECTION=reverb` is set in `backend/.env`, but the `REVERB_APP_KEY/SECRET/ID` values are missing. Run `php artisan reverb:install`, or set the variables.
- For SPA cookie auth, set `SANCTUM_STATEFUL_DOMAINS=localhost:5173`, `SESSION_DOMAIN=localhost`, and add the `statefulApi()` middleware in `bootstrap/app.php`.
