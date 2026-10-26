require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Configure it in .env or the hosting environment.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: false }
});

app.use(express.json({ limit: "100kb" }));

function validId(value) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function validateRecord(body, partial = false) {
  const errors = [];
  const fields = ["name", "email", "course"];
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["Request body must be a JSON object"];
  }

  if (!partial) {
    for (const field of fields) {
      if (body[field] === undefined || body[field] === null || String(body[field]).trim() === "") {
        errors.push(field + " is required");
      }
    }
  }

  if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 100)) {
    errors.push("Name must be a string between 2 and 100 characters");
  }
  if (body.email !== undefined && (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))) {
    errors.push("Enter a valid email address");
  }
  if (body.course !== undefined && (typeof body.course !== "string" || body.course.trim().length < 1 || body.course.trim().length > 100)) {
    errors.push("Course must be a string between 1 and 100 characters");
  }

  for (const field of Object.keys(body)) {
    if (!fields.includes(field)) errors.push("Unsupported field: " + field);
  }
  return errors;
}

app.get("/", (req, res) => {
  res.json({
    message: "Web Technology Practical 6 — RESTful Records API",
    endpoints: {
      list: "GET /api/records",
      create: "POST /api/records",
      retrieve: "GET /api/records/:id",
      update: "PUT /api/records/:id",
      delete: "DELETE /api/records/:id",
      health: "GET /health"
    }
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.get("/api/records", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT id, name, email, course, created_at, updated_at FROM records ORDER BY created_at DESC");
    res.json({ count: result.rowCount, data: result.rows });
  } catch (error) { next(error); }
});

app.post("/api/records", async (req, res, next) => {
  const errors = validateRecord(req.body);
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });

  try {
    const values = [req.body.name.trim(), req.body.email.trim().toLowerCase(), req.body.course.trim()];
    const result = await pool.query(
      "INSERT INTO records (name, email, course) VALUES ($1, $2, $3) RETURNING id, name, email, course, created_at, updated_at",
      values
    );
    res.status(201).json({ message: "Record created successfully", data: result.rows[0] });
  } catch (error) { next(error); }
});

app.get("/api/records/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid record ID" });

  try {
    const result = await pool.query(
      "SELECT id, name, email, course, created_at, updated_at FROM records WHERE id = $1",
      [Number(req.params.id)]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Record not found" });
    res.json({ data: result.rows[0] });
  } catch (error) { next(error); }
});

app.put("/api/records/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid record ID" });
  const errors = validateRecord(req.body, true);
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });

  const allowed = ["name", "email", "course"];
  const entries = Object.entries(req.body).filter(([key]) => allowed.includes(key));
  if (!entries.length) return res.status(400).json({ error: "Provide at least one field: name, email, course" });

  try {
    const values = [];
    const assignments = entries.map(([key, rawValue]) => {
      let value = rawValue.trim();
      if (key === "email") value = value.toLowerCase();
      values.push(value);
      return key + " = $" + values.length;
    });
    values.push(Number(req.params.id));
    const result = await pool.query(
      "UPDATE records SET " + assignments.join(", ") + ", updated_at = CURRENT_TIMESTAMP WHERE id = $" + values.length +
      " RETURNING id, name, email, course, created_at, updated_at",
      values
    );
    if (!result.rowCount) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record updated successfully", data: result.rows[0] });
  } catch (error) { next(error); }
});

app.delete("/api/records/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "Invalid record ID" });

  try {
    const result = await pool.query(
      "DELETE FROM records WHERE id = $1 RETURNING id, name, email, course, created_at, updated_at",
      [Number(req.params.id)]
    );
    if (!result.rowCount) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted successfully", data: result.rows[0] });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Request body must be valid JSON" });
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  try {
    await pool.query("CREATE TABLE IF NOT EXISTS records (id BIGSERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(254) NOT NULL, course VARCHAR(100) NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)");
    app.listen(PORT, () => console.log("REST API listening on port " + PORT));
  } catch (error) {
    console.error("Could not initialize PostgreSQL:", error.message);
    process.exit(1);
  }
}

start();

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
