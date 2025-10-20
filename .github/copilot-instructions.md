Project: ProyectoIng2 — quick reference for AI coding agents

This file contains the minimal, actionable knowledge an automated coding agent needs to be productive in this repo.

- Big picture
  - Monorepo with two main parts: backend (Express + SQLite) in `/backend` and frontend (React + Vite) in `/frontend`.
  - Backend exposes a small REST API under `/api` mounted in `backend/server.js`:
    - /api/auth -> auth routes
    - /api/survey -> survey submission, export, results
    - /api/admin -> subjects + stats
  - DB: single SQLite file `backend_data.sqlite` created/seeded by `backend/db.js`. Tables: users, subjects, surveys, survey_answers.

- Key files to inspect when changing behavior
  - `backend/routes/adminRoutes.js` — statistics endpoints, feedback generator. Central place to add aggregated metrics (averages, participation, distributions). Example: GET `/api/admin/stats/:subjectId` returns { stats, averagesByType, participation, distribution, feedback }.
  - `backend/routes/surveyRoutes.js` — survey submission and export. Surveys are inserted into `surveys` and `survey_answers` tables.
  - `backend/db.js` — schema and seed data (subjects: Matemáticas, Física, Programación). Use this to understand id vs name.
  - `frontend/src/api.js` — client HTTP wrappers (use these functions rather than hardcoding fetch). Example: `getStats(token, subjectId)` -> GET `/api/admin/stats/:subjectId`.
  - `frontend/src/components/AdminPanel.jsx` — admin UI, charts and feedback rendering. When changing front-end behavior use Chart components already registered.
  - `frontend/src/components/SurveyForm.jsx` — where surveys are submitted; after submit the form fetches `/api/admin/stats/:subjectId` to show student feedback.

- Important conventions and patterns
  - Authentication: JWT in `Authorization: Bearer <token>`. Backend middleware `authenticate` (in `backend/middleware.js`) expects this header for most admin/survey endpoints.
  - Subject identity: `subject.id` is numeric primary key. Some endpoints accept subject name; backend route `adminRoutes.js` includes a defensive lookup if non-numeric id is provided.
  - Likert mapping: answers are stored as labels (Spanish):
    - 'Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'
    - Backend converts these to 1..5 for averages.
  - Frontend charting: `chart.js` is used in `AdminPanel.jsx` (components registered at top). Follow the existing pattern for datasets and colors.

- Developer workflows / commands
  - Start backend (dev): run Node on `backend/server.js` (the server binds to port 4000). If port is in use, stop other instances or change PORT env var.
  - Start frontend (dev): from `/frontend` run `npm install` then `npm run dev` (project uses Vite). Frontend expects backend at `http://localhost:4000`.
  - Export: admin panel uses `/api/survey/export` to download an Excel with all results; backend uses `XLSX` to generate it.

- Integration points & external deps
  - SQLite (local file) — all data lives in `backend_data.sqlite`. Modifying schema requires careful migration or rebuilding the file.
  - bcrypt (used in `db.js`) — for seeded passwords. jwt for auth (`middleware.js`).
  - Chart.js on frontend — register components before usage (already done in `AdminPanel.jsx`).
  - XLSX (backend) — used to export results to .xlsx.

- Patterns to follow when implementing features
  - Add backend aggregation endpoints under `backend/routes/adminRoutes.js`. Return JSON shaped like existing responses to avoid breaking frontend: { stats, averagesByType, participation, distribution, feedback: { teacher:[], student:[] } }.
  - Frontend should use functions in `frontend/src/api.js` to call backend; prefer adding new helpers there if new endpoints are created.
  - When adding charts, reuse `Bar` and `Pie` components from `react-chartjs-2` and the project's registered ChartJS components.
  - Keep student-facing feedback displayed by `SurveyForm.jsx` after submit (it calls `/api/admin/stats/:subjectId` and uses `feedback.student`). Admin/Professor views should display `feedback.teacher` only.

- Examples (copy/paste friendly)
  - Request stats for subject id 2 (requires token):
    GET http://localhost:4000/api/admin/stats/2  (Authorization: Bearer <token>)
  - Expected minimal successful response structure:
    {
      "stats": [{ "question_index":1, "question_text":"...", "avg_score":4.2, "responses":10 }, ...],
      "averagesByType": [{ "surveyType":"30%", "avg_score":3.5 }, { "surveyType":"70%", "avg_score":4.1 }],
      "participation": [{ "surveyType":"30%", "submissions":12, "students_count":10 }],
      "distribution": [{ "label":"De acuerdo", "count":34 }, ...],
      "feedback": { "teacher": [...], "student": [...] }
    }

- What NOT to change without confirmation
  - The DB schema in `backend/db.js` (unless you provide a migration). Tests and seeded users rely on existing columns.
  - The CSV/Excel export shape unless the frontend export consumer is updated.

- Quick troubleshooting
  - If `GET /api/admin/subjects` returns 401: ensure the request includes the Authorization header with a valid JWT.
  - If charts show 'no data' but DB has entries: ensure surveys have `subject_id` populated and `survey_answers` rows exist. Use `/api/survey/results` to inspect raw rows.

If anything is unclear or you want additional examples (e.g., sample SQL queries, chart config snippets, or feedback wording expansions), tell me which section to expand.
