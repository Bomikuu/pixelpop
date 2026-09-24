# Release notes

## v2026.09.24 — Portfolio update

### Highlights

- Reorganized the technology stack into Frontend, Backend, Database, DevOps, Experience, and AI Tools, with the requested technologies and icons.
- Expanded the work setup with the MacBook Air M3 and individual peripheral tiles. The Speedtest link is now a prominent action.
- Redesigned the article hero and landing-page carousel to match the supplied references.
- Added category tabs to the article library. All configured categories remain visible even when empty, and empty categories show a clear placeholder.
- Article pages now open at the top after navigation. Portfolio section headings consistently use the cobalt highlight.

### Deployment notes

- Deploy both frontend and backend changes to load newly configured article categories from the public API. The frontend includes the three existing categories if that request is unavailable.
- No database migration is required for this release.
- The GitHub/Codex Activity section remains unpublished.
