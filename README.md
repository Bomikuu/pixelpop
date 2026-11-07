# PixelPopup

<p align="center"><img src="pixelpopup-frontend/public/workspace-icons/icon-512.png" alt="PixelPopup workspace icon" width="160" /></p>

PixelPopup is a React and Django workspace for interactive web experiences,
portfolio content, reusable frontend experiments, and admin-managed client
pages.

## Current workspace

The repository currently includes:

- A modern Mico Ang portfolio with project case studies, service pages,
  articles, interview material, and a guided Work With Me flow.
- An ASTA Softwares site with service and team pages.
- Interactive portfolio elements built with React, Tailwind CSS, Three.js,
  Mapbox, and accessible motion fallbacks.
- PixelPopup experience modules including invitations, visual novels,
  scoreboards, overlays, and reusable retro UI components.
- A Django REST backend for pages, scenes, assets, portfolio profiles,
  articles, cover letters, and staff publishing workflows.

Recent portfolio work adds a light editorial design system, Saira Condensed
display typography, Instrument Sans body typography, interactive Three.js hero
scenes, animated evidence metrics, a responsive project workflow, and a
recommendation matcher for direct Mico or ASTA team engagements.

## Portfolio application materials

The portfolio also includes recruiter-facing application pages that share the
same modern editorial system as the main portfolio:

- `/portfolio/introduction-letter` presents a downloadable general cover
  letter with applicant context, contact details, and a print-like reading
  surface.
- `/portfolio/introduction-letter/:coverLetterSlug` loads a published,
  opportunity-specific letter from the Django portfolio API while retaining a
  safe default if the request is unavailable.
- `/portfolio/intro-video` provides the companion personal-introduction page.

The application pages preserve accessible headings, keyboard-visible actions,
responsive single-column layouts, and clear loading or fallback messages.

## Requirements

- Node.js 20 or newer
- npm
- Python 3.10 or newer
- SQLite for local Django development

## Frontend commands

```bash
cd pixelpopup-frontend
npm install
cp .env.example .env
npm run dev
```

The Vite development server is available at the URL printed in the terminal.
The main portfolio route is `/portfolio`.

Run the frontend and local serverless API together:

```bash
cd pixelpopup-frontend
npm run dev:all
```

Additional commands:

```bash
npm run build          # create a production bundle
npm run preview        # preview the production bundle
npm run lint           # run ESLint
npm run deploy:public  # prepare the public deployment output
```

On WSL, `pixelpopup-frontend/run-all.sh` loads Node 20 through nvm when
available and starts `npm run dev:all`.

## Backend commands

```bash
cd backendv2
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

The Django API runs at `http://localhost:8000` by default. Portfolio endpoints
use `/api/v1/portfolio/`, while the interactive API documentation is available
at `/api/docs/`.

## Useful development URLs

- `/portfolio` - portfolio landing page
- `/portfolio/work-with-me` - engagement options and project matcher
- `/portfolio/services` - services overview
- `/portfolio/articles` - article library
- `/portfolio/introduction-letter` - downloadable introduction letter
- `/portfolio/intro-video` - personal introduction video page
- `/asta` - ASTA Softwares landing page
- `/components` - component catalogue
- `/examples/playground` - interactive examples

## Environment

Copy the included `.env.example` files before local development. The frontend
example documents the API base URL, contact email integration, and Turnstile
configuration. Never commit populated `.env` files or production credentials.

## Personal and business workspace

Alongside the public portfolio, this repository contains authenticated personal and business dashboards. Personal modules cover records, bills, subscriptions, funds, people, events, insights and daily notes. Business modules include client workflows, member details and job applications. Mobile workspace components provide compact record cards and disclosure controls for smaller screens; the progressive web app includes its own manifest, icons and offline presentation.

The portfolio learning library includes full-stack AI, AWS infrastructure, design-style examples and interview reference material. These are educational content and interactive guides, not automatically provisioned cloud services.

## Repository guide

- `pixelpopup-frontend/src`: React application, portfolio pages, workspace features and shared UI.
- `pixelpopup-frontend/public`: published illustrations, workspace icons and portfolio assets.
- `backendv2`: Django APIs, migrations and domain services, including finance and job applications.
- `docs`: design decisions, implementation plans and audit notes.
- `PRODUCT.md`, `DESIGN.md` and `UX-CONTRACT.md`: product scope and interaction guidance.

## Local data and publication

Use your own local database and environment configuration. Do not publish local database changes, uploaded private records, credentials, dependency installations or analysis caches. The existing tracked `backendv2/db.sqlite3` is a local-data risk: preserve your working copy and review it separately rather than adding it to routine source updates. Initialize new development data using Django migrations and an account you create locally.

README commands describe available development workflows; they are not a claim that builds, tests, integrations or deployment have been verified for every commit.
