const mongoose = require("mongoose");
const crypto = require("crypto");
const Event = require("../models/Event");
const Club = require("../models/Club");
const Registration = require("../models/Registration");
const Feedback = require("../models/Feedback");
const { findManagedClub } = require("../utils/clubAccess");

const publicEventFilter = { $and: [
  { status: { $ne: "draft" } },
  { $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }] },
] };
const populateEvent = (query) => query.populate("club", "name category department contactEmail contactPhone website instagram status")
  .populate("createdBy", "name email department");

const getEvents = async (req, res) => {
  try {
    const activeClubs = await Club.find({ status: "active" }).select("_id");
    const events = await populateEvent(Event.find({ ...publicEventFilter, club: { $in: activeClubs.map((club) => club._id) } })).sort({ date: 1 });
    res.json({ success: true, count: events.length, events });
  } catch (error) {
    console.error("Get events error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch events" });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await populateEvent(Event.findOne({ _id: req.params.id, ...publicEventFilter }));
    if (!event || !event.club || event.club.status !== "active") return res.status(404).json({ success: false, message: "Event not found" });
    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch event" });
  }
};

const createEvent = async (req, res) => {
  try {
    const { club, title, description, date, time, venue, capacity, registrationDeadline, category, status,
      locationUrl = "", organiserName = "", organiserEmail = "", organiserPhone = "" } = req.body;
    if (![club, title, description, date, time, venue, capacity, registrationDeadline, category].every((value) => value !== undefined && String(value).trim() !== "")) {
      return res.status(400).json({ success: false, message: "All required event fields must be provided" });
    }
    if (!mongoose.isValidObjectId(club)) return res.status(400).json({ success: false, message: "Invalid club ID" });
    const numericCapacity = Number(capacity);
    if (!Number.isInteger(numericCapacity) || numericCapacity < 1 || numericCapacity > 100000) return res.status(400).json({ success: false, message: "Capacity must be an integer between 1 and 100000" });
    if (String(title).trim().length > 150 || String(description).trim().length > 3000 || String(venue).trim().length > 180 || String(category).trim().length > 80) {
      return res.status(400).json({ success: false, message: "One or more event fields exceed the allowed length" });
    }
    if (locationUrl && (String(locationUrl).trim().length > 1000 || !/^https?:\/\//i.test(String(locationUrl).trim()))) return res.status(400).json({ success: false, message: "Location URL must start with http:// or https://" });
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(time).trim())) return res.status(400).json({ success: false, message: "Time must use 24-hour HH:mm format" });
    if (String(organiserName || "").trim().length > 100 || String(organiserPhone || "").trim().length > 40) return res.status(400).json({ success: false, message: "Organiser details exceed the allowed length" });
    const normalizedOrganiserEmail = String(organiserEmail || req.user.email || "").trim().toLowerCase();
    if (normalizedOrganiserEmail.length > 254 || (normalizedOrganiserEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedOrganiserEmail))) return res.status(400).json({ success: false, message: "Enter a valid organiser email" });
    const eventDate = new Date(date);
    const deadline = new Date(registrationDeadline);
    if (Number.isNaN(eventDate.getTime()) || Number.isNaN(deadline.getTime())) return res.status(400).json({ success: false, message: "Invalid date or registration deadline" });
    if (deadline >= eventDate) return res.status(400).json({ success: false, message: "Registration deadline must be before the event date" });
    const clubExists = await Club.findById(club);
    if (!clubExists || clubExists.status !== "active") return res.status(404).json({ success: false, message: "An approved active club is required to create events" });
    if (req.user.role !== "admin" && !(await findManagedClub(req.user, clubExists._id))) return res.status(403).json({ success: false, message: "You can only create events for clubs you manage" });
    if (req.user.role !== "admin" && clubExists.status !== "active") return res.status(403).json({ success: false, message: "The club must be approved before submitting events" });
    const event = await Event.create({
      club, title: String(title).trim(), description: String(description).trim(), date: eventDate,
      time, venue: String(venue).trim(), capacity: numericCapacity, registrationDeadline: deadline,
      category: String(category).trim(), createdBy: req.user.id,
      status: ["draft", "published", "registration_open", "registration_closed", "completed"].includes(status) ? status : "registration_open",
      approvalStatus: req.user.role === "admin" ? "approved" : "pending",
      locationUrl: String(locationUrl || "").trim(), organiserName: String(organiserName || req.user.name || "").trim(),
      organiserEmail: normalizedOrganiserEmail, organiserPhone: String(organiserPhone || "").trim(),
      attendanceCode: crypto.randomBytes(24).toString("hex"),
    });
    const populatedEvent = await populateEvent(Event.findById(event._id));
    res.status(201).json({ success: true, message: req.user.role === "admin" ? "Event created successfully" : "Event submitted for administrator approval", event: populatedEvent });
  } catch (error) {
    console.error("Create event error:", error.message);
    res.status(500).json({ success: false, message: "Failed to create event" });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    if (req.user.role !== "admin") {
      const currentClub = await findManagedClub(req.user, event.club);
      if (!currentClub || currentClub.status !== "active") {
        return res.status(403).json({ success: false, message: "You can only update events for active clubs you manage" });
      }
    }

    if (req.body.club !== undefined) {
      if (!mongoose.isValidObjectId(req.body.club)) return res.status(400).json({ success: false, message: "Invalid club ID" });
      const targetClub = await Club.findById(req.body.club);
      if (!targetClub || targetClub.status !== "active") return res.status(400).json({ success: false, message: "Events can only belong to an active, approved club" });
      if (req.user.role !== "admin" && !(await findManagedClub(req.user, targetClub._id))) {
        return res.status(403).json({ success: false, message: "You can only move an event to a club you manage" });
      }
      event.club = targetClub._id;
    }

    const allowed = ["title", "description", "date", "time", "venue", "capacity", "registrationDeadline", "category", "status", "locationUrl", "organiserName", "organiserEmail", "organiserPhone"];
    const stringLimits = { title: 150, description: 3000, time: 50, venue: 180, category: 80, locationUrl: 1000, organiserName: 100, organiserEmail: 254, organiserPhone: 40 };
    const statuses = ["draft", "published", "registration_open", "registration_closed", "completed"];

    for (const key of allowed) {
      if (req.body[key] === undefined) continue;
      const value = req.body[key];
      if (Object.prototype.hasOwnProperty.call(stringLimits, key)) {
        if (typeof value !== "string") return res.status(400).json({ success: false, message: `Invalid ${key}` });
        if (value.trim().length > stringLimits[key]) return res.status(400).json({ success: false, message: `${key} is too long` });
      }
      if (key === "date" || key === "registrationDeadline") {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return res.status(400).json({ success: false, message: `Invalid ${key}` });
        event[key] = parsed;
      } else if (key === "capacity") {
        const number = Number(value);
        if (!Number.isInteger(number) || number < 1 || number > 100000) return res.status(400).json({ success: false, message: "Capacity must be an integer between 1 and 100000" });
        event.capacity = number;
      } else if (key === "locationUrl") {
        if (value && !/^https?:\/\//i.test(value.trim())) return res.status(400).json({ success: false, message: "Location URL must start with http:// or https://" });
        event.locationUrl = value.trim();
      } else if (key === "organiserEmail") {
        const email = value.trim().toLowerCase();
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ success: false, message: "Invalid organiser email" });
        event.organiserEmail = email;
      } else if (key === "status") {
        if (!statuses.includes(value)) return res.status(400).json({ success: false, message: "Invalid event status" });
        event.status = value;
      } else event[key] = value.trim();
    }

    for (const key of ["title", "description", "time", "venue", "category"]) {
      if (!String(event[key] || "").trim()) return res.status(400).json({ success: false, message: `${key} cannot be empty` });
    }
    if (event.registrationDeadline >= event.date) return res.status(400).json({ success: false, message: "Registration deadline must be before the event date" });
    if (req.body.capacity !== undefined) {
      const registeredCount = await Registration.countDocuments({ event: event._id, status: "registered" });
      if (event.capacity < registeredCount) return res.status(409).json({ success: false, message: `Capacity cannot be lower than the ${registeredCount} active registrations` });
    }
    if (req.user.role !== "admin") { event.approvalStatus = "pending"; event.approvalNote = ""; }
    await event.save();
    const updatedEvent = await populateEvent(Event.findById(event._id));
    res.json({ success: true, message: req.user.role === "admin" ? "Event updated" : "Event changes submitted for administrator approval", event: updatedEvent });
  } catch (error) {
    console.error("Update event error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update event" });
  }
};

const getMyEvents = async (req, res) => {
  try {
    let clubFilter;
    if (req.user.role === "admin") {
      const events = await populateEvent(Event.find({})).sort({ createdAt: -1 }).limit(200);
      return res.json({ success: true, count: events.length, events });
    }
    const criteria = req.user.role === "club_manager" ? { owner: req.user.id }
      : req.user.role === "club_coordinator" ? { studentCoordinator: req.user.id }
      : req.user.role === "faculty_coordinator" ? { facultyCoordinator: req.user.id }
      : null;
    if (!criteria) return res.status(403).json({ success: false, message: "This account cannot manage events" });
    const clubs = await Club.find(criteria).select("_id");
    const ids = clubs.map((club) => club._id);
    clubFilter = { club: { $in: ids } };
    const events = await populateEvent(Event.find(clubFilter)).sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, count: events.length, events });
  } catch (error) {
    console.error("Get managed events error:", error.message);
    res.status(500).json({ success: false, message: "Unable to load events for your clubs" });
  }
};

const getPendingEvents = async (req, res) => {
  try {
    const events = await populateEvent(Event.find({ approvalStatus: "pending" })).sort({ createdAt: 1 });
    res.json({ success: true, count: events.length, events });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to fetch pending events" }); }
};

const reviewEvent = async (req, res) => {
  try {
    const { decision, note = "" } = req.body;
    if (!["approve", "reject"].includes(decision)) return res.status(400).json({ success: false, message: "Choose approve or reject" });
    if (String(note).length > 1000) return res.status(400).json({ success: false, message: "Review note is too long" });
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (event.approvalStatus !== "pending") return res.status(409).json({ success: false, message: "This event is no longer awaiting review" });
    if (decision === "approve" && !(await Club.exists({ _id: event.club, status: "active" }))) return res.status(409).json({ success: false, message: "Approve the club first; events from inactive or deleting clubs cannot be published" });
    event.approvalStatus = decision === "approve" ? "approved" : "rejected";
    event.approvalNote = String(note).trim();
    if (decision === "approve" && event.status === "draft") event.status = "registration_open";
    await event.save();
    res.json({ success: true, message: decision === "approve" ? "Event approved and published" : "Event proposal rejected", event });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to review event" }); }
};

const getAttendanceLink = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select("+attendanceCode");
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (req.user.role !== "admin" && !(await findManagedClub(req.user, event.club))) return res.status(403).json({ success: false, message: "You can only manage attendance for your events" });
    if (!event.attendanceCode) { event.attendanceCode = crypto.randomBytes(24).toString("hex"); await event.save(); }
    const baseUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const attendanceUrl = `${baseUrl}/check-in?eventId=${event._id}&code=${encodeURIComponent(event.attendanceCode)}`;
    res.json({ success: true, attendanceUrl, event: { _id: event._id, title: event.title, date: event.date, time: event.time } });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to create the attendance link" }); }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    await Promise.all([
      Registration.deleteMany({ event: event._id }),
      Feedback.deleteMany({ event: event._id }),
      event.deleteOne(),
    ]);
    res.json({ success: true, message: "Event and related registrations/feedback deleted successfully" });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to delete event" }); }
};

module.exports = { getEvents, getEventById, getMyEvents, createEvent, updateEvent, deleteEvent, getPendingEvents, reviewEvent, getAttendanceLink };
