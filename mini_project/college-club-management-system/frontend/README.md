# ClubSphere frontend

React 19 + Vite frontend for the College Club Management System.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` in `.env` to the API base URL including `/api` (for local development, `http://localhost:5000/api`). The backend setup and full project workflows are documented in the repository root `README.md`.

## Checks

```bash
npm run lint
npm run build
npm run preview
```
