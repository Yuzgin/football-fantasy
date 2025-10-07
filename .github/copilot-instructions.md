Purpose
-------
This file gives concise, actionable guidance for AI coding agents working on the football-fantasy repository. Focus on concrete, discoverable patterns and the exact places in the codebase where changes should be made.

Quick architecture summary
-------------------------
- Full-stack Django + React app. Backend is a Django project in `backend/` (app `api`). Frontend is a Vite + React app in `frontend/`.
- API: Django REST Framework (DRF) with JWT auth (`djangorestframework-simplejwt`). Key REST entrypoints live in `backend/api/urls.py` and `backend/api/views.py`.
- DB: Default development DB is SQLite (`backend/settings.py`), production uses an external DB (see `requirements.txt` for `psycopg2-binary`).
- Frontend: `frontend/src/api.js` uses `axios` and reads `VITE_API_URL` from environment variables. Tokens are stored in localStorage via `ACCESS_TOKEN` constant.

Developer workflows & commands (local dev)
-----------------------------------------
- Backend (dev):
  - create & activate a virtualenv, install: `pip install -r backend/requirements.txt`
  - run the server: from `backend/`: `python manage.py runserver`
  - migrations live in `backend/api/migrations/`.
- Frontend (dev):
  - from `frontend/`: `npm install` then `npm run dev` (Vite). Ensure `.env` contains `VITE_API_URL='http://localhost:8000/'`.

Project-specific conventions & patterns
-------------------------------------
- Custom user model: `api.models.CustomUser` and `AUTH_USER_MODEL = 'api.CustomUser'` in `backend/settings.py`. Use `get_user_model()` where relevant.
- Points calculation: Points are computed in `api.models.PlayerGameStats.calculate_points()` and mirrored in `api.serializers.PlayerGameStatsSerializer.calculate_points()`. If changing scoring, update both places (models + serializer) and tests.
- Team/captain logic: Team creation/update validates 11 players and captain membership in `TeamDetailOrCreateView` (`backend/api/views.py`). When creating teams, the view creates the Team first and sets M2M players before assigning captain to avoid model `clean()` validation errors.
- Snapshot points: `TeamSnapshot.calculate_weekly_points()` and `TeamSnapshotSerializer.update()` define weekly/totals behaviour. Match creation updates snapshots in `MatchListCreateView.update_team_snapshot_points()`.
- Bulk updates: `PlayerGameStatsManager.update()` triggers post-update recalculation via `transaction.on_commit(...)` calling `_recalculate_affected_players()`.

Where to make common changes
----------------------------
- New API endpoints: add views in `backend/api/views.py`, wire them in `backend/api/urls.py`, and add serializer in `backend/api/serializers.py`.
- Business logic (points, validation): change code in `backend/api/models.py` and mirror serializer behavior when appropriate.
- Frontend requests: update `frontend/src/api.js` or component files under `frontend/src/components/` (examples: `PlayerList.jsx`, `PlayerView.jsx`) to change UI/API usage.

Testing & quick checks
----------------------
- There are DRF views and serializers but no explicit test runner described; run Django tests with `python manage.py test` from `backend/`.
- Smoke test after changes:
  1) Start backend: `python manage.py runserver`
  2) Start frontend: `npm run dev`
  3) Use the browser or `curl` to call `GET /api/players/` (API root under DRF router defined in `backend/api/urls.py`).

Integration and external dependencies
-------------------------------------
- Auth: JWT handled by `djangorestframework-simplejwt` (configured in `backend/settings.py`). Tokens expected in Authorization header by axios interceptor in `frontend/src/api.js`.
- CORS: `django-cors-headers` is installed and `CORS_ALLOW_ALL_ORIGINS = True` in settings (dev); be careful when changing.
- Email: password resets use SMTP settings in `backend/settings.py`. Credentials come from `.env`.

Style and small guidelines for AI edits
-------------------------------------
- Keep database/schema changes minimal and migration-backed. If adding fields/models, add a migration in `backend/api/migrations/`.
- Preserve existing calculation logic (models and serializers) — tests and views depend on it. If you refactor, keep behavior identical and update both model and serializer implementations.
- For changes that affect frontend API shape, update `frontend/src/api.js` and relevant components together.
- Use explicit imports and existing manager methods (e.g., `PlayerGameStatsManager`) rather than adding raw SQL or heavy-query optimizations without profiling.

Files to reference for concrete examples
--------------------------------------
- auth & server entry: `backend/manage.py`, `backend/backend/settings.py`
- business logic: `backend/api/models.py` (points, snapshots, managers)
- endpoints: `backend/api/views.py`, `backend/api/serializers.py`, `backend/api/urls.py`
- frontend API client: `frontend/src/api.js` and `frontend/package.json` scripts
- README: repo-level `README.md` and `frontend/README.md` for local dev notes

If you need clarification
------------------------
- Ask about missing environment values (`.env`), expected deployments, or which game-week rules are canonical. Suggest small, isolated PRs for behavior changes.

End of instructions
