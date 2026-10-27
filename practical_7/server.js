require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const Student = require("./models/Student");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

function isValidId(id) {
  return mongoose.isValidObjectId(id);
}

function validateStudentBody(body, partial = false) {
  const errors = [];
  const allowed = ["name", "email", "course", "year"];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return ["Request body must be a JSON object"];
  }

  const keys = Object.keys(body);
  if (keys.some(key => !allowed.includes(key))) {
    errors.push("Unsupported field(s): " + keys.filter(key => !allowed.includes(key)).join(", "));
  }

  if (!partial && keys.length === 0) errors.push("Request body cannot be empty");

  for (const field of ["name", "email", "course", "year"]) {
    if (!partial && (body[field] === undefined || body[field] === null || String(body[field]).trim() === "")) {
      errors.push(field + " is required");
    }
  }

  if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 100)) {
    errors.push("Name must be a string between 2 and 100 characters");
  }
  if (body.email !== undefined && (typeof body.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()))) {
    errors.push("Enter a valid email address");
  }
  if (body.course !== undefined && (typeof body.course !== "string" || body.course.trim().length < 2 || body.course.trim().length > 100)) {
    errors.push("Course must be a string between 2 and 100 characters");
  }
  if (body.year !== undefined && (!Number.isInteger(body.year) || body.year < 1 || body.year > 6)) {
    errors.push("Year must be a whole number between 1 and 6");
  }

  return errors;
}

function handleError(error, res) {
  if (error.code === 11000) {
    return res.status(409).json({ error: "A student with this email already exists" });
  }
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ error: "Validation failed", details: Object.values(error.errors || {}).map(item => item.message) });
  }
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}

app.get("/api/health", (req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    status: mongoose.connection.readyState === 1 ? "ok" : "unavailable",
    database: mongoose.connection.readyState === 1 ? "MongoDB connected" : "MongoDB disconnected"
  });
});

app.get("/api/students", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 }).lean();
    res.json({ count: students.length, data: students });
  } catch (error) {
    handleError(error, res);
  }
});

app.post("/api/students", async (req, res) => {
  const errors = validateStudentBody(req.body);
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });

  try {
    const student = await Student.create({
      name: req.body.name.trim(),
      email: req.body.email.trim().toLowerCase(),
      course: req.body.course.trim(),
      year: req.body.year
    });
    res.status(201).json({ message: "Student created successfully", data: student });
  } catch (error) {
    handleError(error, res);
  }
});

app.get("/api/students/:id", async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid student ID" });
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json({ data: student });
  } catch (error) {
    handleError(error, res);
  }
});

app.put("/api/students/:id", async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid student ID" });
  const errors = validateStudentBody(req.body, true);
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  if (Object.keys(req.body || {}).length === 0) {
    return res.status(400).json({ error: "Provide at least one field: name, email, course, year" });
  }

  const update = {};
  for (const field of ["name", "email", "course", "year"]) {
    if (req.body[field] !== undefined) {
      update[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
    }
  }
  if (update.email) update.email = update.email.toLowerCase();

  try {
    const student = await Student.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json({ message: "Student updated successfully", data: student });
  } catch (error) {
    handleError(error, res);
  }
});

app.delete("/api/students/:id", async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: "Invalid student ID" });
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json({ message: "Student deleted successfully", data: student });
  } catch (error) {
    handleError(error, res);
  }
});

app.get("/api", (req, res) => {
  res.json({
    name: "Web Technology Practical 7 - MongoDB Student Records",
    database: "MongoDB with Mongoose",
    endpoints: {
      health: "GET /api/health",
      list: "GET /api/students",
      create: "POST /api/students",
      retrieve: "GET /api/students/:id",
      update: "PUT /api/students/:id",
      delete: "DELETE /api/students/:id"
    }
  });
});

app.use("/api", (req, res) => res.status(404).json({ error: "API endpoint not found" }));

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "Request body must be valid JSON" });
  }
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Configure it in .env or your hosting environment.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    console.log("Connected to MongoDB database:", mongoose.connection.name);
    app.listen(PORT, () => console.log("Practical 7 server listening on port " + PORT));
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

async function shutdown() {
  await mongoose.disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = app;
