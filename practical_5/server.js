const express = require("express");
const helmet = require("helmet");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomBytes } = require("node:crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PUBLIC_DIR = path.join(__dirname, "public");
const DATA_DIR = path.join(__dirname, "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const TICKETS_FILE = path.join(DATA_DIR, "tickets.json");
const UPLOAD_DIR = path.join(__dirname, "uploads");

const CATEGORIES = ["IT & Wi-Fi", "Lab Equipment", "Classroom", "Electrical", "Plumbing", "Cleaning", "Other"];
const PRIORITIES = ["Low", "Normal", "High", "Urgent"];
const STATUSES = ["Submitted", "Under Review", "In Progress", "Resolved", "Rejected"];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const MIME_EXTENSIONS = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };

if (IS_PRODUCTION) app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https://www.openstreetmap.org"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(express.json({ limit: "25kb" }));
app.use(express.urlencoded({ extended: false, limit: "25kb" }));
app.use(session({
  name: "fixdesk.sid",
  secret: process.env.SESSION_SECRET || "local-demo-session-secret-change-this-before-deploying-2026",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: IS_PRODUCTION, maxAge: 8 * 60 * 60 * 1000 }
}));
app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

let users = [];
let tickets = [];
let fileWriteQueue = Promise.resolve();

const upload = multer({
  storage: multer.diskStorage({
    destination: async (_req, _file, callback) => {
      try { await fs.mkdir(UPLOAD_DIR, { recursive: true }); callback(null, UPLOAD_DIR); }
      catch (error) { callback(error); }
    },
    filename: (_req, file, callback) => {
      const ext = MIME_EXTENSIONS[file.mimetype];
      if (!ext) return callback(new Error("Only JPG, PNG, or WEBP images are accepted."));
      callback(null, `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`);
    }
  }),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 12, parts: 14 },
  fileFilter: (_req, file, callback) => {
    if (!Object.hasOwn(MIME_EXTENSIONS, file.mimetype)) return callback(new Error("Only JPG, PNG, or WEBP images are accepted."));
    callback(null, true);
  }
});

function clean(value) { return typeof value === "string" ? value.trim() : ""; }
function newId(prefix) { return `${prefix}-${randomBytes(3).toString("hex").toUpperCase()}`; }
function publicUser(user) { return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }; }
function findTicket(id) { return tickets.find(ticket => ticket.id === id); }
function isAdmin(req) { return req.session.user?.role === "admin"; }
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ success: false, message: "Sign in to continue." });
  next();
}
function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(403).json({ success: false, message: "This action is only available to campus administrators." });
  next();
}
function canViewTicket(req, ticket) {
  return isAdmin(req) || ticket.reporterId === req.session.user?.id;
}
function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
async function safeUnlink(filePath) {
  if (!filePath) return;
  try { await fs.unlink(filePath); } catch (error) { if (error.code !== "ENOENT") console.error(error); }
}

function validateTicket(input) {
  const data = {
    subject: clean(input.subject),
    category: clean(input.category),
    location: clean(input.location),
    priority: clean(input.priority),
    description: clean(input.description),
    latitude: clean(input.latitude),
    longitude: clean(input.longitude)
  };
  const errors = {};
  if (data.subject.length < 6 || data.subject.length > 100) errors.subject = "Issue title must contain 6–100 characters.";
  if (!CATEGORIES.includes(data.category)) errors.category = "Choose a valid issue category.";
  if (data.location.length < 3 || data.location.length > 100) errors.location = "Enter a location between 3 and 100 characters.";
  if (!PRIORITIES.includes(data.priority)) errors.priority = "Choose a valid priority.";
  if (data.description.length < 20 || data.description.length > 1200) errors.description = "Describe the issue in 20–1,200 characters.";
  let coordinates = null;
  if (data.latitude || data.longitude) {
    const latitude = Number(data.latitude);
    const longitude = Number(data.longitude);
    if (!data.latitude || !data.longitude || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      errors.coordinates = "Location coordinates are invalid. Try using the location button again or remove them.";
    } else coordinates = { latitude, longitude };
  }
  return { data, errors, coordinates };
}

async function persistJson(filePath, value) {
  fileWriteQueue = fileWriteQueue.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const temp = `${filePath}.tmp`;
    await fs.writeFile(temp, JSON.stringify(value, null, 2), "utf8");
    await fs.rename(temp, filePath);
  });
  return fileWriteQueue;
}
async function persistUsers() { return persistJson(USERS_FILE, users); }
async function persistTickets() { return persistJson(TICKETS_FILE, tickets); }

app.get("/api/health", (_req, res) => res.json({ success: true, message: "Campus FixDesk is ready." }));

app.get("/api/auth/me", (req, res) => {
  res.json({ success: true, user: req.session.user || null });
});

app.post("/api/auth/register", asyncRoute(async (req, res) => {
  const name = clean(req.body?.name);
  const email = clean(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const errors = {};
  if (name.length < 2 || name.length > 70 || !/^[\p{L}][\p{L}\p{M} .'-]*$/u.test(name)) errors.name = "Enter your full name (2–70 characters).";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter a valid email address.";
  if (password.length < 8 || password.length > 72 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.password = "Use 8–72 characters with at least one uppercase letter, lowercase letter, and number.";
  }
  if (users.some(user => user.email === email)) errors.email = "An account already exists for this email. Sign in instead.";
  if (Object.keys(errors).length) return res.status(422).json({ success: false, message: "Please correct the highlighted fields.", errors });

  const user = {
    id: newId("STU"), name, email,
    passwordHash: await bcrypt.hash(password, 12), role: "student", createdAt: new Date().toISOString()
  };
  users.push(user);
  await persistUsers();
  req.session.user = publicUser(user);
  res.status(201).json({ success: true, message: "Student account created. Welcome to FixDesk!", user: req.session.user });
}));

app.post("/api/auth/login", asyncRoute(async (req, res) => {
  const email = clean(req.body?.email).toLowerCase();
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const role = clean(req.body?.role);
  if (!["student", "admin"].includes(role)) return res.status(422).json({ success: false, message: "Choose Student or Admin sign-in." });
  if (!email || !password) return res.status(422).json({ success: false, message: "Enter your email and password." });
  const user = users.find(item => item.email === email && item.role === role);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ success: false, message: "Email, password, or selected role is incorrect." });
  }
  req.session.regenerate(error => {
    if (error) return res.status(500).json({ success: false, message: "Unable to start a secure session. Please try again." });
    req.session.user = publicUser(user);
    req.session.save(saveError => {
      if (saveError) return res.status(500).json({ success: false, message: "Unable to save session. Please try again." });
      res.json({ success: true, message: `Welcome back, ${user.name}.`, user: req.session.user });
    });
  });
}));

app.post("/api/auth/logout", requireAuth, (req, res, next) => {
  req.session.destroy(error => {
    if (error) return next(error);
    res.clearCookie("fixdesk.sid", { httpOnly: true, sameSite: "lax", secure: IS_PRODUCTION });
    res.json({ success: true, message: "You have been signed out." });
  });
});

app.get("/api/tickets", requireAuth, (req, res) => {
  const q = clean(req.query.q).toLowerCase();
  const status = clean(req.query.status);
  const category = clean(req.query.category);
  const priority = clean(req.query.priority);
  if (q.length > 100) return res.status(400).json({ success: false, message: "Search text must be 100 characters or fewer." });
  if (status && status !== "All" && !STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Invalid status filter." });
  if (category && category !== "All" && !CATEGORIES.includes(category)) return res.status(400).json({ success: false, message: "Invalid category filter." });
  if (priority && priority !== "All" && !PRIORITIES.includes(priority)) return res.status(400).json({ success: false, message: "Invalid priority filter." });

  const result = tickets.filter(ticket => {
    if (!isAdmin(req) && ticket.reporterId !== req.session.user.id) return false;
    const searchable = [ticket.id, ticket.reporterName, ticket.reporterEmail, ticket.subject, ticket.location, ticket.category].join(" ").toLowerCase();
    return (!q || searchable.includes(q)) && (!status || status === "All" || ticket.status === status) &&
      (!category || category === "All" || ticket.category === category) && (!priority || priority === "All" || ticket.priority === priority);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ success: true, data: result, count: result.length });
});

app.get("/api/tickets/:id", requireAuth, (req, res) => {
  const id = clean(req.params.id);
  if (!/^CF-[A-Z0-9]{6}$/.test(id)) return res.status(400).json({ success: false, message: "Ticket reference format is invalid." });
  const ticket = findTicket(id);
  if (!ticket) return res.status(404).json({ success: false, message: "No complaint was found for that reference." });
  if (!canViewTicket(req, ticket)) return res.status(403).json({ success: false, message: "You can only view complaints submitted by your account." });
  res.json({ success: true, data: ticket });
});

app.get("/api/tickets/:id/photo", requireAuth, (req, res) => {
  const ticket = findTicket(clean(req.params.id));
  if (!ticket) return res.status(404).json({ success: false, message: "Complaint not found." });
  if (!canViewTicket(req, ticket)) return res.status(403).json({ success: false, message: "You cannot access another student's attachment." });
  if (!ticket.photoFile) return res.status(404).json({ success: false, message: "No photo is attached to this complaint." });
  return res.sendFile(path.join(UPLOAD_DIR, path.basename(ticket.photoFile)));
});

app.post("/api/tickets", requireAuth, (req, res, next) => {
  if (req.session.user.role !== "student") return res.status(403).json({ success: false, message: "Only student accounts can submit a new complaint." });
  upload.single("photo")(req, res, error => {
    if (error) return next(error);
    next();
  });
}, asyncRoute(async (req, res) => {
  const { data, errors, coordinates } = validateTicket(req.body || {});
  if (Object.keys(errors).length) {
    await safeUnlink(req.file?.path);
    return res.status(422).json({ success: false, message: "Please correct the highlighted fields.", errors });
  }

  const currentUser = req.session.user;
  const duplicate = tickets.some(ticket => ticket.reporterId === currentUser.id && ticket.status !== "Resolved" && ticket.status !== "Rejected" &&
    ticket.subject.toLowerCase() === data.subject.toLowerCase() && ticket.location.toLowerCase() === data.location.toLowerCase() &&
    Date.now() - Date.parse(ticket.createdAt) < 10 * 60 * 1000);
  if (duplicate) {
    await safeUnlink(req.file?.path);
    return res.status(409).json({ success: false, message: "A similar active complaint was submitted from this account and location in the last 10 minutes. Track the existing ticket instead." });
  }

  const now = new Date().toISOString();
  const ticketId = newId("CF");
  const ticket = {
    id: ticketId, reporterId: currentUser.id, reporterName: currentUser.name, reporterEmail: currentUser.email,
    subject: data.subject, category: data.category, location: data.location, priority: data.priority,
    description: data.description, coordinates,
    photoFile: req.file ? req.file.filename : null,
    photoUrl: req.file ? `/api/tickets/${ticketId}/photo` : null,
    status: "Submitted", createdAt: now, updatedAt: now,
    history: [{ status: "Submitted", at: now, by: currentUser.name, role: "Student", note: "Complaint registered" }],
    comments: []
  };
  tickets.push(ticket);
  await persistTickets();
  res.status(201).json({ success: true, message: `Complaint registered. Track it using reference ${ticket.id}.`, data: ticket });
}));

app.post("/api/tickets/:id/comments", requireAuth, asyncRoute(async (req, res) => {
  const ticket = findTicket(clean(req.params.id));
  if (!ticket) return res.status(404).json({ success: false, message: "Complaint not found." });
  if (!canViewTicket(req, ticket)) return res.status(403).json({ success: false, message: "You can only comment on your own complaints." });
  const message = clean(req.body?.message);
  if (message.length < 2 || message.length > 600) {
    return res.status(422).json({ success: false, message: "Message must contain 2–600 characters.", errors: { message: "Enter a message between 2 and 600 characters." } });
  }
  const now = new Date().toISOString();
  ticket.comments.push({ id: newId("MSG"), authorId: req.session.user.id, authorName: req.session.user.name, role: req.session.user.role, message, at: now });
  ticket.updatedAt = now;
  await persistTickets();
  res.status(201).json({ success: true, message: "Message added to the complaint thread.", data: ticket });
}));

app.patch("/api/tickets/:id", requireAuth, requireAdmin, asyncRoute(async (req, res) => {
  const ticket = findTicket(clean(req.params.id));
  if (!ticket) return res.status(404).json({ success: false, message: "Complaint not found." });
  const status = clean(req.body?.status);
  const priority = clean(req.body?.priority);
  const note = clean(req.body?.note);
  const errors = {};
  if (!STATUSES.includes(status)) errors.status = "Choose a valid status.";
  if (!PRIORITIES.includes(priority)) errors.priority = "Choose a valid priority.";
  if (note.length > 600) errors.note = "Staff response must be 600 characters or fewer.";
  if (Object.keys(errors).length) return res.status(422).json({ success: false, message: "Review the update fields.", errors });

  const now = new Date().toISOString();
  const statusChanged = ticket.status !== status;
  const priorityChanged = ticket.priority !== priority;
  ticket.status = status;
  ticket.priority = priority;
  ticket.updatedAt = now;
  if (statusChanged || priorityChanged) {
    const noteText = [statusChanged ? `Status changed to ${status}` : "", priorityChanged ? `Priority changed to ${priority}` : ""].filter(Boolean).join(" · ");
    ticket.history.push({ status, at: now, by: req.session.user.name, role: "Admin", note: noteText });
  }
  if (note) ticket.comments.push({ id: newId("MSG"), authorId: req.session.user.id, authorName: req.session.user.name, role: "admin", message: note, at: now });
  await persistTickets();
  res.json({ success: true, message: `Complaint ${ticket.id} updated successfully.`, data: ticket });
}));

app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "API route not found." }));
app.get("*", (_req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));

app.use(async (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "Photo must be 3 MB or smaller." : "Only one photo up to 3 MB can be attached.";
    return res.status(422).json({ success: false, message, errors: { photo: message } });
  }
  if (error.message?.includes("Only JPG, PNG, or WEBP")) return res.status(422).json({ success: false, message: error.message, errors: { photo: error.message } });
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) return res.status(400).json({ success: false, message: "Request body contains invalid JSON." });
  if (error.type === "entity.too.large") return res.status(413).json({ success: false, message: "Request is too large." });
  console.error(error);
  res.status(500).json({ success: false, message: "An unexpected server error occurred. Please try again." });
});

async function readArray(filePath) {
  try {
    const value = JSON.parse(await fs.readFile(filePath, "utf8"));
    return Array.isArray(value) ? value : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}
async function start() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  users = await readArray(USERS_FILE);
  tickets = await readArray(TICKETS_FILE);

  let adminEmail = clean(process.env.ADMIN_EMAIL).toLowerCase();
  let adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!IS_PRODUCTION) {
    adminEmail ||= "admin@campus.edu";
    adminPassword ||= "FixDeskAdmin2026!";
  } else if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    console.error("Production deployment requires SESSION_SECRET with at least 32 characters. Set it in the hosting provider's environment settings.");
    process.exit(1);
  } else if (!adminEmail || adminPassword.length < 12) {
    console.error("Production deployment requires ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters). Set them in the hosting provider's environment settings.");
    process.exit(1);
  }
  if (!users.some(user => user.email === adminEmail && user.role === "admin")) {
    users.push({ id: "ADMIN-ROOT", name: "Campus Administrator", email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), role: "admin", createdAt: new Date().toISOString() });
    await persistUsers();
  }

  if (!IS_PRODUCTION && users.length === 1 && tickets.length === 0) {
    const student = { id: "STU-DEMO01", name: "Ananya Deshmukh", email: "student@campus.edu", passwordHash: await bcrypt.hash("Student123!", 12), role: "student", createdAt: new Date().toISOString() };
    users.push(student);
    const now = Date.now();
    tickets = [
      { id: "CF-7K4Q2M", reporterId: student.id, reporterName: student.name, reporterEmail: student.email, subject: "Wi-Fi disconnects during practicals", category: "IT & Wi-Fi", location: "B Block · Computer Lab 2", priority: "Urgent", description: "The lab network disconnects every few minutes and interrupts tools used during practical sessions.", coordinates: null, photoUrl: null, status: "In Progress", createdAt: new Date(now - 3600000).toISOString(), updatedAt: new Date(now - 1800000).toISOString(), history: [{ status: "Submitted", at: new Date(now - 3600000).toISOString(), by: student.name, role: "Student", note: "Complaint registered" }, { status: "In Progress", at: new Date(now - 1800000).toISOString(), by: "Campus Administrator", role: "Admin", note: "Status changed to In Progress" }], comments: [{ id: "MSG-DEMO1", authorId: "ADMIN-ROOT", authorName: "Campus Administrator", role: "admin", message: "The network team has been notified and is checking the access point.", at: new Date(now - 1700000).toISOString() }] },
      { id: "CF-9P2L5R", reporterId: student.id, reporterName: student.name, reporterEmail: student.email, subject: "Projector image appears dim", category: "Classroom", location: "A Wing · Room 204", priority: "Normal", description: "The projector image is dim and difficult to read from the back rows.", coordinates: null, photoUrl: null, status: "Resolved", createdAt: new Date(now - 86400000 * 2).toISOString(), updatedAt: new Date(now - 86400000).toISOString(), history: [{ status: "Submitted", at: new Date(now - 86400000 * 2).toISOString(), by: student.name, role: "Student", note: "Complaint registered" }, { status: "Resolved", at: new Date(now - 86400000).toISOString(), by: "Campus Administrator", role: "Admin", note: "Status changed to Resolved" }], comments: [] }
    ];
    await persistUsers();
    await persistTickets();
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Campus FixDesk is running on port ${PORT}`));
}
start().catch(error => { console.error("Unable to start Campus FixDesk:", error); process.exit(1); });
