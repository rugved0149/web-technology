const mongoose = require("mongoose");
const Club = require("../models/Club");
const Event = require("../models/Event");
const User = require("../models/User");
const Membership = require("../models/Membership");
const Registration = require("../models/Registration");
const Feedback = require("../models/Feedback");
const Announcement = require("../models/Announcement");
const { findManagedClub } = require("../utils/clubAccess");

const DELETION_GRACE_DAYS = 7;
const validUrlOrEmpty = (value) => !value || (typeof value === "string" && value.length <= 1000 && /^https?:\/\//i.test(value));

const normalizeKeyMembers = (members) => {
  if (members === undefined) return undefined;
  if (!Array.isArray(members) || members.length > 30) throw new Error("Add no more than 30 key members");
  return members.map((member) => {
    const name = String(member?.name || "").trim();
    const role = String(member?.role || "").trim();
    const email = String(member?.email || "").trim().toLowerCase();
    const department = String(member?.department || "").trim();
    if (!name || !role || name.length > 100 || role.length > 80 || email.length > 254 || department.length > 100) {
      throw new Error("Each key member needs a name and role; member fields must be within their length limits");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`Invalid key-member email: ${email}`);
    return { name, role, email, department };
  });
};

const getClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ status: "active" })
      .populate("facultyCoordinator", "name email")
      .populate("studentCoordinator", "name email")
      .sort({ department: 1, name: 1 });
    res.status(200).json({ success: true, count: clubs.length, clubs });
  } catch (error) {
    console.error("Get clubs error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch clubs" });
  }
};

const getClubById = async (req, res) => {
  try {
    const club = await Club.findOne({ _id: req.params.id, status: "active" })
      .populate("facultyCoordinator", "name email")
      .populate("studentCoordinator", "name email");
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    const events = await Event.find({ club: club._id, $and: [{ status: { $ne: "draft" } }, { $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }] }] })
      .select("title description date time venue capacity category status approvalStatus locationUrl organiserName organiserEmail organiserPhone")
      .sort({ date: 1 }).limit(50);
    res.status(200).json({ success: true, club, events });
  } catch (error) {
    console.error("Get club error:", error.message);
    res.status(500).json({ success: false, message: "Unable to fetch club" });
  }
};

const getMyClubs = async (req, res) => {
  try {
    let filter;
    if (req.user.role === "admin") filter = {};
    else if (req.user.role === "club_manager") filter = { owner: req.user.id };
    else if (req.user.role === "club_coordinator") filter = { studentCoordinator: req.user.id };
    else if (req.user.role === "faculty_coordinator") filter = { facultyCoordinator: req.user.id };
    else return res.status(403).json({ success: false, message: "This account cannot manage clubs" });
    const clubs = await Club.find(filter)
      .populate("owner", "name email department")
      .populate("facultyCoordinator", "name email")
      .populate("studentCoordinator", "name email")
      .sort({ updatedAt: -1 });
    res.json({ success: true, count: clubs.length, clubs });
  } catch (error) {
    console.error("Get managed clubs error:", error.message);
    res.status(500).json({ success: false, message: "Unable to load managed clubs" });
  }
};

const applyForClub = async (req, res) => {
  try {
    if (req.user.role !== "club_manager") return res.status(403).json({ success: false, message: "Register as a club representative to submit a club application" });
    const { name, description, category, department, contactEmail, contactPhone, website, instagram, logo, keyMembers } = req.body;
    if (![name, description, category].every((v) => typeof v === "string" && v.trim())) {
      return res.status(400).json({ success: false, message: "Club name, description and category are required" });
    }
    if (name.trim().length > 100 || description.trim().length > 3000 || category.trim().length > 80 || String(department || "").length > 100 || String(contactPhone || "").length > 40) {
      return res.status(400).json({ success: false, message: "One or more club fields exceed the allowed length" });
    }
    const normalizedEmail = String(contactEmail || req.user.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ success: false, message: "Enter a valid club contact email" });
    if (website && !validUrlOrEmpty(website)) return res.status(400).json({ success: false, message: "Website must start with http:// or https://" });
    if (logo && !validUrlOrEmpty(logo)) return res.status(400).json({ success: false, message: "Logo URL must start with http:// or https://" });
    let members;
    try { members = normalizeKeyMembers(keyMembers || []); }
    catch (error) { return res.status(400).json({ success: false, message: error.message }); }
    if (!members.length) return res.status(400).json({ success: false, message: "Add at least one key member to the club application" });

    const owned = await Club.findOne({ owner: req.user.id, status: { $in: ["pending_approval", "active", "deletion_pending"] } });
    if (owned) return res.status(409).json({ success: false, message: `You already have a club application or managed club: ${owned.name}` });

    const duplicate = await Club.findOne({ name: name.trim() });
    if (duplicate && duplicate.owner?.toString() !== String(req.user.id)) return res.status(409).json({ success: false, message: "A club with this name already exists" });
    const payload = {
      name: name.trim(), description: description.trim(), category: category.trim(),
      department: String(department || "").trim(), contactEmail: normalizedEmail,
      contactPhone: String(contactPhone || "").trim(), website: String(website || "").trim(),
      instagram: String(instagram || "").trim(), logo: String(logo || "").trim(),
      keyMembers: members || [], owner: req.user.id, status: "pending_approval", rejectionReason: "",
    };
    let club;
    if (duplicate && duplicate.owner?.toString() === String(req.user.id) && duplicate.status === "rejected") {
      Object.assign(duplicate, payload);
      club = await duplicate.save();
    } else {
      club = await Club.create(payload);
    }
    res.status(201).json({ success: true, message: "Club application submitted for administrator review", club });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "A club with this name already exists" });
    console.error("Club application error:", error);
    res.status(500).json({ success: false, message: "Unable to submit club application" });
  }
};

const getAdminApplications = async (req, res) => {
  try {
    const clubs = await Club.find({ status: { $in: ["pending_approval", "deletion_pending"] } })
      .populate("owner", "name email department year")
      .populate("facultyCoordinator", "name email")
      .populate("studentCoordinator", "name email")
      .sort({ createdAt: 1 });
    res.json({ success: true, count: clubs.length, clubs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to fetch club applications" });
  }
};

const getAdminClubDetails = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate("owner", "name email department year")
      .populate("facultyCoordinator", "name email")
      .populate("studentCoordinator", "name email");
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    const [events, memberships, registrationCounts] = await Promise.all([
      Event.find({ club: club._id }).populate("createdBy", "name email").sort({ date: -1 }),
      Membership.find({ club: club._id }).populate("student", "name email department year").sort({ createdAt: -1 }).limit(100),
      Event.aggregate([{ $match: { club: club._id } }, { $lookup: { from: "registrations", localField: "_id", foreignField: "event", as: "registrations" } }, { $project: { title: 1, registrations: { $size: { $filter: { input: "$registrations", as: "r", cond: { $eq: ["$$r.status", "registered"] } } } } } }]),
    ]);
    const registrationMap = new Map(registrationCounts.map((event) => [String(event._id), event.registrations]));
    res.json({ success: true, club, events: events.map((event) => ({ ...event.toObject(), registeredCount: registrationMap.get(String(event._id)) || 0 })), memberships });
  } catch (error) {
    console.error("Admin club details error:", error.message);
    res.status(500).json({ success: false, message: "Unable to load club details" });
  }
};

const createClub = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ success: false, message: "Only an administrator can create clubs" });
    const { name, description, category, department = "", logo = "", facultyCoordinator, studentCoordinator, contactEmail = "", contactPhone = "", website = "", instagram = "", keyMembers = [] } = req.body;
    if (![name, description, category].every((v) => typeof v === "string" && v.trim())) return res.status(400).json({ success: false, message: "Name, description and category are required" });
    if ((facultyCoordinator && !mongoose.isValidObjectId(facultyCoordinator)) || (studentCoordinator && !mongoose.isValidObjectId(studentCoordinator))) return res.status(400).json({ success: false, message: "Invalid coordinator ID" });
    if (facultyCoordinator && !(await User.exists({ _id: facultyCoordinator, role: "faculty_coordinator" }))) return res.status(400).json({ success: false, message: "Faculty coordinator account not found" });
    if (studentCoordinator && !(await User.exists({ _id: studentCoordinator, role: "club_coordinator" }))) return res.status(400).json({ success: false, message: "Club coordinator account not found" });
    let members;
    try { members = normalizeKeyMembers(keyMembers); } catch (error) { return res.status(400).json({ success: false, message: error.message }); }
    const club = await Club.create({ name: name.trim(), description: description.trim(), category: category.trim(), department: String(department).trim(), logo, contactEmail: String(contactEmail).trim().toLowerCase(), contactPhone, website, instagram, keyMembers: members, facultyCoordinator: facultyCoordinator || null, studentCoordinator: studentCoordinator || null, status: "active" });
    res.status(201).json({ success: true, message: "Club created successfully", club });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Club name already exists" });
    console.error("Create club error:", error.message);
    res.status(500).json({ success: false, message: "Unable to create club" });
  }
};

const updateClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    if (req.user.role !== "admin" && !(await findManagedClub(req.user, club._id))) return res.status(403).json({ success: false, message: "You can only update clubs you manage" });
    if (club.status === "deletion_pending") return res.status(409).json({ success: false, message: "This club is scheduled for deletion. Cancel deletion first." });

    const adminOnlyFields = ["facultyCoordinator", "studentCoordinator", "status", "owner"];
    if (req.user.role !== "admin" && adminOnlyFields.some((field) => req.body[field] !== undefined)) return res.status(403).json({ success: false, message: "Only administrators can change club status, owner or coordinator assignments" });
    const stringFields = ["name", "description", "category", "department", "contactEmail", "contactPhone", "website", "instagram", "logo"];
    const fieldLimits = { name: 100, description: 3000, category: 80, department: 100, contactEmail: 254, contactPhone: 40, website: 300, instagram: 200, logo: 500 };
    for (const field of stringFields) {
      if (req.body[field] !== undefined && typeof req.body[field] !== "string") return res.status(400).json({ success: false, message: `Invalid ${field}` });
      if (req.body[field] !== undefined && req.body[field].trim().length > fieldLimits[field]) return res.status(400).json({ success: false, message: `${field} is too long` });
    }
    if (req.body.contactEmail !== undefined && req.body.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.contactEmail.trim())) return res.status(400).json({ success: false, message: "Enter a valid contact email" });
    if (req.body.facultyCoordinator && !mongoose.isValidObjectId(req.body.facultyCoordinator)) return res.status(400).json({ success: false, message: "Invalid faculty coordinator ID" });
    if (req.body.studentCoordinator && !mongoose.isValidObjectId(req.body.studentCoordinator)) return res.status(400).json({ success: false, message: "Invalid student coordinator ID" });
    if (req.body.facultyCoordinator && !(await User.exists({ _id: req.body.facultyCoordinator, role: "faculty_coordinator", active: true, emailVerified: true }))) return res.status(400).json({ success: false, message: "Verified active faculty coordinator account not found" });
    if (req.body.studentCoordinator && !(await User.exists({ _id: req.body.studentCoordinator, role: "club_coordinator", active: true, emailVerified: true }))) return res.status(400).json({ success: false, message: "Verified active student coordinator account not found" });
    if (req.body.name !== undefined && (!req.body.name.trim() || req.body.name.trim().length > 100)) return res.status(400).json({ success: false, message: "Club name must be between 1 and 100 characters" });
    if (req.body.description !== undefined && (!req.body.description.trim() || req.body.description.trim().length > 3000)) return res.status(400).json({ success: false, message: "Club description must be between 1 and 3000 characters" });
    if (req.body.category !== undefined && (!req.body.category.trim() || req.body.category.trim().length > 80)) return res.status(400).json({ success: false, message: "Club category must be between 1 and 80 characters" });
    if (req.body.website !== undefined && !validUrlOrEmpty(req.body.website)) return res.status(400).json({ success: false, message: "Website must start with http:// or https://" });
    if (req.body.logo !== undefined && !validUrlOrEmpty(req.body.logo)) return res.status(400).json({ success: false, message: "Logo URL must start with http:// or https://" });
    if (req.body.keyMembers !== undefined) {
      try { club.keyMembers = normalizeKeyMembers(req.body.keyMembers); }
      catch (error) { return res.status(400).json({ success: false, message: error.message }); }
    }
    if (req.body.name !== undefined) club.name = req.body.name.trim();
    if (req.body.description !== undefined) club.description = req.body.description.trim();
    if (req.body.category !== undefined) club.category = req.body.category.trim();
    for (const field of ["department", "contactEmail", "contactPhone", "website", "instagram", "logo"]) {
      if (req.body[field] !== undefined) club[field] = field === "contactEmail" ? req.body[field].trim().toLowerCase() : req.body[field].trim();
    }
    if (req.body.facultyCoordinator !== undefined) club.facultyCoordinator = req.body.facultyCoordinator || null;
    if (req.body.studentCoordinator !== undefined) club.studentCoordinator = req.body.studentCoordinator || null;
    if (req.body.status !== undefined && req.user.role === "admin") {
      if (!["active", "inactive", "rejected"].includes(req.body.status)) return res.status(400).json({ success: false, message: "Invalid club status" });
      club.status = req.body.status;
    }
    await club.save();
    res.json({ success: true, message: "Club details updated", club });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Club name already exists" });
    console.error("Update club error:", error.message);
    res.status(500).json({ success: false, message: "Unable to update club" });
  }
};

const reviewClub = async (req, res) => {
  try {
    const { decision, note = "" } = req.body;
    if (!["approve", "reject"].includes(decision)) return res.status(400).json({ success: false, message: "Choose approve or reject" });
    if (String(note).length > 1000) return res.status(400).json({ success: false, message: "Review note is too long" });
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    if (club.status !== "pending_approval") return res.status(409).json({ success: false, message: "This club application is no longer pending" });
    club.status = decision === "approve" ? "active" : "rejected";
    club.rejectionReason = decision === "reject" ? String(note).trim() : "";
    await club.save();
    res.json({ success: true, message: decision === "approve" ? "Club approved and published" : "Club application rejected", club });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to review club application" });
  }
};

const requestClubDeletion = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    if (req.user.role !== "admin" && !(await findManagedClub(req.user, club._id))) return res.status(403).json({ success: false, message: "You can only request deletion for a club you manage" });
    if (club.status !== "active" && club.status !== "inactive") return res.status(409).json({ success: false, message: "Only an active or inactive club can be scheduled for deletion" });
    const reason = String(req.body.reason || "").trim();
    if (reason.length > 1000) return res.status(400).json({ success: false, message: "Deletion reason is too long" });
    const now = new Date();
    club.status = "deletion_pending";
    club.deletionReason = reason;
    club.deletionRequestedAt = now;
    club.deletionScheduledAt = new Date(now.getTime() + DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000);
    await club.save();
    res.json({ success: true, message: `Club hidden from public listings and scheduled for deletion in ${DELETION_GRACE_DAYS} days`, club });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to schedule club deletion" });
  }
};

const cancelClubDeletion = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ success: false, message: "Club not found" });
    if (req.user.role !== "admin" && !(await findManagedClub(req.user, club._id))) return res.status(403).json({ success: false, message: "You can only cancel deletion for a club you manage" });
    if (club.status !== "deletion_pending") return res.status(409).json({ success: false, message: "Club is not scheduled for deletion" });
    club.status = "active";
    club.deletionReason = "";
    club.deletionRequestedAt = null;
    club.deletionScheduledAt = null;
    await club.save();
    res.json({ success: true, message: "Club deletion cancelled; the club is active again", club });
  } catch (error) {
    res.status(500).json({ success: false, message: "Unable to cancel deletion" });
  }
};

const deleteClub = requestClubDeletion;

const purgeScheduledClubs = async () => {
  const dueClubs = await Club.find({ status: "deletion_pending", deletionScheduledAt: { $lte: new Date() } }).select("_id");
  for (const club of dueClubs) {
    const events = await Event.find({ club: club._id }).select("_id");
    const eventIds = events.map((event) => event._id);
    await Promise.all([
      Registration.deleteMany({ event: { $in: eventIds } }),
      Feedback.deleteMany({ event: { $in: eventIds } }),
      Event.deleteMany({ club: club._id }),
      Membership.deleteMany({ club: club._id }),
      Announcement.deleteMany({ club: club._id }),
    ]);
    await Club.deleteOne({ _id: club._id, status: "deletion_pending", deletionScheduledAt: { $lte: new Date() } });
    console.log(`Purged scheduled club ${club._id} and its related records`);
  }
  return dueClubs.length;
};

module.exports = { getClubs, getClubById, getMyClubs, applyForClub, getAdminApplications, getAdminClubDetails, createClub, updateClub, reviewClub, requestClubDeletion, cancelClubDeletion, deleteClub, purgeScheduledClubs };
