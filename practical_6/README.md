# Practical 6: RESTful API with CRUD Operations

## Objective
Build and deploy a RESTful API using Node.js, Express.js and PostgreSQL. Verify the endpoints using Postman locally and after deployment.

## Technology
- Node.js and Express.js for HTTP routes
- PostgreSQL for persistent database storage
- `pg` for parameterized SQL queries
- Postman for API testing
- Render for hosting the API and database

## Record structure
Each record contains `name` (required, 2–100 characters), `email` (valid email, required) and `course` (required, up to 100 characters). PostgreSQL automatically assigns an ID and stores creation/update timestamps.

## Run locally
1. Install Node.js 20 or later and create a PostgreSQL database.
2. Open a terminal in `practical_6` and run:

```bash
npm install
```

3. Copy `.env.example` to `.env` and replace `DATABASE_URL` with the PostgreSQL connection string. For a local database, it may look like `postgresql://username:password@localhost:5432/webtech_crud`. Do not commit `.env`.
4. Start the API using `npm start`. Visit `http://localhost:3000/` or `http://localhost:3000/health`. The records table is created automatically when the server starts.

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
Import `postman/CRUD-API.postman_collection.json`. The `baseUrl` variable defaults to `http://localhost:3000`. Run **Create record** first; its test saves the generated ID as `recordId`. Then run list, get-by-ID, update, delete, and verify-deleted-record requests. A validation request checks missing fields return `400`.

## Deploy on Render
A Render PostgreSQL database was provisioned for this practical. The associated API Web Service is configured from this repository using:
- Repository: `rugved0149/web-technology`
- Branch: `main`
- Build command: `cd practical_6 && npm install`
- Start command: `cd practical_6 && npm start`
- Database environment variable: `DATABASE_URL`, linked to the Render PostgreSQL service

After Render finishes deploying, open the service URL ending in `.onrender.com`, then check `/health`. In Postman, set the collection variable `baseUrl` to that exact public URL and repeat the CRUD requests against the public API.

**Database lifecycle:** this database was created on Render's free plan and is scheduled to expire on 25 November 2026. Export any needed submissions/data before expiry, or upgrade/recreate the database to keep it beyond that date.

## Response codes
- `200`: read/update/delete succeeded
- `201`: record created
- `400`: invalid ID, invalid JSON or field validation failure
- `404`: record or route not found
- `500`: unexpected server error
- `503`: API cannot reach its database during the health check

## Submission evidence
- [ ] Local `GET /health` reports `database: connected`
- [ ] Postman screenshots of all CRUD success responses locally
- [ ] Public Render URL and health check
- [ ] Postman screenshots of all CRUD responses against the deployed URL

The Postman collection includes request assertions, and the API implements CRUD operations. Save actual Postman screenshots after running the collection; do not describe requests as tested unless their responses have been observed.
