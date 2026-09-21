# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite frontend with Tailwind CSS and a Django 5 + Django REST Framework backend.

## Users

PixelPopup creators and studio/admin users author, manage, and publish personalized interactive web experiences. Recipients access those experiences through shared links and complete or explore the interactive page for a specific occasion.

## Product Purpose

PixelPopup makes it possible to create and publish personalized, shareable interactive pages for dates, weddings, birthdays, proposals, timelines, maps, quizzes, letters, mini-games, and similar occasions. Success means a creator can assemble and deliver a coherent experience, while the recipient can open the link on the web and meaningfully interact with the story, message, or activity.

## Positioning

PixelPopup is an occasion-focused interactive experience platform rather than a static invitation or generic page builder. Its distinctive mechanism is the combination of creator-authored scenes and flows with expressive, personalized web interactions, themed visuals, media, and effects.

## Operating Context

Creators work with reusable scene types, flow logic, page content, assets, themes, and publishing checks. Recipients usually arrive from a shared link, often on a phone, and experience a themed sequence of interactive moments. The current repository also contains a Django admin authoring surface and a browser-local React flow editor used for prototyping.

## Capabilities and Constraints

- Pages can contain ordered scenes, assets, variables, theme settings, password protection, expiry, draft/published/archived status, and publishing preflight checks.
- The frontend supports reusable retro/pixel UI primitives, scene components, flow transitions, overlays, effects, audio, confetti, and several demo experiences.
- The project should remain mobile-first and usable with keyboard navigation, visible focus, sufficient contrast, reduced-motion alternatives, and semantic controls.
- The default product language is personal, interactive, nostalgic, expressive, and handcrafted rather than corporate or generic.
- The backend and frontend currently use different scene/flow contracts. The canonical contract or an explicit adapter between them remains an open implementation decision.
- The public slug-driven renderer is not yet wired to the backend API; this is a productization gap, not an assumed completed capability.
- Analytics, password-attempt tracking, a separate web admin UI, and production deployment infrastructure are not yet implemented.

## Brand Commitments

The product name is PixelPopup. Existing project guidance commits the experience to retro web nostalgia: pixel/desktop-window cues, bold borders and hard-edged shadows, stickers, sound and media, CRT/VHS/glitch effects, confetti, and expressive animated overlays. Occasion-specific themes may vary in palette and tone while preserving the shared interaction language.

## Evidence on Hand

- Existing product notes: `PROJECT_CONTEXT.md`
- Existing design guidance: `DESIGN_GUIDELINES.md`
- React/Vite frontend: `pixelpopup-frontend/`
- Django backend and content model: `backendv2/`
- Existing date-planner, wedding, RSVP, visual-novel, scoreboard, flow-editor, and overlay experiences in the frontend source tree.
- No verified customer testimonials, case studies, benchmarks, or production analytics are currently documented; future work must not fabricate them.

## Product Principles

- Make each experience feel made for one person and one occasion.
- Let creators compose meaningful interactive moments without requiring every experience to be hand-coded from scratch.
- Keep the emotional message and recipient action clearer than the decoration around them.
- Preserve a shared runtime and design language while allowing occasion-specific themes and content.
- Treat publishing safety, accessibility, mobile usability, and reliable media delivery as part of the experience.

## Accessibility & Inclusion

The product is web-based and mobile-first. Interactive experiences must retain semantic controls, accessible names, visible keyboard focus, sufficient contrast, disabled/loading/error states, reduced-motion alternatives, and non-color-only state communication. Decorative effects and audio must not be required to understand or complete the experience.
