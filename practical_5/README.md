# Campus FixDesk — Practical 5 (Role-Based Edition)

Campus FixDesk is a campus complaint-management portal that demonstrates ExpressJS routing, request/response handling, and **server-side** validation. It has two roles: **Student** and **Admin**.

## Roles and features

### Student
- Register a student account and sign in.
- Submit complaints with category, priority, campus location and detailed description.
- Optionally attach one JPG, PNG or WEBP photo up to 3 MB.
- Optionally share browser geolocation after explicitly pressing **Use my location**; coordinates can be opened on OpenStreetMap.
- Track each registered complaint by its reference, status timeline, and staff/student conversation.
- Search and filter their own complaints. The server never returns other students' records to a student session.

### Admin
- Sign in to an admin-only workspace and review all submitted complaints.
- Change status (Submitted, Under Review, In Progress, Resolved, Rejected) and priority.
- Send student-facing updates in the complaint thread.
- View attached images and optional map coordinates.

## ExpressJS and validation demonstrations
- Server-side field validation returns HTTP 422 with field-level errors.
- Routes include `/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/tickets`, `/api/tickets/:id`, `/api/tickets/:id/comments`, and admin-only `PATCH /api/tickets/:id`.
- Duplicate active complaints from the same student/location/title are rejected within 10 minutes.
- Upload type and 3 MB file-size checks are enforced by the server.
- Session cookies are HTTP-only and SameSite Lax. Helmet, request-size limits, safe random upload filenames and JSON error responses are configured.

## Run locally
Requires Node.js 20 or later.

```bash
npm install
npm start
```

Open http://localhost:3000.

### Local demo credentials
- **Admin:** `admin@campus.edu` / `FixDeskAdmin2026!`
- **Student:** `student@campus.edu` / `Student123!`

The demo student account and sample complaints are seeded only in non-production mode. You can also register another student account.

## Deployment (Render Web Service)
Connect the GitHub repository `rugved0149/web-technology` and configure:

- Root Directory: `practical_5`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`
- Environment: `NODE_ENV=production`, `ADMIN_EMAIL=<your admin email>`, `ADMIN_PASSWORD=<unique password at least 12 characters>`, `SESSION_SECRET=<long random secret>`.

Do not use the local demo admin password in production. Production startup intentionally requires the admin environment variables.

## Storage and deployment limitations
For the assignment, user and complaint records are stored in ignored local JSON files and images in the local `uploads/` directory. The repository `.gitignore` excludes account data, complaint data, and uploaded files so they are not accidentally committed. Render's default filesystem is ephemeral, and Express's default in-memory session store is not suitable for a scaled production service. This means records, uploaded photos, and sessions can be lost on redeploy/restart. A real deployment should use a database, persistent/object storage for photos, and a durable session store.

## Test ideas
1. Register a student; try a short password and a duplicate email.
2. Submit a complaint with a short title/description, invalid category, or unsupported photo type.
3. Submit a valid complaint; save the generated `CF-XXXXXX` reference and inspect its status timeline.
4. Try a repeated complaint with the same location/title; the server should reject it.
5. Sign in as admin, update status/priority, and post a staff reply.
6. Sign back in as the student and verify the status history and staff reply appear.
7. Call `/api/health` to verify server health.

This is an academic demonstration, not a production complaint system. Admin routes are role-protected; production should also consider rate limiting, CSRF mitigation appropriate to the auth model, malware/content inspection of uploads, audit logging, database-backed transactions, and retention/access policies.
