# Job application workspace — design

## Purpose and scope

Build a private Job applications area in Mico's personal dashboard. Mico pastes a job-posting link, reviews or pastes the posting and screening questions, and receives an editable application package: a fit assessment, tailored résumé, cover letter, and draft answers. Mico submits applications himself and records responses in the dashboard. This first version does not submit to job platforms, connect to an inbox, recruit candidates for clients, or introduce other dashboard users.

## Product flow

1. The Planning navigation includes **Job applications**. The list shows role, company, platform, date added, application status, and latest response/follow-up. Search and status filtering help locate an application.
2. **Add application** accepts a URL. Where access and platform rules permit, the server may prefill the public posting text. The user always reviews and can edit the role, company, description, requirements, and screening questions. If import is unavailable or incomplete, the form explains why and offers manual paste; a URL alone is not required to generate.
3. Before generation, the page shows the available source profile: user-maintained career facts, approved portfolio/ASTA experience, and an uploaded résumé. The user can correct the source profile. Generated claims must be traceable to these sources; the fit assessment identifies gaps or unsupported requirements rather than fabricating experience.
4. Generate four separate drafts: fit assessment, tailored résumé, cover letter, and screening answers. Each has independent loading/error state, editable text, saved revisions, and a regenerate action. Regeneration must not silently overwrite user edits. Missing screening questions produce an explicit empty state rather than invented questions.
5. The résumé and cover letter can be exported as `.docx` from their current saved drafts. The application page also records submission date, platform, status, follow-up notes, response date/content, and a chronological activity history. Responses are entered manually.

## Architecture and data

- Add a focused Django application for job applications, separate from finance and client workflow. Store the applicant profile/source records, job postings, generated artifacts, and application activity in database models. Keep data owned by the authenticated account; the initial UI is private to Mico, but models should not hard-code his identity.
- Keep the OpenAI key and all model calls on the Django server. Provide separate authenticated endpoints for posting intake, generation/regeneration, draft edits, export, and status/activity updates. Record model usage where available so token costs can be inspected.
- The profile holds structured facts and source references. Portfolio/ASTA details become a reviewed snapshot or explicitly selected source, not an uncontrolled scrape of the public site. Résumé upload is supplementary and must not silently replace approved facts. Other applicants' résumé-based profiles are a future extension, not an initial permission feature.
- Store the raw job URL and user-reviewed posting text separately. Treat external page content as untrusted task data, not instructions to the AI or server. URL fetching must be limited to permitted public pages, block private/network-internal targets and redirects to them, enforce size/time limits, and never bypass login, anti-bot, or platform restrictions. Manual paste remains the universal path.
- Use a low-cost model for extraction/initial assessment and a stronger model only where worthwhile for final prose. Model names, prompts, and output limits are server configuration, not frontend constants. Generated material is always a draft requiring human review.
- Use the existing dashboard visual language, form controls, tabs, status indicators, and document-export conventions where applicable. Do not add a generic new design system.

## State and safeguards

- Applications distinguish `draft`, `ready`, `applied`, `interviewing`, `offer`, `rejected`, and `withdrawn`; a response is activity associated with an application, not proof of submission. The user can correct statuses and dates.
- A failed URL import does not delete pasted text. A failed generation does not delete earlier drafts. Regeneration previews or confirms replacement when the current artifact has edits. All saves report errors in context.
- The UI clearly marks AI-produced text as a draft and highlights unsupported or unverified claims. Do not invent employment history, dates, credentials, metrics, or answers to questions not supplied by the posting.
- Uploaded résumés and application records are private authenticated data. Validate file type/size, avoid logging sensitive contents, and do not put them in public media paths or public share links.
- If the API key is absent, intake and manual tracking still work; generation explains the configuration gap. Word export works only from an existing saved draft.

## Verification and exclusions

Implementation verification should cover private access, manual posting fallback, safe URL rejection, generation with and without screening questions, preservation of edits on regeneration failure, Word export, and status/response history. Include a focused visual check of desktop and mobile layouts if testing is approved at implementation time.

Excluded from version one: automated application submission, job-board scraping or login automation, inbox synchronization, automatic response detection, client hiring/candidate matching, multi-user UI, and automatic hiring decisions.
