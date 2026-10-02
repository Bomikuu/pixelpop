# Client workflow stage tabs and document sharing

## Purpose

The owner should move through a project without a narrow stage sidebar and should be able to send a client a professional, read-only document. A client should open one link on desktop or mobile, read the exact version the owner published, and print or save it as a PDF. The same document should be downloadable as an editable `.docx` file for Word or manual upload to Google Drive. Direct Drive account integration is not part of this change.

## Existing context

`ProjectWorkflowView` owns the current vertical stage navigation and project document selection. `DocumentEditor` stores Markdown as `ProjectDocument.title` and `.body`, and `DocumentPage` renders its print-style preview. Client-workflow API routes currently require owner authentication; there is no public document route. The application already has a public token-link pattern for shared bills, but its payment/PIN behavior does not apply to documents.

## Stage navigation

Replace the stage sidebar and two-column project layout with one full-width horizontal tab bar directly below the project header. Tabs stay in workflow order, show the stage name and completed/total checklist count, and retain the current-stage distinction. On narrow screens the row scrolls horizontally without wrapping; the selected tab remains visible when changed. Selecting a tab keeps the existing unsaved-document warning, selected-stage data flow, and stage-specific document behavior. `ProjectProgress`, document selection, and `ProjectRecords` then use the full content width without a secondary sidebar.

## Publishing model

Sharing is off by default and applies to one project document, never all project documents or private project notes. An authenticated owner selects **Publish link** on a saved document. Publishing copies its current title and body into immutable public snapshot fields and generates a cryptographically random, unguessable token. The public URL reveals only that snapshot. Subsequent private edits do not change it. **Republish** takes a new snapshot and rotates the token, invalidating the old URL; **Revoke** invalidates the active URL without deleting the private document. There is one active public snapshot per document, with no version archive in this iteration.

Publishing requires a nonempty title and body and no unresolved `{{placeholder}}` markers. The share controls explain that anyone holding the link can view it. The active link has an owner-only copy action and a visible publication date. The default link expires after 30 days; the owner may choose 7 days, 30 days, or no expiry at publication and may republish to extend access. An expired or revoked link returns the same neutral not-found state, without disclosing the document or client.

## Public reading and exports

The public route has no dashboard navigation, login prompt, edit controls, project checklist, fees beyond those inside the document, or private metadata. It reuses `DocumentPage` to show the published title/body in a readable document layout. **Print / Save PDF** invokes the browser print view with A4 document styling and page numbering where supported. The site does not promise a server-generated PDF file.

**Download Word (.docx)** is available to the owner for the saved private document and to a public-link holder for the published snapshot. It is a real Office Open XML document, not HTML renamed `.doc`, and preserves headings, paragraphs, lists, emphasis, horizontal rules, and tables from the supported Markdown subset. The server generates it in memory using `python-docx` and `markdown-it-py`; those are new backend dependencies requiring approval before package changes. The export uses plain document content only, with no active scripts or macros. A downloaded file can be opened in Word or manually uploaded to Drive, but editing it does not change the project document in the app.

## API and persistence

Add nullable snapshot title/body/token/published-at/expires-at fields to `ProjectDocument` with one additive migration. The owner-only document viewset gains publish, revoke, and private DOCX download actions; its serializer reports the active share status and link token only to the owner. A separate unauthenticated GET view resolves a valid token to a minimal public document response; another GET serves its DOCX. Public responses use `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, and a constant not-found response for unknown, expired, or revoked tokens. The public page also declares `noindex`. Owner writes continue to use the existing CSRF/session protection. The frontend gets a dedicated public route separate from `/business/*`, and the existing private editor gains share and export controls.

## Failure and boundary behavior

- Publishing is disabled while the editor has unsaved changes; the owner must save first.
- A token is never derived from a document ID or client name. Only its holder can access the public snapshot.
- Republish warns that the previous link will stop working; revoke confirms the same outcome.
- A malformed, expired, or revoked token produces a calm unavailable-document page, not an API traceback.
- DOCX generation must not write temporary documents to persistent storage or expose a private document through the public export endpoint.
- Public pages do not expose other documents in the project, private notes, checklist items, client contact details, or authenticated API data.

## Validation scope

When the user authorizes testing, verify stage selection and unsaved-edit protection at desktop and mobile widths; publish, revoke, republish, expiry, and owner isolation through focused API checks; public route no-login behavior; and that downloaded DOCX files open with headings and tables intact. Do not run the full application build or unrelated test suites for this feature.

## Explicit assumptions for review

The Word option means `.docx` download for manual Word/Drive use, not automatic Google Drive OAuth upload. Public links are read-only and show a frozen saved snapshot. The default expiry is 30 days, with 7-day and no-expiry options. Anyone with a valid link may download the published DOCX as well as print/save PDF.
