const Announcement = require("../models/Announcement");
const Club = require("../models/Club");

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({
      status: "published",
    })
      .populate("club", "name category")
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
    const announcement = await Announcement.findById(req.params.id)
      .populate("club", "name category")
      .populate("createdBy", "name email");

    if (!announcement) {
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

    if (club) {
      const clubExists = await Club.findById(club);

      if (!clubExists) {
        return res.status(404).json({
          success: false,
          message: "Club not found",
        });
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

    const {
      title,
      content,
      club,
      priority,
      status,
    } = req.body;

    if (club !== undefined && club !== null) {
      const clubExists = await Club.findById(club);

      if (!clubExists) {
        return res.status(404).json({
          success: false,
          message: "Club not found",
        });
      }

      announcement.club = club;
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