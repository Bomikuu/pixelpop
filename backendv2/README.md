PixelPopup.exe — Project Handoff Summary

1. What the product is

PixelPopup.exe is an admin-created interactive web experience platform.

You (admin) create custom interactive pages for clients (valentine invites, birthdays, proposals, timelines, mini-games, maps, Q&A, sprite scenes).

End-users only view and interact via a unique link (/slug).

No client-side editor yet; creation is done via Django Admin.

Frontend themes (e.g. Friendster/MySpace colorful retro style) are handled in React later.

Backend is schema-driven but allows custom React overrides per page or per scene.

2. Tech stack (backend)

Django 5

Django REST Framework

SQLite (dev), production-ready for Postgres

django-cors-headers

django-json-widget

Session-based admin auth (no JWT yet)

3. Django app

Single app:

pixelpopup

Project structure (current):

pixelpopup/
admin.py
apps.py
models.py
migrations/

api/
serializers.py
permissions.py
validation.py
preflight.py
template_io.py
views.py
urls.py

management/
commands/
clone_page.py

4. Core data models
   Core rendering engine

Page

slug, title, status (draft/published)

theme_id (frontend theme registry)

theme_settings (JSON overrides)

variables (JSON, used by scenes)

renderer (optional custom React component)

privacy: password + expiry

owner (admin user)

Scene

belongs to Page

key (stable string identifier, e.g. sc_intro)

type (motion, question, choice, timeline, map, exploration, letter, finale)

order

data (JSON schema for interactive content)

optional renderer override

optional per-scene theme override

Asset

belongs to Page

file (image/video/audio/gif)

type, label, mime, meta

Business / operations layer

ClientRequest

client info, brief, structured inputs (JSON)

workflow status (new → paid → delivered)

optional linked Page

assigned admin

Payment

linked to ClientRequest

amount, currency, method, status

receipt upload

5. Django Admin setup (important)

Inline editing

Scenes + Assets inline inside Page

Payments inline inside ClientRequest

django-json-widget applied to all JSONFields:

Page: variables, theme_settings, renderer

Scene: data, renderer, theme_override_settings

ClientRequest: inputs

JSON editor supports tree + code mode (safe editing)

6. Validation system (very important)
   Structural validation (schema-level)

Implemented in api/validation.py:

Validates Scene.data structure by scene type

Validates objects (id, type, layout/state/motion/content)

Validates triggers (on, do)

Validates actions (allowed actions + required fields)

Prevents unknown keys

Runs:

in DRF serializer (API)

in Scene.clean() (admin saves)

Reference validation (DB-aware)

Implemented in SceneSerializer:

All referenced assets must exist for the Page

All referenced scene keys must exist

All target_id must match object IDs in the same scene

7. Publish workflow
   Preflight

Checks if a Page is safe to publish:

has scenes

all scenes validate structurally

all asset / scene / target references resolve

Returns { ok, issues[], start_scene_key }

Publish

Runs preflight

If clean → sets Page status to published

If not → refuses to publish

Available via:

DRF endpoints

Django Admin bulk action (“Preflight + publish”)

8. Productivity features
   Clone Page (management command)

Command:

python manage.py clone_page <page_id>

Creates a new draft Page

Copies scenes

Optionally copies asset DB rows (reuses same files)

Can reset password & expiry

Used as a template system before a full editor exists

9. Template export / import (JSON-based)
   Export

GET /api/admin/pages/{id}/export/

Outputs JSON:

page config

scenes

assets metadata (file names + URLs, not embedded files)

Import

POST /api/admin/pages/import/

Creates a new draft Page

Reuses assets by filename if they exist in storage

Returns import report (scenes created, assets reused, warnings)

(Current MVP assumes same storage; asset-key remapping not added yet.)

10. API overview
    Public (no auth)

Fetch page by slug (published only)

Password verification endpoint if protected

Admin (staff-only)

CRUD for Page, Scene, Asset, ClientRequest, Payment

Preflight endpoint

Publish endpoint

Export / Import template endpoints

11. CORS + Auth

django-cors-headers enabled

SessionAuthentication + CSRF

Intended flow:

Django Admin for now

React frontend later (same or allowed domain)

12. What is NOT built yet (intentionally)

React public experience renderer

Admin web UI outside Django Admin

Asset key remapping for cross-server template imports

Analytics (views, password attempts)

JWT auth

13. Current project status

✅ Backend architecture complete
✅ Admin workflow usable
✅ Validation + safety in place
✅ Ready for frontend rendering
