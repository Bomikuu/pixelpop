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
    fontFamily: "Public Sans, sans-serif"
    fontSize: "clamp(3rem, 7vw, 5.6rem)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Public Sans, sans-serif"
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

The portfolio should feel like a senior product-engineering company presenting its capabilities and proof, with Mico as the accountable technical leader. The page is clear, restrained, and conversion-oriented: a direct offer, measurable evidence, understandable product stories, and a practical path to contact.

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

### Animated Proof Wall

Cortico evidence uses two oversized animated metrics followed by four supporting measures on evidence navy. Numbers begin counting only when the panel enters the viewport. Screen readers receive the final value immediately; reduced-motion users receive the final value without animation.

### Selected Work Scrollytelling

Selected work uses a deep-navy editorial field with full-width project chapters inside the main container. On viewports at least 1700px wide, the sticky project index occupies the unused outer-left gutter and stays centered in the viewport area below the fixed header rather than narrowing content. Smaller viewports receive a compact wrapping in-flow index with no horizontal scrolling. A narrow viewport-center observation band updates the corresponding navigation item with a white selection line, cobalt marker, brighter title, and sequence count as each project crosses it. Every project remains present in document order for search engines and assistive technology. Offscreen project chapters use `content-visibility` to reduce rendering work.

### Technology Matrix

The technology section uses a restrained three-column capability matrix on deep navy. Every item pairs a real local technology icon with its name and capability group. A short cobalt rail expands on hover to provide feedback without implying an invented proficiency percentage.

### Review Cards

Review cards use an editorial dark field, five amber stars, readable quote text, a quiet divider, and an explicit sample-copy label outside the card grid. The lead review receives more visual weight while supporting reviews remain compact. Stars communicate rating visually and through one accessible label.

### ASTA Company Surface

The ASTA routes extend the product-engineering world into a sharp, structured software-agency expression. They use ASTA Action for conversion and process emphasis, ASTA Delivery Navy for hero messaging, technology, and conversion fields, and ASTA Soft Field for company evidence. Public Sans remains the common type voice; display tracking never exceeds -0.04em.

The landing page uses a compact 64px header and a full-viewport team-photography hero. A bottom-left navy panel occupies roughly half of the image and ends in a clean diagonal edge. Both “Start a project” actions open one focused client-inquiry dialog that prepares a reviewable email to ASTA. Below the hero, four delivery steps form one connected white workflow, followed by a structured services grid, a categorized navy technology matrix, JSON-driven team profiles, an editorial company-activities carousel with a near-viewport accessible lightbox, honest testimonial-reservation states, and a careers application form that prepares an email until a recruitment API is connected. At 860px and below, the hero panel becomes full-width and each grid or matrix reflows into progressively simpler columns without page-level overflow.

ASTA is flat by default. One-pixel dividers, tonal fields, and photographic overlays create hierarchy without card shadows. Primary buttons use a sharp three-pixel radius; process cells, technology cells, founder profiles, reviews, and photographs remain square. The route-specific sharpness does not replace the portfolio's existing radius hierarchy.

The delivery process is content, not decoration: it stays semantic, ordered, and readable at every breakpoint. Founder and employee records display supplied information or obvious placeholders, never invented identities. Technology cells use local icons without proficiency percentages. Section reveals rise 22px and fade over 550ms, run once through Intersection Observer, keep layout stable, and disappear under reduced-motion preferences.

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
