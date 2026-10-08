# Job application workspace Implementation Plan

**Goal:** Add a private business-dashboard workflow that prepares and tracks applications using selectable AI providers.
**Architecture:** A separate `job_applications` Django app owns per-user profiles, provider preferences, applications, draft revisions, generation usage, and activity. Focused React components in `business-dashboard/job-applications` use the existing authenticated business shell and shared dashboard form components.
**Tech Stack:** Django REST Framework, React, Tailwind, existing shadcn primitives, python-docx, approved pypdf dependency, provider HTTP APIs.
**Spec:** `docs/superpowers/specs/2026-10-04-job-application-workspace-design.md`

## Constraints and review focus

- Keep existing uncommitted changes and the personal database intact; no deployment or production mutations.
- Keep credentials server-side, scope every object to its owner, and send data only to the chosen provider.
- Block restricted/private URL targets; manual pasted content is always available.
- Preserve draft edits across failed/regenerated requests and use revision checks against concurrent saves.
- Use existing modal, input, select, panel, and tab patterns; separate forms and services by responsibility.
- User instructions prohibit initiating tests/builds without a testing request; review changed source and provide focused manual checks.

## Tasks

- [x] Add `backendv2/job_applications/models.py`, initial migration, authenticated API serializers/views/URLs, and register the app. Models: ApplicantProfile, ApplicationAISettings, JobApplication, ApplicationArtifact, ArtifactRevision, ApplicationActivity, GenerationRun. Validate profile confirmation, status/date inputs, and object ownership.
- [x] Add `services/resumes.py` for bounded PDF/Word/text extraction; `services/postings.py` for HTTPS allowlist import and manual fallback; `services/providers.py` for provider catalog and HTTP adapters; `services/generation.py` for normalized drafts, revision protection, prompt source boundaries, idempotency, and usage estimates. Reuse existing Word rendering for export. Document environment setup.
- [x] Add `job-applications/api.js`, `JobApplicationsView.jsx`, `ApplicationDetail.jsx`, `ApplicationForm.jsx`, `ApplicantProfileForm.jsx`, `ApplicationAISettings.jsx`, and artifact/history components inside the business-dashboard feature. Provide list/detail routes, editable profile review, source upload, four draft tabs, regeneration confirmation, download, and response/status logging.
- [x] Extend business dashboard Career navigation with Job applications and Application AI; redirect older personal-dashboard application links. Reuse choice tiles for provider avatars and Clients/Templates editor/preview/print components. Provide the unchanged original portfolio résumé PDF alongside generated Word and Print / PDF exports. No database changes are needed for this relocation.

## Implementation handoff

- Approved `pypdf` dependency installed locally; additive migration `job_applications.0001_initial` applied only after verifying the database target was the project's local SQLite file.
- Existing unrelated edits and database records were preserved. No production deployment, secret changes, commit, or push.
- Source review performed. Tests, builds, browser verification, and live generation were not run; the chosen provider needs a configured server-side API key for live generation.
- Backend setup and focused manual checks are in `backendv2/job_applications/README.md`.

Execution is native in this session, as authorized by the user. No API calls using real credentials are needed to implement the provider adapters.
