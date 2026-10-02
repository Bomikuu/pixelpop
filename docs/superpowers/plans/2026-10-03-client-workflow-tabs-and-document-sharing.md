# Client Workflow Tabs and Document Sharing Implementation Plan

> **For agentic workers:** Implement task by task in the existing checkout. Follow the approved spec and preserve unrelated uncommitted work. The project forbids automatic tests and builds unless the user explicitly authorizes them; the focused test commands below are conditional on that approval.

**Goal:** Replace the project-stage sidebar with top tabs and let the owner publish a revocable document snapshot that clients can read, print to PDF, or download as a real `.docx` file.

**Architecture:** Keep private document editing in the existing owner-only viewset. Add snapshot fields to `ProjectDocument`, explicit publish/revoke actions, and separate token-only public read/download views. Generate DOCX in memory from the saved or published Markdown. Reuse the existing `DocumentPage` for the public frontend and keep stage selection state in `ProjectWorkflowView`.

**Tech Stack:** Django 5, Django REST Framework, React 19, React Router, Tailwind, `react-markdown`, `python-docx`, `markdown-it-py`.

**Spec:** `docs/superpowers/specs/2026-10-03-client-workflow-tabs-and-document-sharing-design.md`

## Global constraints

- Do not alter current project stage data flow, document selection, or unsaved-edit protection.
- Preserve all existing user work in the dirty checkout, especially `backendv2/db.sqlite3`; never stage it.
- A public link exposes one explicitly published snapshot only, never current private edits or client/project metadata.
- Use existing business-dashboard visual language and Tailwind for app chrome; the document remains print-like.
- Do not add Google OAuth/Drive sync or server-side PDF generation.
- Do not run tests, builds, or migrations against the user's local database without the user's explicit authorization.

## Review focus

- Unsaved document edits: stage changes continue to prompt, and publishing stays disabled until Save.
- Token lifecycle: republishing invalidates the previous token; revocation and expiry return the same neutral 404.
- Owner isolation: another authenticated owner cannot publish, revoke, or download a private document.
- Public data shape: token GET exposes title/body/kind/publication time only, never related client or project fields.
- Export fidelity: a multi-page agreement retains headings, emphasis, lists, and tables in DOCX and print.

---

### Task 1: Move stage navigation above the project content

**Files:** Modify `pixelpopup-frontend/src/features/business-dashboard/client-workflow/ProjectWorkflowView.jsx`.

**Interface:** Keep `selectedStage`, `stageItems`, `activeDocument`, and `reportDirty` unchanged. Replace the `xl:grid-cols-[210px_minmax(0,1fr)]` sidebar shell with a top `<nav aria-label="Project stages">` and a full-width content stack. Tabs stay in `STAGES` order with completed/total counts; the active tab has `aria-current="step"`. At narrow widths, use one-line horizontal overflow and scroll the selected tab into view without moving keyboard focus.

- [ ] Capture the existing unsaved-change condition before editing the layout.
- [ ] Move only the stage navigation and remove the sidebar grid; retain `ProjectProgress`, documents, and `ProjectRecords` behavior.
- [ ] Source-review selected tab, counts, keyboard focus, horizontal overflow, and unsaved-change prompt at the relevant JSX branches.
- [ ] If testing is authorized, run one focused desktop/mobile UI check for tab selection and unsaved-edit protection; do not run a full build.

### Task 2: Add owner-controlled publication state and public read API

**Files:** Modify `backendv2/client_workflow/models/document.py`, `backendv2/client_workflow/api/serializers.py`, `backendv2/client_workflow/api/views.py`, `backendv2/client_workflow/api/urls.py`; create `backendv2/client_workflow/migrations/0002_document_publication.py`, `backendv2/client_workflow/services/public_documents.py`, `backendv2/client_workflow/api/public_documents.py`, and focused `backendv2/client_workflow/tests/__init__.py` plus `test_public_documents.py` if tests are authorized.

**Interfaces:** `publish_document(document: ProjectDocument, expiry: Literal["7", "30", "never"]) -> ProjectDocument` copies saved title/body, records publication time/expiry, and rotates a `secrets.token_urlsafe(32)` token atomically. `revoke_document(document) -> ProjectDocument` clears the active token and snapshot metadata. `resolve_public_document(token: str) -> ProjectDocument | None` accepts only active, unexpired tokens. Owner actions: `POST documents/{id}/publish/`, `POST documents/{id}/revoke/`. Public response: `GET documents/share/{token}/` with `title`, `body`, `kind`, `published_at` only. Additive model fields: unique nullable token, nullable snapshot title/body, published and expiry times. Owner serializer exposes share state/token read-only; public serializer is separate.

- [ ] If testing is authorized, write focused API tests asserting owner isolation, no pre-publication access, snapshot stability after private PATCH, token rotation, revoke, 7/30/never expiry, placeholder rejection, and minimal public response.
- [ ] Implement migration, service functions, owner actions, and public GET using DRF `AllowAny` with no session authentication; return identical 404 responses for unknown/revoked/expired tokens.
- [ ] Set `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow` on all public responses; owner actions inherit CSRF/session protection.
- [ ] Source-review publish input validation: only `expiry` accepted, document title/body nonempty, no `{{...}}` markers, and no unsaved client body sent to the endpoint.
- [ ] If testing is authorized, run only `.venv/bin/python manage.py test client_workflow.tests.test_public_documents` from `backendv2` using a test database.

### Task 3: Produce a genuine DOCX from Markdown

**Files:** Modify `backendv2/requirements.txt`, `backendv2/client_workflow/api/views.py`, `backendv2/client_workflow/api/urls.py`; create `backendv2/client_workflow/services/docx_export.py` and focused `backendv2/client_workflow/tests/test_docx_export.py` if tests are authorized. Add the public download view to `backendv2/client_workflow/api/public_documents.py`.

**Interfaces:** `render_docx(title: str, body: str) -> bytes` parses the supported Markdown subset with `markdown-it-py` and creates an in-memory Word document with `python-docx`. Support heading levels 1-3, paragraphs, strong/emphasis, ordered/unordered lists, horizontal rules, and GFM tables. `GET documents/{id}/docx/` uses the owner-only saved title/body; `GET documents/share/{token}/docx/` uses the same token resolver and published snapshot. Both return the DOCX MIME type and a safe attachment filename.

- [ ] Add bounded `python-docx` and `markdown-it-py` requirements approved with the spec; do not add a Drive SDK.
- [ ] If testing is authorized, write a round-trip test that opens generated bytes with `docx.Document(BytesIO(...))` and checks the title, heading text, list text, table cells, and that private content does not appear in the public export after a later edit.
- [ ] Implement the converter in one service file; keep any temporary data in memory and never inject raw HTML, scripts, or macros.
- [ ] Wire private/public download endpoints and ensure the public one has the same no-store/noindex and invalid-token behavior as public reading.
- [ ] If testing is authorized, run only `.venv/bin/python manage.py test client_workflow.tests.test_docx_export` from `backendv2` using a test database.

### Task 4: Add private sharing controls and public document page

**Files:** Modify `pixelpopup-frontend/src/features/business-dashboard/client-workflow/DocumentEditor.jsx`, `pixelpopup-frontend/src/features/business-dashboard/client-workflow/api.js`, `pixelpopup-frontend/src/App.jsx`; create `pixelpopup-frontend/src/features/business-dashboard/client-workflow/DocumentSharing.jsx` and `pixelpopup-frontend/src/pages/SharedDocumentPage.jsx`. Reuse `DocumentPage.jsx` and the existing print action from `shared.jsx` without changing master-template sharing.

**Interfaces:** The owner sees Publish, Copy link, Republish, Revoke, and Download Word only for project documents. Publish offers 7 days, 30 days (default), or no expiry and is disabled while the editor is dirty or placeholders remain. Republish/Revoke confirm old-link invalidation and update the document record returned by the API. Public route `/documents/share/:token` fetches the minimal public API without authentication, renders the snapshot with `DocumentPage`, exposes Print / Save PDF and Download Word, sets page-level `noindex`, and shows a neutral unavailable state for 404. Suppress portfolio overlays on this route as on `/shared-bills/:token`.

- [ ] Implement sharing actions in a focused child component; keep the document editor's Save/preview behavior intact.
- [ ] Create the public page with responsive print-style reading, keyboard-visible actions, loading/error states, and no private dashboard chrome.
- [ ] Source-review the public fetch path, blob/download URLs, copying the exact frontend URL, noindex cleanup on unmount, and active-link/expiry copy.
- [ ] If testing is authorized, perform one bounded UI pass of owner publish/revoke and public read/print/download on desktop and mobile; do not run a full build.

### Task 5: Integrated review and safe handoff

**Files:** Only files changed by Tasks 1-4; do not modify unrelated finance or database files.

- [ ] Review the staged/unstaged diff against every spec section and verify no private fields appear in public serializer or DOM.
- [ ] Verify migration is additive and does not rewrite saved drafts or existing templates; leave `db.sqlite3` untouched.
- [ ] If the user authorizes tests, run the two focused backend modules together and a single public-route visual check; no repository-wide build/lint.
- [ ] Commit only clearly isolated task changes if requested or safely separable; never include pre-existing dirty user files in a commit. Report any work left uncommitted.
