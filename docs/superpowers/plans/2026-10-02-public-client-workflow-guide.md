# Public Client Workflow Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a static, useful client-workflow How-to with copyable blank checklists and proposal outlines, without exposing private client records or the full agreement draft.

**Architecture:** Extend the existing portfolio How-tos index with one authored React article page. The guide uses the existing article shell and static SEO generation; it does not call the client-workflow API or Django.

**Tech Stack:** React 19, React Router, Tailwind CSS, existing portfolio article components, existing SEO generator.

**Spec:** `docs/superpowers/specs/2026-10-02-client-workflow-and-public-guide-design.md`

## Global Constraints

- The page is public, static, and readable without authentication.
- Show the nine workflow stages, copyable blank discovery questions, recap-email outline, and proposal outline.
- Do not show a full agreement draft, client contacts, prices, private notes, or content fetched from the private API.
- Attribute the source video without presenting its example commercial terms as universal rules.
- Inherit the current portfolio article typography, white/slate/cobalt palette, and table-of-contents pattern. Design variance: low; motion: low; density: medium.
- Project instructions prohibit running automated tests, builds, or browser automation unless the user explicitly requests them. Manual checks below are not commands to run unasked.

## Review Focus

1. Anonymous visitors can access the guide with no login redirect; Task 1 checks route placement.
2. Copy buttons provide useful text and report clipboard failure clearly; Task 1 checks both states.
3. The page cannot display private client data because it has no private API call/import; Task 1 checks module dependencies.
4. A narrow viewport keeps the article and stage navigation readable; Task 1 checks responsive classes and manual review path.
5. The public guide does not accidentally include the agreement draft or suggest one jurisdiction's legal terms; Task 1 checks copy against the spec.

---

## File map

- `pixelpopup-frontend/src/pages/portfolio/how-tos/ClientWorkflowGuidePage.jsx`: article content, stage navigation, copy controls, and clear attribution.
- `pixelpopup-frontend/src/pages/portfolio/how-tos/howTos.js`: public guide directory entry.
- `pixelpopup-frontend/src/pages/portfolio/how-tos/HowTosIndexPage.jsx`: choose a relevant icon per guide while preserving the existing list design.
- `pixelpopup-frontend/src/App.jsx`: lazy-loaded public route.
- `pixelpopup-frontend/scripts/generate-seo.mjs`: static SEO entry for the new route.

### Task 1: Author and register the public guide

**Files:**
- Create: `pixelpopup-frontend/src/pages/portfolio/how-tos/ClientWorkflowGuidePage.jsx`
- Modify: `pixelpopup-frontend/src/pages/portfolio/how-tos/howTos.js`, `HowTosIndexPage.jsx`, `pixelpopup-frontend/src/App.jsx`, `pixelpopup-frontend/scripts/generate-seo.mjs`

**Interfaces:**
- Consumes existing `ApplicationPageShell` and the How-tos index pattern.
- Produces public route `/portfolio/how-tos/client-workflow` with canonical SEO metadata and one directory entry.
- Produces copy controls for each stage checklist and the plain-text discovery, recap, and proposal outlines; clipboard errors are shown in the page UI rather than silently ignored.

- [ ] **Step 1:** Add a static `howTos` entry and a distinct workflow icon mapping without redesigning existing guide cards.
- [ ] **Step 2:** Build the article with the nine stages from the spec, scannable per-stage checklists, the three copyable blank outlines, source-video attribution, and a note that the agreement is a draft requiring appropriate review—not a universally valid contract.
- [ ] **Step 3:** Add named section anchors/table of contents and copy-button success/error feedback for every checklist and outline using existing portfolio colors, typography, focus states, and responsive spacing.
- [ ] **Step 4:** Register the lazy route and static SEO metadata. Confirm the page source has no import or fetch from `/api/v1/client-workflow/` and contains no full agreement body or client-specific data.
- [ ] **Step 5:** Review the source for anonymous availability, mobile reading order, anchor targets, keyboard labels, copy fallback, and accurate example language. Do not run a browser test or build unless authorized.
- [ ] **Step 6:** Commit only the new guide and directly related route/index/SEO files as `feat: add public client workflow guide`.

## Handoff

Do not push or deploy without a further user request. Preserve existing uncommitted How-tos and other user-owned work; when staging this task, avoid accidentally committing unrelated edits already present in `App.jsx`, `generate-seo.mjs`, or `HowTosIndexPage.jsx`.
