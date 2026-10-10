const mongoose = require("mongoose");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const Club = require("../models/Club");
const { findManagedClub } = require("../utils/clubAccess");
const { getEventDateTime } = require("../utils/eventTime");

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) return res.status(400).json({ success: false, message: "Event ID is required" });
    if (!mongoose.isValidObjectId(eventId)) return res.status(400).json({ success: false, message: "Invalid event ID" });
    const event = await Event.findById(eventId);
    if (!event || (event.approvalStatus && event.approvalStatus !== "approved") || !(await Club.exists({ _id: event.club, status: "active" }))) return res.status(404).json({ success: false, message: "Approved event not found" });
    if (event.status !== "registration_open") return res.status(400).json({ success: false, message: "Registration is not open for this event" });
    const now = new Date();
    if (now > event.registrationDeadline) return res.status(400).json({ success: false, message: "Registration deadline has passed" });
    if (now >= getEventDateTime(event)) return res.status(400).json({ success: false, message: "Event registration is no longer available" });

    const existing = await Registration.findOne({ event: eventId, student: req.user.id });
    if (existing && ["registered", "waitlisted"].includes(existing.status)) {
      return res.status(409).json({ success: false, message: existing.status === "waitlisted" ? "You are already on the event waitlist" : "Already registered for this event", registration: existing });
    }
    const registeredCount = await Registration.countDocuments({ event: eventId, status: "registered" });
    const status = registeredCount >= event.capacity ? "waitlisted" : "registered";
    let registration;
    if (existing) {
      existing.status = status;
      existing.registeredAt = new Date();
      existing.checkedInAt = null;
      registration = await existing.save();
    } else {
      registration = await Registration.create({ event: eventId, student: req.user.id, status });
    }
    const populated = await Registration.findById(registration._id).populate("event", "title date time venue capacity status").populate("student", "name email");
    return res.status(201).json({ success: true, message: status === "waitlisted" ? "Event is full. You have been added to the waitlist and will be promoted if a place opens." : "Event registration successful", registration: populated });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "You already have a registration for this event" });
    console.error("Event registration error:", error.message);
    res.status(500).json({ success: false, message: "Failed to register for event" });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ student: req.user.id })
      .populate("event", "title date time venue capacity status category approvalStatus locationUrl")
      .sort({ registeredAt: -1 });
    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to fetch registrations" }); }
};

const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (req.user.role !== "admin" && !(await findManagedClub(req.user, event.club))) return res.status(403).json({ success: false, message: "You can only view registrations for clubs you manage" });
    const registrations = await Registration.find({ event: req.params.eventId, status: { $in: ["registered", "waitlisted"] } })
      .populate("student", "name email department year")
      .populate("event", "title date time venue capacity")
      .sort({ status: 1, registeredAt: 1 });
    res.json({ success: true, count: registrations.length, registeredCount: registrations.filter((r) => r.status === "registered").length, waitlistedCount: registrations.filter((r) => r.status === "waitlisted").length, registrations });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to fetch event registrations" }); }
};

const promoteWaitlisted = async (eventId) => {
  const next = await Registration.findOne({ event: eventId, status: "waitlisted" }).sort({ registeredAt: 1 });
  if (next) { next.status = "registered"; next.registeredAt = new Date(); await next.save(); }
  return next;
};

const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({ _id: req.params.id, student: req.user.id });
    if (!registration) return res.status(404).json({ success: false, message: "Registration not found" });
    if (registration.status === "cancelled") return res.status(400).json({ success: false, message: "Registration is already cancelled" });
    const wasRegistered = registration.status === "registered";
    const event = await Event.findById(registration.event);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });
    if (new Date() >= getEventDateTime(event)) return res.status(400).json({ success: false, message: "Registration cannot be cancelled after the event starts" });
    registration.status = "cancelled";
    await registration.save();
    const promoted = wasRegistered ? await promoteWaitlisted(event._id) : null;
    res.json({ success: true, message: promoted ? "Registration cancelled; the next person on the waitlist has been promoted" : "Event registration cancelled", registration });
  } catch (error) { res.status(500).json({ success: false, message: "Failed to cancel registration" }); }
};

const checkInWithCode = async (req, res) => {
  try {
    const { eventId, code } = req.body;
    if (!mongoose.isValidObjectId(eventId) || typeof code !== "string" || code.length < 32) return res.status(400).json({ success: false, message: "Invalid check-in link" });
    const event = await Event.findById(eventId).select("+attendanceCode");
    if (!event || !event.attendanceCode || event.attendanceCode !== code || (event.approvalStatus && event.approvalStatus !== "approved") || !(await Club.exists({ _id: event.club, status: "active" }))) return res.status(400).json({ success: false, message: "This attendance link is invalid or expired" });
    const start = getEventDateTime(event);
    const now = new Date();
    if (now < new Date(start.getTime() - 60 * 60 * 1000) || now > new Date(start.getTime() + 4 * 60 * 60 * 1000)) return res.status(400).json({ success: false, message: "Check-in opens one hour before the event and closes four hours after it starts" });
    const registration = await Registration.findOne({ event: eventId, student: req.user.id, status: "registered" });
    if (!registration) return res.status(403).json({ success: false, message: "You need an active event registration to check in" });
    if (registration.checkedInAt) return res.status(409).json({ success: false, message: `You were already checked in at ${registration.checkedInAt.toLocaleTimeString()}` });
    registration.checkedInAt = now;
    await registration.save();
    res.json({ success: true, message: `Checked in successfully for ${event.title}`, checkedInAt: registration.checkedInAt });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to complete check-in" }); }
};

const updateAttendance = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id).populate("event", "club title date time");
    if (!registration) return res.status(404).json({ success: false, message: "Registration not found" });
    if (req.user.role !== "admin" && !(await findManagedClub(req.user, registration.event.club))) return res.status(403).json({ success: false, message: "You can only manage attendance for your clubs" });
    if (registration.status !== "registered") return res.status(400).json({ success: false, message: "Only registered attendees can be marked present" });
    registration.checkedInAt = req.body.present === false ? null : (registration.checkedInAt || new Date());
    await registration.save();
    res.json({ success: true, message: registration.checkedInAt ? "Attendance marked present" : "Attendance cleared", registration });
  } catch (error) { res.status(500).json({ success: false, message: "Unable to update attendance" }); }
};

module.exports = { registerForEvent, getMyRegistrations, getEventRegistrations, cancelRegistration, checkInWithCode, updateAttendance };
