---
name: Mico Ang Portfolio
description: A modern product-engineering company portfolio built around clarity, evidence, and senior frontend leadership.
colors:
  primary: "#2f5bff"
  primary-hover: "#2149dc"
  neutral-bg: "#f8fafc"
  surface: "#ffffff"
  ink: "#0f172a"
  navy: "#0b1733"
  text-secondary: "#475569"
  text-muted: "#64748b"
  border: "#e2e8f0"
  primary-soft: "#eff6ff"
  review-star: "#fbbf24"
  available: "#10b981"
  asta-primary: "#1570ef"
  asta-primary-hover: "#0b55c7"
  asta-navy: "#071a33"
  asta-ink: "#10243e"
  asta-soft: "#f2f6fa"
  asta-muted: "#5f6f82"
  asta-border: "#dce4ec"
typography:
  display:
    fontFamily: "Saira Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(3rem, 7vw, 5.6rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Saira Condensed, Arial Narrow, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Instrument Sans, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  sharp: "3px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "96px"
  asta-section: "120px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "14px 20px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sm}"
    padding: "14px 20px"
    typography: "{typography.label}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "14px 20px"
    typography: "{typography.label}"
  input:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
    typography: "{typography.body}"
  review-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "28px"
  asta-button-primary:
    backgroundColor: "{colors.asta-primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sharp}"
    padding: "11px 19px"
    typography: "{typography.label}"
  asta-button-primary-hover:
    backgroundColor: "{colors.asta-primary-hover}"
    textColor: "{colors.surface}"
    rounded: "{rounded.sharp}"
    padding: "11px 19px"
    typography: "{typography.label}"
---

# Design System: Mico Ang Portfolio

## Overview

**Creative North Star: "The Product Engineering Company"**

The portfolio presents Mico's work in his own voice. Project names, responsibilities, screenshots, and published writing provide the substance. Keep the existing cobalt, navy, and type families, with clear project stories and a practical path to contact.

Expression comes from scale, timing, and product truth rather than developer-page decoration. A full-hero Three.js system gives the first viewport technical energy, while light neutral sections and deep navy proof fields keep the experience credible and mature.

**Key Characteristics:**

- Light neutral page fields with white content surfaces.
- Deep navy reserved for evidence, ASTA leadership, and conversion.
- One cobalt action color across links, progress, focus, and interactive proof.
- Measured fade-and-rise motion on section entry.
- Real metrics, product context, and explicit placeholder labels.

## Colors

The palette is restrained: neutral light surfaces, one structural navy, and a single cobalt interaction voice.

### Primary

- **Cobalt Action:** Used for primary buttons, links, scroll progress, focus, active carousel state, and animated data emphasis.
- **Cobalt Deep:** Used only for the primary hover state.
- **Cobalt Mist:** Used for low-emphasis certification and icon surfaces.

### Neutral

- **Cloud Field:** The default page and form-control background.
- **White Surface:** Cards, navigation, forms, and readable overlays.
- **Product Ink:** Primary text and compact high-contrast controls.
- **Evidence Navy:** Cortico proof, ASTA leadership, and the contact close.
- **Slate Secondary:** Paragraph and explanatory copy.
- **Quiet Border:** Dividers, card outlines, input strokes, and progress tracks.

### Named Rules

**The One Cobalt Rule.** Cobalt is the only general interaction color. Do not reintroduce cyan, lime, fuchsia, or multi-accent developer styling.

**The Navy Has a Job Rule.** Deep navy appears in proof, leadership, and conversion sections—not as the default page background.

## Typography

**Display Font:** Saira Condensed (Arial Narrow fallback)

**Body Font:** Instrument Sans (Arial fallback)

**Character:** Saira Condensed gives portfolio headlines an assertive editorial silhouette, while Instrument Sans keeps product copy, controls, timelines, and evidence clear and highly readable.

### Hierarchy

- **Display** (600, `clamp(3rem, 7vw, 5.6rem)`, 0.98): Hero headline only; maximum tracking compression is -0.04em.
- **Headline** (600, `clamp(2.25rem, 5vw, 3.75rem)`, 1.02): Section titles and major proof statements.
- **Title** (600, 1.125–1.5rem): Project, card, and subsection titles.
- **Body** (400, 1–1.25rem, 1.6–1.75): Narrative copy, generally capped near 70 characters per line.
- **Label** (600, 0.75–0.875rem): Navigation, buttons, dates, metric labels, and honesty badges.

### Named Rules

**The Company Voice Rule.** Headlines state the offer or evidence directly. Do not add code syntax, faux terminal copy, or decorative monospace labels.

## Layout

The page uses a centered 1280px maximum container with 20px mobile and 32px larger-screen gutters. Major sections use 96px vertical spacing, increasing to 128px on larger screens. Section headings pair a large left title with a narrower right description, then separate content with a quiet horizontal rule.

The hero is a full viewport-height field with concise content weighted left and the Three.js system positioned right on desktop. On smaller screens, content leads vertically and the system settles below it. Project stories place focused narrative above full-width proof or media so neither is compressed into a narrow column. Dense proof sections are followed by quieter reading sections.

Section entrances use a clearly perceptible 44px downward offset and opacity over 680ms with an expressive ease-out curve. Grouped cards and list items follow with 60–210ms capped staggering. Intersection Observer reveals each element once, content remains visible without JavaScript, transforms do not affect layout, and all movement is removed under reduced-motion preferences.

## Elevation & Depth

Depth is ambient and selective. Navigation uses a barely visible downward shadow. Carousels, portrait overlays, proof panels, contact forms, and review cards may use wide soft shadows with strong negative spread. Flat sections and simple lists rely on tonal contrast and borders instead.

### Shadow Vocabulary

- **Ambient panel:** `0 28px 70px -46px rgba(15,23,42,0.55)` for media and proof surfaces.
- **Review lift:** `0 22px 60px -44px rgba(15,23,42,0.5)` for testimonial cards.
- **Navigation trace:** `0 8px 30px -26px rgba(15,23,42,0.45)` for the fixed header.

### Named Rules

**The Evidence Earns Depth Rule.** Shadows are reserved for interactive media, major proof, and conversion surfaces. Ordinary content sections remain flat.

## Shapes

Corners communicate hierarchy. Buttons, fields, and small controls use 8px radii. Inline panels and compact information use 12px. Cards use 16px. Major authored surfaces—carousels, portrait frames, metric walls, and contact forms—use 24px. Pills are limited to compact tags, progress/status controls, and project navigation.

Borders are one pixel and neutral. The system does not combine strong borders with strong shadows on the same surface.

## Components

### Buttons

- **Primary:** Cobalt background, white text, 8px radius, and 14px × 20px padding.
- **Hover / Focus:** Darker cobalt on hover; high-contrast two-pixel focus outline with four-pixel offset.
- **Secondary:** White or translucent white surface with neutral border and ink text; border darkens on hover.

### Chips

- **Style:** Compact pill with white background, quiet border, and slate text.
- **State:** Hover changes border and text to cobalt. Status pills may use a small semantic green dot plus text.

### Cards / Containers

- **Corner Style:** 16px for ordinary cards; 24px for signature panels.
- **Background:** White on light sections; evidence navy for proof.
- **Shadow Strategy:** Ambient only on authored media, reviews, and conversion.
- **Border:** One-pixel quiet border on light cards; translucent white dividers on navy.
- **Internal Padding:** 24–32px, increasing to 40px for large evidence panels.

### Inputs / Fields

- **Style:** Cloud-field background, neutral stroke, 8px radius, and ink text.
- **Focus:** White surface with cobalt border.
- **Error / Disabled:** Preserve readable labels and avoid opacity below accessible contrast.

### Navigation

The fixed white header uses a simple `<MA/>` wordmark on a sharp-cornered navy rectangle, plain-language links, a résumé action, a visible numeric progress value on desktop, and a four-pixel full-width progress track at all sizes. The initials remain white and the surrounding code syntax remains cobalt, with no logo hover animation. Mobile navigation expands below the header without changing visual language.

### Project Reporting

Cortico retains its original animated metric cards and interactive traffic timeline at the user's request. Preserve supplied figures and the timeline's explanation that intermediate values are a linear interpolation rather than reported monthly traffic. The About section explains Mico's responsibilities rather than showing project-count or years-of-experience counters.

### Portfolio Refinement

Use sentence-case labels without decorative letter spacing. Center the process heading and its description. Process navigation uses compact, content-width pill tabs with Lucide icons, centered beneath the heading without a surrounding rail. The selected pill has a cobalt fill and white text; other pills have white fills, quiet borders, and clear hover and focus states. Let the pills wrap into centered rows on narrow screens rather than stretching them to fill the section. Preserve keyboard navigation. Keep gradients only where needed to maintain hero readability; ordinary sections use flat fields. Omit colored glows, decorative dot grids, and initial-letter author avatars outside the explicitly restored Cortico presentation. Article bylines use the author's actual name. Keep existing routes, section anchors, project screenshots, typography, and contact behavior.

Generated initial HTML includes the homepage's project descriptions and work history, links to published writing, full cached article bodies, and DineEase and PixelCore project details. Derive these from the same records as the React pages and the published API; show the same content to readers and crawlers. Keep an article-body snapshot for API outages during builds.

### Selected Work Scrollytelling

Selected work uses a deep-navy editorial field with full-width project chapters inside the main container. On viewports at least 1700px wide, the sticky project index occupies the unused outer-left gutter and stays centered in the viewport area below the fixed header rather than narrowing content. Smaller viewports receive a compact wrapping in-flow index with no horizontal scrolling. A narrow viewport-center observation band updates the corresponding navigation item with a white selection line, cobalt marker, brighter title, and sequence count as each project crosses it. Every project remains present in document order for search engines and assistive technology. Offscreen project chapters use `content-visibility` to reduce rendering work.

### Technology Matrix

The technology section uses a restrained three-column capability matrix on deep navy. Every item pairs a real local technology icon with its name and capability group. A short cobalt rail expands on hover to provide feedback without implying an invented proficiency percentage.

### Review Cards

Review cards use an editorial dark field, five amber stars, readable quote text, a quiet divider, and an explicit sample-copy label outside the card grid. The lead review receives more visual weight while supporting reviews remain compact. Stars communicate rating visually and through one accessible label.

### ASTA Company Surface

The ASTA routes extend the product-engineering world into a sharp, structured software-agency expression. They use ASTA Action for conversion and process emphasis, ASTA Delivery Navy for hero messaging, technology, and conversion fields, and ASTA Soft Field for company evidence. ASTA shares the portfolio's typography system: Saira Condensed for display headings and Instrument Sans for body copy, controls, labels, and supporting text. Display tracking never exceeds -0.04em.

The landing page uses a compact 64px header and a full-viewport team-photography hero. A bottom-left navy panel occupies roughly half of the image and ends in a clean diagonal edge. Both “Start a project” actions open one focused client-inquiry dialog that records the inquiry in Django and sends a Resend notification. Below the hero, four delivery steps form one connected white workflow, followed by a structured services grid, a categorized navy technology matrix, JSON-driven team profiles, an editorial company-activities carousel with a near-viewport accessible lightbox, honest testimonial-reservation states, and a careers application form using the same delivery flow. At 860px and below, the hero panel becomes full-width and each grid or matrix reflows into progressively simpler columns without page-level overflow.

ASTA is flat by default. One-pixel dividers, tonal fields, and photographic overlays create hierarchy without card shadows. Primary buttons use a sharp three-pixel radius; process cells, technology cells, founder profiles, reviews, and photographs remain square. The route-specific sharpness does not replace the portfolio's existing radius hierarchy.

The delivery process is content, not decoration: it stays semantic, ordered, and readable at every breakpoint. Founder and employee records display supplied information or obvious placeholders, never invented identities. Technology cells use local icons without proficiency percentages. Section reveals rise 22px and fade over 550ms, run once through Intersection Observer, keep layout stable, and disappear under reduced-motion preferences.

### Business Application Review Workspace

Job application details use the existing dashboard's white surfaces, slate text, cobalt actions, Instrument Sans typography, Lucide icons, and shared shadcn/Radix controls. They do not inherit the portfolio's dark editorial section treatments.

Keep five sticky primary tabs: Overview, Requirements, Checks, Files / Preview, and Activity. Overview uses a roughly 70/30 desktop split with a sticky review summary; it stacks on smaller screens. Show a short fit narrative, at most three priority findings, and three recent activities. Full evidence, original posting, recruiter checks, proposal review, documents, and usage remain available in their dedicated workspaces. Compact status shortcuts use real application data, never invented build results or reviewer metadata.

Long prose and evidence use explicit expansion controls. Document previews have their own viewport-based scroll region; never constrain the entire editor or form to constrain its preview. Focus preview opens a near-screen-sized accessible dialog with a clear exit, not browser fullscreen. Preserve unsaved draft text across tab switches, confirm before leaving unsaved proposal decisions, and retain all existing source-review and AI-cost approval gates.

Application profile keeps reusable project records separate from freeform facts. Tools, contributions, optional year/outcomes and ASTA/independent/client context save through the profile form; edits reset confirmation. Only user-confirmed project details are generation sources. Conservative/strong emphasis and review-questions/exclude defaults belong in Application AI settings and remain visible in Checks → Tailor résumé. Strong changes emphasis, never invents proficiency, years or outcomes.

Generate experience examples opens a compact shared-field parameter form, then the existing cost quote. Hypothetical examples and linked study plans are separate Interview preparation proposals, not résumé facts. Approve wording for preparation is distinct from Record my actual contribution, which requires factual confirmation. Unconfirmed examples never enter résumé exports or change assessment evidence coverage. Offer one priority clarification before source-backed tailoring, with an explicit option to continue unresolved. Accepted examples and accepted résumé changes can seed preparation only after another explicit cost approval; no automatic paid follow-up. Keep long examples collapsed, preserve earlier preparation, and reject stale or foreign proposal references.

Final check → Resolve issues offers Auto-answer all through the existing quote and spending guard. Draft answers use reviewed profile/résumé sources, confirmed ASTA/independent projects and prior factual answers; never treat hypothetical examples or checklist suggestions as history. Preserve existing replies, show a compact batch review with expandable sources and longer answers, and require one accuracy confirmation before saving. The one-pass résumé fix has its own separate cost approval and proposal review. Show honest request activity and allow recovery of saved answers without another paid call; reject results from changed checklists, sources or saved answer versions. Keep the modal's shared scroll body and fixed footer, alongside the existing individual-answer controls.

### Personal Nutrition Workspace

Nutrition stays within the dashboard's existing white surfaces, Instrument Sans,
cobalt actions, solid-bordered fields, Lucide icons and shared shadcn/Radix
controls. Runtime `--pd-*` tokens and shared dashboard primitives remain canonical;
this feature does not change portfolio tokens or introduce another visual theme.
Use low variance (3/10), restrained motion (2/10) and medium density (5/10).

Keep the daily date in the workspace header. Below a compact toolbar, show one
daily calorie/macro overview, then a roughly two-thirds meals / one-third activity
and weight split on desktop, stacked on mobile. Targets and weight entry belong
in separate dialogs. Meals expose food details on expansion; duplication and
save-as-preset live in a secondary menu. Missing entries use short inline states,
not large empty illustrations. Sparse weight data stays compact.

Food is the default progress basis; Net explicitly subtracts logged active burn,
not total expenditure. A food-over-target warning survives switching to Net.
Below 90%, approaching 90–<100%, exactly reached and over-target states include
text, not color alone. Clamp fills, retain real negative/over-target values, and
respect reduced motion. Missing food stays missing; a logged zero remains real.
Historical comparisons use current targets without modifying stored entries.

Analytics has its own Week / Month / Custom dates and Overview / Trends / History
tabs, independent of daily navigation. Overview uses four primary metrics and a
smaller supporting row; charts and sortable history live in their dedicated views.
Compare equal immediately preceding ranges, label both date spans, and bound
requests to 366 days. Food/net averages use food-logged days only, while total
active burn includes activity-only dates. Weight charts plot actual dated readings.
Logging-calendar dots mean records exist, not that a health target was achieved.

Reuse opens a reviewed draft; selection never creates a meal. Presets and optional
goal weight sync through Django, not browser-only storage. Presets are independent
snapshots. New meal request keys protect uncertain retries; keep the same key
with the same draft and surface conflicts. Suggestions retain recorded portions
and are optional comparisons, not health prescriptions or invented meals.

Preserve errors and drafts, confirm deletion/discard, return dialog focus and abort
stale requests. Use local scroll regions for long food lists, tables and dialogs.
The 2026-10-21 implementation has source/design-detector review only; runtime
tests, browser checks and migration application require separate approval.

### Dashboard Smokey Companion

The personal and business dashboards share the supplied seated Smokey Sr. sprite sheet as a stationary bottom-right companion. Keep the anchor fixed through scrolling, clicks, and route changes; do not reuse roaming or drag behavior. Cursor direction uses eased, crossfaded seated poses, while success and error notifications use happy and concerned expressions. Disable gaze motion for reduced-motion and touch-only users, and suspend animation while the document is hidden.

Dashboard snackbar feedback is temporarily presented only through Smokey's white speech bubble, using the existing Radix Toast primitives and dashboard tokens. Preserve the original toast/snackbar code behind `STANDARD_DASHBOARD_TOASTS_ENABLED = false`, so it can be restored without rebuilding it. Queue notifications, deduplicate rapid identical messages, pause success dismissal on hover/focus, and keep errors until dismissed. Retain the exact operation message and inline form errors alongside Smokey's contextual acknowledgment. Dashboard greetings are page-specific. The portfolio uses the same smaller stationary companion with public-only responses and existing action links, without loading dashboard theme styles. ASTA retains its roaming behavior and public-only responses.

## Do's and Don'ts

### Do:

- **Do** make the offer, proof, and next action clear within the first viewport.
- **Do** use cobalt consistently for interaction and progression.
- **Do** keep section entry motion subtle, one-time, layout-stable, and disabled for reduced-motion users.
- **Do** present metrics, credentials, testimonials, and placeholders with honest labels.
- **Do** let product evidence and team imagery carry the page.
- **Do** keep ASTA process stages semantic, ordered, and legible when the runway reflows.
- **Do** use supplied ASTA photography and explicit profile placeholders instead of invented identities.

### Don't:

- **Don't** use neon multi-color accents, faux terminals, code-window traffic lights, giant developer glyphs, or decorative grid fields.
- **Don't** use monospace typography as a general technical costume.
- **Don't** turn every content group into a lifted card.
- **Don't** animate continuously outside the hero; scroll motion should resolve once and leave the content stable.
- **Don't** present planned certifications or sample testimonials as earned or verified.
- **Don't** turn ASTA process, technology, or founder matrices into rounded shadow cards.
- **Don't** add unverified ASTA client, scale, revenue, or outcome claims.
