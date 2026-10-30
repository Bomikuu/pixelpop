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

### Light and Dark Appearance

The public portfolio and its subpages, personal dashboard, and business dashboard
share a light/dark preference. Follow the device theme until a visitor chooses
with the sun/moon control, then remember that choice across reloads, routes, and
browser tabs. Set the initial mode before React paints. Keep the control visible
in the portfolio header, both workspace headers, and personal sign-in, with a
44px target, a descriptive action label, and visible keyboard focus. Collapse the
portfolio navigation below 1024px so the control fits beside its mobile menu.

Light mode preserves the current palette. Dark mode uses a #0b1220 canvas,
#131f32 surfaces, #e8eef8 primary text, restrained slate separators, and brighter
cobalt links. Filled primary actions retain cobalt with white labels. Adapt
fields, menus, portaled dialogs, status messages, and the hero readability layer;
preserve artwork, existing navy proof sections, document export colors, and chart
category meanings. Theme the installed workspace's runtime theme-color as well.

Shared appearance roles live in `src/ui/theme/siteTheme.css`; dashboard `--pd-*`
roles reuse them. Scope the appearance to portfolio/workspace routes, including
their portals, so authored invitation and demo themes keep their own palettes.

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

Keep the original inline résumé editor and preview in Files / Preview. Expand editor opens a viewport-filling modal, with `/business/applications/:id/resume` preserving browser navigation and direct links. The modal covers the sidebar and page chrome, traps focus, locks background scrolling and restores its launcher on close. Preserve draft text when opening or closing it; use the existing save, revision, source review and Word/PDF export rules. Put revisions, document exports and focused preview in More actions. Keep Import JSON, External AI prompt, Tailor résumé and Save draft visible.

Move the Tailor résumé workflow into the expanded editor. Its supporting pane switches between Preview, Tailor & check, Proposals and Experience drafts. Keep final checks accessible on the posting’s Checks tab with a link to expanded tailoring. Quote approval, generation activity and proposal review remain in the editor flow. Keep locally written experience text across supporting-pane changes and confirm before discarding unsaved proposal decisions. Disable dismissal during save or generation requests.

Start Tailor & check with at most three requirement gaps, required criteria first. Include partial or missing evidence, recorded limitations and quotation/reconfirmation flags; expand posting excerpts and source evidence on demand. Open the existing evidence-decision form directly from a gap without closing the editor. Stale assessments hide earlier priorities and offer reassessment through the existing cost quote. External prompt focus starts with the current priorities; suggest up to three confirmed projects by posting-term matches against names, system types and tools, with editable checkbox selections. Selections guide emphasis, never evidence status, and all confirmed sources remain available. These prompt controls do not change shared AI settings or make a paid request.

The versioned JSON contract is `schemaVersion: 1`, Markdown `header`, ordered `sections` with plain-text `title` and Markdown `content`, and optional `reviewNotes`. Accept a file or pasted JSON, validate before preview, and require review of the full replacement before applying it to an unsaved draft. Keep the 30,000-character document limit and a 256 KB JSON limit; provide Undo import until another edit or save. External prompts include the whole current document, posting and confirmed sources and request every section, including unchanged content. Offer emphasis, detail, focus and confirmed/exploratory experience controls. Exploratory prompts can invent possible contributions and outcomes as unverified reviewNotes. The Experience drafts pane lets the user edit suggestions and insert selected wording into a chosen section after review; it never changes shared profile facts or evidence coverage automatically. These notes remain available for the current application session and in JSON export; they are not saved as profile facts. No external AI request is sent automatically.

Long prose and evidence use explicit expansion controls. Document previews have their own viewport-based scroll region; never constrain the entire editor or form to constrain its preview. Focus preview opens a near-screen-sized accessible dialog with a clear exit, not browser fullscreen. Preserve unsaved draft text across tab switches, confirm before leaving unsaved proposal decisions, and retain all existing source-review and AI-cost approval gates.

Application profile keeps reusable project records separate from freeform facts. Tools, contributions, optional year/outcomes and ASTA/independent/client context save through the profile form; edits reset confirmation. Only user-confirmed project details are generation sources. Conservative/strong emphasis and review-questions/exclude defaults belong in Application AI settings and remain visible in Checks → Tailor résumé. Strong changes emphasis, never invents proficiency, years or outcomes.

Generate experience examples opens a compact shared-field parameter form, then the existing cost quote. Hypothetical examples and linked study plans remain separate Interview preparation proposals. Approve wording for preparation is distinct from Record my actual contribution, which requires factual confirmation. Examples do not automatically enter a résumé or change assessment evidence coverage; the expanded editor offers a separate, user-reviewed insertion step for editable draft wording. Keep uninserted experience drafts when switching panels or closing and reopening the editor within the same application. Offer one priority clarification before source-backed tailoring, with an explicit option to continue unresolved. Accepted examples and accepted résumé changes can seed preparation only after another explicit cost approval; no automatic paid follow-up. Keep long examples collapsed, preserve earlier preparation, and reject stale or foreign proposal references.

Final check → Resolve issues offers Auto-answer all through the existing quote and spending guard. Draft answers use reviewed profile/résumé sources, confirmed ASTA/independent projects and prior factual answers; never treat hypothetical examples or checklist suggestions as history. Preserve existing replies, show a compact batch review with expandable sources and longer answers, and require one accuracy confirmation before saving. The one-pass résumé fix has its own separate cost approval and proposal review. Show honest request activity and allow recovery of saved answers without another paid call; reject results from changed checklists, sources or saved answer versions. Keep the modal's shared scroll body and fixed footer, alongside the existing individual-answer controls.

### Dashboard Mobile and Installed App

Below 1024px, use dedicated mobile headers and home compositions instead of
stacking desktop controls. The header has a page title, theme control, and
refresh; personal search opens from an icon.
The compact masthead uses the existing MA cube artwork and Mico Workspace name,
with the current page title directly beneath the wordmark at 13px. Omit the
redundant Personal/Business context and workspace subtitle. Keep Instrument Sans for
tasks and data; Saira Condensed is reserved for the wordmark and Quick actions
title. The business home summary uses the existing delivery navy with pale blue
supporting text. Personal Today follows the supplied light balance-card reference,
using theme-aware surfaces so it also works in dark mode.
Keep the date controls in a compact trailing row below the masthead with equal
44px control heights. Preserve the nutrition day picker and previous/next controls.
Keep vertical padding at 8px to limit the sticky header's height.
Workspace switching belongs in the More drawer through a labeled, two-choice
Personal / Business segmented toggle. Preserve guarded navigation and the selected
workspace when a draft prevents leaving; retain keyboard arrow-key navigation.
Preserve desktop headers, sidebars, route/query state, and draft guards.

The bottom bar is 80px plus the phone's safe-area inset, with five slots and a
raised cobalt circular plus in the exact center. Personal navigation is Today,
Money, Quick actions, Nutrition, More. Business navigation is Today, Clients,
Quick actions, Applications, More; without a leadership plan, use Clients,
Applications, Quick actions, Templates, More. The plus opens a rounded, floating
bottom sheet above the bar, with three columns of circular icons and short action
labels, following the supplied mobile references. Personal actions reuse expense,
Quick Entry, task, bill, meal, and activity forms. Mobile adds EOD, loan, and shared
bill creation for nine actions in three rows; nutrition actions come first
on Nutrition. Business actions open the existing client, application, or active
week action form after guarded navigation. Consume the compose intent once, with
no saved writes on navigation. Restore focus to the plus when dismissed and pass
focus into the destination form after the sheet closes. EOD and shared bills
consume a one-time compose intent after arrival;
EOD opens group setup first when no groups exist. Loan creation opens the existing
People loans form. More retains grouped navigation and its user footer. Hide
bottom navigation with the keyboard and
cover it with the full-page résumé editor.

Personal mobile Today leads with current cash/bank balance, selected-month
income/expenses, attention rows, debt/receivables, and a short upcoming list;
the full existing financial figures remain in an expandable section. The balance
card uses a transparent cutout of the supplied Smokey illustration as a WebP
(296×320px, approximately 13 KB), anchored to the banner's right edge. Render
the pale blue waves and halftone dots separately in CSS. Use neutral charcoal
textures in dark mode; workspace dark surfaces and the app theme color are black
and charcoal, with cobalt retained for actions and focus. Keep the texture behind
the balance and reserve space beside the account caption. Show the current cash
balance versus the previous calendar month's closing balance, reconstructed from
the same recorded account ledger and independent of the reporting-month selector.
Include the prior amount and date, and omit a percentage for a zero baseline.
The card includes
actual cash/bank/e-wallet account count and names, and a Manage accounts action.
Income and expense comparisons reuse the existing previous-month data, with no
percentage badge for a zero baseline. Do not fabricate debt trends or
imply these manually tracked accounts have a live bank connection. Attention
rows and debt/receivable shortcuts follow the supplied rounded-card reference.
Keep the illustration clear of the amount and all controls. The mobile
business home emphasizes plan progress, current saved actions, actual evidence
and ownership counts, and continuity checks. Keep all detailed workspaces in
navigation. Nutrition uses a compact calorie progress card on phones, with a transparent
food-themed Smokey WebP over CSS dots and waves, and a three-column macro row.
Keep the illustration beside the calories on small phones and alongside the full
card on wider screens. The calorie heading opens the existing target controls.
Keep one small Food/Net button inside the mobile summary card; it displays the
current basis and switches to the other on press. Retain Nutrition tools in the
outer header. Logged meal and food-item thumbnails use the supplied image URL
when available, otherwise a compact transparent isometric food-bowl WebP, also
falling back when an image fails. Keep the empty meal list's original icon and
copy. Nutrition analytics summary tiles use one column below the desktop breakpoint;
retain the existing desktop columns and all unknown-intake meanings.
Retain the four original summary tiles on desktop. The bar uses recorded food or
net values, clamps only its visual fill, and shows missing food as unknown. Preserve food-over-target warnings, target definitions, and
the distinction between logged active burn and total expenditure.

Mobile motion explains navigation and actions. The Quick actions sheet arrives
from the centered plus in 280ms, with a capped 125ms icon stagger and a faster
160ms exit. The navigation marker moves between the five slots in 240ms. Page
changes use a short 180ms transition without remounting views; initial loading
and the full-screen resume editor skip that transition. More slides from the
left, and press states acknowledge taps. No scrolling reveals or continuous
decorative loops. Respect reduced motion, cancel interrupted page animations,
keep content visible by default, and preserve existing focus restoration.

Dashboard financial and nutrition summary values count from zero to the recorded
value over 800ms when first visible or when the value changes. Reserve the final
number's width, update only its text node, and expose the final value to assistive
technology. Reduced motion shows the final value immediately; unknown values
retain their placeholder instead of counting from a fabricated zero.

On phones, shared record forms fill the visual viewport with fixed header/actions and one scrolling field region. Respect keyboard resizing, safe areas, validation focus and discard confirmation. Dashboard Smokey sits above the 80px bottom navigation; while a phone dialog or keyboard owns the screen, defer its bubble without dismissing queued notifications. Existing inline errors remain in the form. Public companion positioning stays unchanged.

The two dashboards share the Mico Workspace PWA identity and existing brand artwork. Installation guidance belongs in More and the expanded desktop sidebar. Preserve public-page metadata when leaving a workspace. The first release caches only a static offline document and app icons: private data, authenticated HTML, API calls, downloads and public portfolio routes stay on the network. Never replay writes or AI requests offline. Service-worker updates wait for workspace windows to close, with a notice to save first and no forced reload.

### Quick Entry Capture

The default Quick Entry dialog uses the supplied amount-first reference: a small
receipt-holding Smokey cutout, Expense/Income choices, a large peso amount,
the real daily-guide preview, four category shortcuts with More, an optional
description and one Save button. Keep light workspace surfaces and neutral black
dark-mode surfaces, cobalt actions, semantic expense/income accents and restrained
state transitions. The transparent receipt WebP is 264×320px, approximately 19 KB.

Save one entry for today through the existing quick-entry endpoint, without an
account; state that account assignment happens in Entry review. The optional note
becomes the transaction description, falling back to its category or type. Amounts
retain exact cents. The guide reuses the existing calculation and includes the
valid draft amount; it never prevents saving. An uncertain response freezes the
entry and reuses its request ID until confirmed, preventing duplicate saves.

Keep the original QuickEntryDialog and batch form intact behind Full Quick Entry.
Confirm discarding an unsaved single-entry draft before leaving or switching to
the full form. Keep category search behind See all, safe-area footer spacing,
keyboard focus restoration, semantic labels and reduced-motion behavior.

### Personal Dashboard Daily Priorities

The desktop Today tab uses an underline navigation rail and a compact greeting
banner with the same transparent Smokey WebP as mobile, over CSS textures.
Arrange the six primary financial figures in two columns, preserving the summary
tile pattern and hover movement. Show comparisons and small trends only where
recorded historical data exists. Place attention items and compact deadlines
beside today's task and bill list, with All, Tasks and Bills filters. Keep extra
financial figures and the original deadline views in expandable details.
Use current-date priorities independently of the selected reporting month. Reuse
the overdue review, task completion, payment and entry-review workflows; keep
Remind tomorrow. Preserve the existing mobile home and black dark-mode surfaces.

Provide a skip link and focus the page heading after route changes, waiting for
the mobile navigation drawer to close and preserving active dialog focus.
Keep list searches, periods, categories, transaction types, pagination and asset
view modes in resource-scoped URL parameters; preserve unrelated parameters.
Overview tabs also restore from the URL. Offer Clear filters and inline date-range
errors. On refresh failure, retain records only for the same query and label them
as the last loaded results. Keep manual workspace refresh available.

Load record forms, Quick Entry and the calendar dialog on demand. While loading,
keep an accessible, dismissible dialog with a clear status; failed loads offer
Retry and Reload workspace. Hand focus to the loaded dialog and restore its
launcher when dismissed. Preserve existing draft and save protections.

Record forms keep their header and save/cancel actions visible while fields
scroll. After validation fails, focus an affected control once saving has ended
and inline errors are rendered; use a focusable error summary for general or
unavailable fields. Keep drafts intact, including an inline new-person draft.

### Personal Nutrition Workspace

Nutrition stays within the dashboard's existing white surfaces, Instrument Sans,
cobalt actions, solid-bordered fields, Lucide icons and shared shadcn/Radix
controls. Runtime `--pd-*` tokens and shared dashboard primitives remain canonical;
this feature does not change portfolio tokens or introduce another visual theme.
Use low variance (3/10), restrained motion (2/10) and medium density (5/10).

Keep the daily date in the workspace header. Daily overview has one Nutrition tools
button in its header; it opens a modal of titled, described action buttons for
meals, activity, weight, the library, calendar and targets. Selecting one closes
the picker before opening its destination. Below the overview header, show the
original four daily summary tiles (calories, protein, carbs and fat), each with
progress, its daily target and remaining/over amount. Follow with a roughly two-thirds meals / one-third activity
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
The larger logging calendar colors food-logged days green at or below the current
food calorie target and red above it; unlogged dates remain neutral. Include a
legend and keep selection distinct with an outline. This compares recorded food
only, never net calories, and is not a judgment about health or day completion.

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
