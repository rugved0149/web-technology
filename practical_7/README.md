# Practical 7 — NoSQL Database (MongoDB)

**Aim:** Design, develop and deploy a web application using Node.js, Express.js and MongoDB, supporting validated Create, Read, Update and Delete (CRUD) operations.

## Application

Student Records is a small responsive browser application with a REST API. It uses MongoDB Atlas for persistent storage and Mongoose for schema validation and database operations.

## Technology stack

- Node.js and Express.js
- MongoDB Atlas (database: `webtech_practical7`, collection: `students`)
- Mongoose ODM
- Browser interface: HTML, CSS and JavaScript
- Postman for API testing
- Render for hosting

## 1. Create the MongoDB database

1. Sign in at https://cloud.mongodb.com and create a free M0 cluster if you do not already have one.
2. Create a database user under **Database Access** and save the password securely.
3. In **Network Access**, add your current IP address for local development. For a deployed Render service, add the applicable Render egress IPs or the broader `0.0.0.0/0` rule only if necessary. This broader rule exposes the database network interface to all IPs, so use a strong unique password and database user with access only to this app's database.
4. Select **Connect → Drivers**, choose Node.js, and copy the connection string.
5. Replace the username, password, and cluster hostname in the URI. The database name should be `webtech_practical7`, for example:
   `mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/webtech_practical7?retryWrites=true&w=majority`
6. The `students` collection is created automatically when the first student is inserted. Mongoose creates the schema-backed collection on first write.

Never commit your real MongoDB URI or credentials into GitHub.

## 2. Run locally

From the repository root:

```bash
cd practical_7
npm install
```

Copy `.env.example` to `.env` and add your own real URI:

```env
PORT=3000
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@YOUR-CLUSTER.mongodb.net/webtech_practical7?retryWrites=true&w=majority
```

Then run:

```bash
npm start
```

Open http://localhost:3000. API details are at http://localhost:3000/api and health is at http://localhost:3000/api/health.

## 3. REST API endpoints

All request/response bodies are JSON.

| Method | Endpoint | Purpose | Success |
|---|---|---|---|
| GET | `/api/health` | Check MongoDB connection | `200 OK` |
| GET | `/api/students` | List all students | `200 OK` |
| POST | `/api/students` | Create student | `201 Created` |
| GET | `/api/students/:id` | Retrieve one student | `200 OK` |
| PUT | `/api/students/:id` | Update supplied fields | `200 OK` |
| DELETE | `/api/students/:id` | Delete student | `200 OK` |

### Sample POST body

```json
{
  "name": "Rugved Suryawanshi",
  "email": "rugved@example.com",
  "course": "Software Engineering",
  "year": 2
}
```

Use the returned `data._id` in place of `:id` for GET, PUT and DELETE. PUT accepts one or more of `name`, `email`, `course` and `year`. The email field must be unique.

## 4. Validation and error handling

- Name and course length validation; email format validation.
- Year must be an integer from 1 through 6.
- Required fields are checked before creating a record.
- MongoDB duplicate email is returned as `409 Conflict`.
- Malformed IDs return `400 Bad Request`; nonexistent records return `404 Not Found`.
- Invalid JSON and schema validation errors receive readable error responses.
- Database connection state is exposed through `/api/health`.

## 5. Test with Postman

Import `postman/Practical-7-MongoDB.postman_collection.json`. Set the collection variable `baseUrl` to `http://localhost:3000` for local testing or to your hosted URL. Run requests in order: health, create, list, get one, update, delete, get one again. The Create request saves the returned MongoDB `_id` into the collection variable `studentId` automatically.

## 6. Deploy to Render

1. Push this repository to GitHub.
2. In Render, select **New → Web Service**, connect `rugved0149/web-technology`, and choose branch `main`.
3. Set **Root Directory** to `practical_7`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Set environment variable `MONGODB_URI` to your MongoDB Atlas connection string. Do not set it to the example placeholder.
7. Deploy and open the generated Render URL. Verify `/api/health` returns HTTP 200 and the browser UI can create a student.

The application intentionally refuses to start if `MONGODB_URI` is missing. This avoids silently falling back to a temporary local database.

## 7. Browser and Postman checklist

- [ ] Health endpoint responds with MongoDB connected.
- [ ] Student can be created using the browser form.
- [ ] Student list shows persisted records after refresh.
- [ ] Student can be retrieved by ID.
- [ ] Existing student can be updated.
- [ ] Student can be deleted and subsequent GET returns 404.
- [ ] Invalid email, missing fields, invalid year and duplicate email are rejected.
- [ ] API has been tested locally and on the deployed URL.

## Result

A MongoDB-backed student management web application was designed using Node.js, Express and Mongoose. It supports CRUD operations, validation, error handling, browser-based interaction and Postman testing. Complete the deployment and testing checklist with the actual MongoDB Atlas connection and record screenshots before submission.
