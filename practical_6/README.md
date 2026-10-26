# Practical 6: RESTful API with CRUD Operations

## Objective
Build and deploy a RESTful API using Node.js, Express.js and MongoDB. Verify the endpoints with Postman locally and after deployment.

## Technology
- Node.js and Express.js for HTTP routes
- MongoDB Atlas for persistent database storage
- Mongoose for schema validation and database operations
- Postman for API testing
- Render for hosting

## Record structure
Each record contains `name` (required, minimum 2 characters), `email` (valid email, required) and `course` (required). MongoDB assigns `_id`; timestamps are stored automatically.

## Run locally
1. Install Node.js 20 or later and create a MongoDB Atlas cluster.
2. In Atlas, create a database user and allow your current IP under Network Access. Copy your cluster connection string.
3. Open a terminal in `practical_6` and run:

```bash
npm install
```

4. Copy `.env.example` to `.env`, replace the `MONGODB_URI` placeholder with the real Atlas URI, and do not commit `.env`.
5. Start the API with `npm start`. Visit `http://localhost:3000/` or `http://localhost:3000/health`.

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

## Deploy to Render
1. Push this folder to GitHub.
2. In Render, create a **Web Service** and connect `rugved0149/web-technology`.
3. Set **Root Directory** to `practical_6`, **Build Command** to `npm install`, and **Start Command** to `npm start`.
4. Add `MONGODB_URI` in Render's environment variables using the production MongoDB Atlas connection string. Never commit database credentials.
5. Ensure Atlas Network Access permits the service to connect. Allowing `0.0.0.0/0` permits access from any IP and is less secure; use a restrictive network policy where supported.
6. Deploy. Render will provide a public URL similar to `https://your-service-name.onrender.com` (example only; not an existing deployment URL).
7. Change the Postman `baseUrl` variable to your real Render URL and repeat every CRUD test against the public URL.

## Response codes
- `200`: read/update/delete succeeded
- `201`: record created
- `400`: invalid ID, invalid JSON or field validation failure
- `404`: record or route not found
- `500`: unexpected server error

## Submission evidence
- [ ] `GET /health` reports database connected
- [ ] Postman screenshots of all CRUD success responses locally
- [ ] Public Render URL and health check
- [ ] Postman screenshots of all CRUD responses against the deployed URL

The code and Postman collection are committed here; a live public deployment and live endpoint tests still require your Render and MongoDB Atlas setup. Do not claim deployment is complete until those tests succeed.
