require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "100kb" }));

const recordSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"], trim: true, minlength: [2, "Name must contain at least 2 characters"], maxlength: [100, "Name cannot exceed 100 characters"] },
  email: { type: String, required: [true, "Email is required"], trim: true, lowercase: true, match: [/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, "Enter a valid email address"] },
  course: { type: String, required: [true, "Course is required"], trim: true, maxlength: [100, "Course cannot exceed 100 characters"] }
}, { timestamps: true, versionKey: false });

const Record = mongoose.model("Record", recordSchema);

app.get("/", (req, res) => {
  res.json({ message: "Web Technology Practical 6 — RESTful Records API", endpoints: { list: "GET /api/records", create: "POST /api/records", retrieve: "GET /api/records/:id", update: "PUT /api/records/:id", delete: "DELETE /api/records/:id", health: "GET /health" } });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.get("/api/records", async (req, res, next) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 });
    res.json({ count: records.length, data: records });
  } catch (error) { next(error); }
});

app.post("/api/records", async (req, res, next) => {
  try {
    const record = await Record.create(req.body);
    res.status(201).json({ message: "Record created successfully", data: record });
  } catch (error) { next(error); }
});

app.get("/api/records/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid record ID" });
    const record = await Record.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json({ data: record });
  } catch (error) { next(error); }
});

app.put("/api/records/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid record ID" });
    const allowedFields = ["name", "email", "course"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowedFields.includes(key)));
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Provide at least one valid field: name, email, course" });
    const record = await Record.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record updated successfully", data: record });
  } catch (error) { next(error); }
});

app.delete("/api/records/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid record ID" });
    const record = await Record.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json({ message: "Record deleted successfully", data: record });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

app.use((error, req, res, next) => {
  if (error instanceof mongoose.Error.ValidationError) return res.status(400).json({ error: "Validation failed", details: Object.values(error.errors).map(item => item.message) });
  if (error.code === 11000) return res.status(409).json({ error: "A record with this unique value already exists" });
  if (error instanceof SyntaxError && "body" in error) return res.status(400).json({ error: "Request body must be valid JSON" });
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) { console.error("MONGODB_URI is missing. Create a .env file using .env.example."); process.exit(1); }
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`REST API listening on port ${PORT}`));
  } catch (error) { console.error("Could not connect to MongoDB:", error.message); process.exit(1); }
}

start();
