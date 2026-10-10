const User = require("../models/User");
const Club = require("../models/Club");
const Event = require("../models/Event");
const Membership = require("../models/Membership");
const Registration = require("../models/Registration");

const getOverview = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Only administrators can view system-wide metrics" });
  }

  try {
    const now = new Date();
    const [activeUsers, activeClubs, upcomingEvents, pendingMemberships, activeRegistrations, pendingClubApplications, pendingEventApprovals, scheduledDeletions] = await Promise.all([
      User.countDocuments({ active: true, emailVerified: true }),
      Club.countDocuments({ status: "active" }),
      Event.countDocuments({ status: { $in: ["published", "registration_open", "registration_closed"] }, date: { $gte: now }, $or: [{ approvalStatus: "approved" }, { approvalStatus: { $exists: false } }] }),
      Membership.countDocuments({ status: "pending" }),
      Registration.countDocuments({ status: "registered" }),
      Club.countDocuments({ status: "pending_approval" }),
      Event.countDocuments({ approvalStatus: "pending" }),
      Club.countDocuments({ status: "deletion_pending" }),
    ]);

    return res.status(200).json({
      success: true,
      overview: { activeUsers, activeClubs, upcomingEvents, pendingMemberships, activeRegistrations, pendingClubApplications, pendingEventApprovals, scheduledDeletions },
    });
  } catch (error) {
    console.error("Admin overview error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load the administrator overview" });
  }
};

module.exports = { getOverview };
