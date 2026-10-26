# Practical 6: RESTful API with CRUD Operations

## Objective
Build and deploy a RESTful API using Node.js and Express.js. Verify CRUD endpoints using Postman locally and through a public hosting URL.

## Technology
- Node.js 22.5+ and Express.js
- SQLite database by default using Node's built-in `node:sqlite` module
- Optional PostgreSQL support through `pg` and `DATABASE_URL`
- Postman for testing
- Render for hosting

## Record structure
Each record contains `name` (required, 2–100 characters), `email` (valid email, required) and `course` (required, up to 100 characters). The database generates an ID and records creation/update timestamps. The records table is created automatically at startup.

## Run locally
1. Install Node.js 22.5 or later.
2. Open a terminal in `practical_6` and run:

```bash
npm install
npm start
```

3. By default, the API stores data in `practical_6/records.sqlite`. To use PostgreSQL instead, copy `.env.example` to `.env` and set `DATABASE_URL` to a valid PostgreSQL connection URL.
4. Visit `http://localhost:3000/` or `http://localhost:3000/health`.

## API endpoints

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| GET | `/api/records` | Read all records | `200 OK` |
| POST | `/api/records` | Create a record | `201 Created` |
| GET | `/api/records/:id` | Read one record | `200 OK` |
| PUT | `/api/records/:id` | Update a record | `200 OK` |
| DELETE | `/api/records/:id` | Delete a record | `200 OK` |
| GET | `/health` | Check API/database status | `200 OK` |

Example JSON for POST and PUT (Postman Body → raw → JSON):

```json
{
  "name": "Aarav Patil",
  "email": "aarav@example.com",
  "course": "Software Engineering"
}
```

## Test using Postman
Import `postman/CRUD-API.postman_collection.json`. The `baseUrl` variable defaults to `http://localhost:3000`. Run **Create record** first; its test saves the generated ID as `recordId`. Then run list, get-by-ID, update, delete, and verify-deleted-record requests. A validation request checks that missing fields return `400`.

## Render deployment
The API Web Service is configured on Render:
- Public URL: `https://webtech-practical6-api.onrender.com`
- Repository: `rugved0149/web-technology`, branch `main`
- Build command: `cd practical_6 && npm install`
- Start command: `cd practical_6 && npm start`

The current service is configured to use the SQLite fallback. **Important:** Render's free service filesystem is ephemeral, so records may be lost after a restart or redeploy. For persistent cloud storage, configure `DATABASE_URL` in the Render service with a valid PostgreSQL connection string; the code automatically uses PostgreSQL whenever the value starts with `postgres://` or `postgresql://`.

## Response codes
- `200`: read/update/delete succeeded
- `201`: record created
- `400`: invalid ID, invalid JSON or field validation failure
- `404`: record or route not found
- `500`: unexpected server error
- `503`: database health check failed

## Submission evidence
- [ ] Check the public `/health` URL and confirm the database reports connected
- [ ] Run the Postman collection locally, if required
- [ ] In Postman, set the collection variable `baseUrl` to `https://webtech-practical6-api.onrender.com`
- [ ] Capture successful responses for CREATE, READ, UPDATE and DELETE from the public URL
- [ ] Capture the validation failure response

The code and Postman collection are in the repository. Save screenshots after running the requests so the report contains observed test results rather than assumed results.
