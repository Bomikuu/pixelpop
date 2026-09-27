# Shared inquiry delivery implementation plan

Based on the approved [design](../specs/2026-09-23-shared-inquiry-delivery-design.md). Execute sequentially in the current task. Do not alter unrelated dirty files; live provider calls stay mocked.

## 1. Django record and configuration

- Add `InquirySubmission` to `backendv2/pixelpopup/models.py` with UUID, kind, normalized fields, delivery status, provider ID, failure category, payload fingerprint, and timestamps.
- Generate a migration and register a staff-only searchable view in `backendv2/pixelpopup/admin.py`.
- Document `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `INQUIRY_TO_EMAIL`, and `TURNSTILE_SECRET_KEY` in `backendv2/.env.example`; require a persistent `DATABASE_URL` for this endpoint on Vercel.
- Test model creation and uniqueness before wiring providers.

## 2. Public endpoint and delivery service

- Add kind-specific serializers/validation and `POST /api/v1/inquiries/` through Django URL configuration. Restrict to POST, enforce a small payload limit, and reject unknown fields.
- Verify Turnstile server-side with the expected action; silently discard honeypot submissions. Avoid logging or storing secrets and tokens.
- Persist a pending record before sending. Send a deterministic plain-text message to `mico.dahang@gmail.com` via Resend with `reply_to` and the record UUID as the idempotency key. Store sent/failed outcome and provider message ID.
- Treat duplicate UUID + identical payload as one submission; reject UUID reuse with different data. Expose a staff-only retry action, limited by Resend's 24-hour idempotency window.
- Add focused Django tests with mocked Turnstile/Resend responses for all three kinds, validation, persistence-before-send, failures, duplicates, and retries.

## 3. Connect the three forms

- Add one frontend submission helper that targets `VITE_API_BASE_URL` and maps response states without leaking credentials.
- Make `TurnstileWidget` accept an action. Preserve portfolio contact behavior while moving it to the Django endpoint.
- Replace ASTA project and careers `mailto:` submission handlers with API calls; add Turnstile, honeypot, and accurate sending/sent/saved-but-delayed/error copy. Keep existing layout, fonts, and non-form email links.
- Keep the generated submission UUID stable across client retries; refresh an expired Turnstile token. Reset forms only on confirmed delivery.
- Read `PRODUCT.md`, `DESIGN.md`, and `DESIGN_GUIDELINES.md` before editing user-facing components and follow applicable UI skill checks.

## 4. Remove old path and verify

- Remove the unused `pixelpopup-frontend/api/contact.js` route after all forms use Django; update frontend `.env.example` to remove server-only contact/Resend settings.
- Run the targeted Django suite, migration checks, frontend lint for touched files, and Vite build. Do one local browser visual/interaction check for the forms, using mocked service responses and no real email.
- Report any deployment prerequisites: Resend key, verified sender domain, persistent PostgreSQL URL, Turnstile keys, API base URL, and CORS origin. Do not claim live delivery was tested without those values.
