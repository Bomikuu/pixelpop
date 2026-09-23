# Shared inquiry delivery for ASTA and portfolio

## Intent and scope

Visitors should be able to submit the ASTA project form, ASTA careers form, and portfolio contact form without opening an email client. Every valid submission must be recorded in Django and trigger a Resend notification to `mico.dahang@gmail.com`. This replaces the two ASTA `mailto:` form submissions and the portfolio-only Vercel contact handler. Ordinary email links remain links; they are not submissions and are not recorded.

No API key has been supplied. Implementation can be verified with mocked external calls, but live delivery is unavailable until the owner configures Resend and the production database.

## Chosen architecture

The browser posts each form to one public Django endpoint, `POST /api/v1/inquiries/`, using the existing `VITE_API_BASE_URL`. Django owns validation, Cloudflare Turnstile verification, persistence, and Resend delivery. The frontend never receives the Resend or Turnstile secret.

This avoids the alternatives of (1) routing through the Vercel function before Django, which adds another trust and failure boundary, and (2) saving in Django while sending from Vercel, which can leave records and delivery out of sync. The obsolete portfolio `/api/contact` handler is removed after the portfolio form uses Django.

## Request and stored record

The request has a `kind` discriminator (`portfolio_contact`, `asta_project`, or `asta_careers`), a client-generated UUID `submissionId`, the form's current fields, a blank honeypot field, and a Turnstile token. Validation is specific to each kind. Required consent is enforced server-side for both ASTA forms. Names, addresses, URLs, option values, and free text have explicit length and format limits; unrecognized fields are rejected. No file attachments are in scope.

A new Django `InquirySubmission` model stores the UUID, kind, sender name and email, normalized form details, creation time, delivery state (`pending`, `sent`, or `failed`), Resend message ID when known, and a short non-sensitive failure category. The raw Turnstile token, API key, and full provider error body are never stored. Django Admin exposes searchable, staff-only records and a deliberate retry action for failed notifications. There is no public list or read endpoint.

The UUID is unique in Django. Repeating the same request cannot create another record or send another notification. The Resend request uses the persisted UUID as its idempotency key and a deterministic email payload. Resend currently retains these keys for 24 hours; uncertain failures older than that require staff review before a retry, rather than an automatic second send.

## Submission and delivery flow

1. Django checks the request size and schema, honeypot, configured service, and Turnstile token/action. The expected actions are `portfolio-contact`, `asta-project`, and `asta-careers` for their respective kinds. Invalid or bot submissions are not stored or emailed. Honeypot submissions receive a generic success response without being stored. Turnstile must be checked server-side for each new submission.
2. Django saves the normalized inquiry as `pending` before calling Resend. If the database write fails, it does not send an email.
3. Django sends a plain-text notification from a configured, verified sender address to `mico.dahang@gmail.com`, with the visitor's address as `reply_to` and a kind-specific subject. It records the Resend message ID and marks the row `sent` on acceptance.
4. If Resend fails or times out, Django keeps the row, marks it `failed`, and returns a distinct response that says the inquiry was saved but email notification is delayed. It must not claim delivery succeeded. Staff can inspect and retry from Admin within the provider's safe idempotency window.
5. A repeated `submissionId` returns the existing status without another send. A mismatched payload for an existing UUID is rejected.

The UI has sending, sent, saved-but-not-notified, validation, bot-verification, and service-unavailable states. It preserves input on failure and resets after confirmed success. The existing portfolio Turnstile widget becomes reusable with a form-specific action; the ASTA forms receive the same protection and a honeypot. Existing form layout and design remain otherwise unchanged.

## Configuration and deployment

Backend environment variables: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `INQUIRY_TO_EMAIL` (set to `mico.dahang@gmail.com`), and `TURNSTILE_SECRET_KEY`. The frontend keeps only `VITE_TURNSTILE_SITE_KEY` and `VITE_API_BASE_URL`. CORS must allow the deployed frontend origin. A verified sender domain and persistent production PostgreSQL `DATABASE_URL` are release requirements. The endpoint must refuse submissions on a serverless deployment without persistent database configuration rather than silently writing to ephemeral SQLite.

The old frontend-only Resend/contact environment variables are removed from frontend documentation once the migration is complete. Secrets are not committed. No live email is sent by automated tests.

## Verification

Backend tests cover all three schemas, authentication exemption only for POST, invalid input, missing consent, honeypot, Turnstile failure, database-first ordering, Resend success/failure, duplicate UUIDs, and retry behavior. Frontend checks cover each form's success and failure copy and Turnstile reset behavior. Build/lint and targeted Django tests are run; external Resend and Turnstile requests are mocked. Live delivery is verified by the owner after supplying production configuration.

## References

- [Resend idempotency keys](https://resend.com/changelog/idempotency-keys)
- [Cloudflare Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
