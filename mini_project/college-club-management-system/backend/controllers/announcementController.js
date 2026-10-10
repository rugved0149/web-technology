const mongoose = require("mongoose");
const Announcement = require("../models/Announcement");
const Club = require("../models/Club");
const { findManagedClub } = require("../utils/clubAccess");

const getAnnouncements = async (req, res) => {
  try {
    const activeClubs = await Club.find({ status: "active" }).select("_id");
    const announcements = await Announcement.find({
      status: "published",
      $or: [{ club: null }, { club: { $in: activeClubs.map((club) => club._id) } }, { club: { $exists: false } }],
    })
      .populate("club", "name category status")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      announcements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
    });
  }
};

const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findOne({ _id: req.params.id, status: "published" })
      .populate("club", "name category status")
      .populate("createdBy", "name email");

    if (!announcement || (announcement.club && announcement.club.status !== "active")) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcement",
    });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      club,
      priority,
      status,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    if (!club && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Coordinators must publish announcements for an assigned club" });
    }
    if (club) {
      if (!mongoose.isValidObjectId(club)) {
        return res.status(400).json({ success: false, message: "Invalid club ID" });
      }
      const clubExists = await Club.findById(club);

      if (!clubExists || clubExists.status !== "active") {
        return res.status(404).json({ success: false, message: "An active, approved club is required for announcements" });
      }
      if (req.user.role !== "admin" && !(await findManagedClub(req.user, clubExists._id))) {
        return res.status(403).json({ success: false, message: "You can only publish announcements for your assigned clubs" });
      }
    }

    const announcement = await Announcement.create({
      title,
      content,
      club: club || null,
      createdBy: req.user.id,
      priority: priority || "normal",
      status: status || "published",
    });

    const populatedAnnouncement = await Announcement.findById(
      announcement._id
    )
      .populate("club", "name category")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement: populatedAnnouncement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
    });
  }
};

const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }
    if (req.user.role !== "admin") {
      if (!announcement.club || !(await findManagedClub(req.user, announcement.club))) {
        return res.status(403).json({ success: false, message: "You can only update announcements for your assigned clubs" });
      }
      if (!(await Club.exists({ _id: announcement.club, status: "active" }))) {
        return res.status(409).json({ success: false, message: "Announcements for inactive clubs cannot be edited" });
      }
    }

    const {
      title,
      content,
      club,
      priority,
      status,
    } = req.body;

    if (club !== undefined && club !== null) {
      if (!mongoose.isValidObjectId(club)) {
        return res.status(400).json({ success: false, message: "Invalid club ID" });
      }
      const clubExists = await Club.findById(club);

      if (!clubExists || clubExists.status !== "active") {
        return res.status(404).json({ success: false, message: "An active, approved club is required for announcements" });
      }
      if (req.user.role !== "admin" && !(await findManagedClub(req.user, clubExists._id))) {
        return res.status(403).json({ success: false, message: "You can only associate announcements with your assigned clubs" });
      }

      announcement.club = club;
    }

    if (club === null && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only an administrator can make a campus-wide announcement" });
    }
    if (club === null) announcement.club = null;
    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (priority !== undefined) announcement.priority = priority;
    if (status !== undefined) announcement.status = status;

    await announcement.save();

    const updatedAnnouncement = await Announcement.findById(
      announcement._id
    )
      .populate("club", "name category")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      announcement: updatedAnnouncement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update announcement",
    });
  }
};

const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
    });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};