const mongoose = require("mongoose");
const Feedback = require("../models/Feedback");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { findManagedClub } = require("../utils/clubAccess");
const { getEventDateTime } = require("../utils/eventTime");

const createFeedback = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;

    if (!eventId || rating === undefined || typeof comment !== "string" || !comment.trim()) {
      return res.status(400).json({
        success: false,
        message: "Event ID, rating and comment are required",
      });
    }

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({ success: false, message: "Invalid event ID" });
    }

    if (comment.trim().length > 2000) {
      return res.status(400).json({ success: false, message: "Feedback comment must be 2,000 characters or fewer" });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (new Date() < getEventDateTime(event)) {
      return res.status(400).json({
        success: false,
        message: "Feedback can only be submitted after the event",
      });
    }

    const registration = await Registration.findOne({
      event: eventId,
      student: req.user.id,
      status: "registered",
    });

    if (!registration) {
      return res.status(403).json({
        success: false,
        message: "Only registered students can submit feedback",
      });
    }

    const existingFeedback = await Feedback.findOne({
      event: eventId,
      student: req.user.id,
    });

    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: "Feedback has already been submitted for this event",
      });
    }

    const feedback = await Feedback.create({
      event: eventId,
      student: req.user.id,
      rating: numericRating,
      comment,
    });

    const populatedFeedback = await Feedback.findById(feedback._id)
      .populate("event", "title date venue")
      .populate("student", "name email");

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback: populatedFeedback,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Feedback has already been submitted for this event" });
    }
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
};

const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({
      student: req.user.id,
    })
      .populate("event", "title date venue")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
    });
  }
};

const getEventFeedback = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    if (req.user.role !== "admin" && !(await findManagedClub(req.user, event.club))) {
      return res.status(403).json({ success: false, message: "You can only view feedback for your assigned clubs" });
    }

    const feedback = await Feedback.find({
      event: req.params.eventId,
    })
      .populate("student", "name email department year")
      .populate("event", "title date venue")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: feedback.length,
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event feedback",
    });
  }
};

const updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findOne({
      _id: req.params.id,
      student: req.user.id,
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    const { rating, comment } = req.body;

    if (rating !== undefined) {
      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message: "Rating must be between 1 and 5",
        });
      }

      feedback.rating = numericRating;
    }

    if (comment !== undefined) {
      if (typeof comment !== "string" || !comment.trim() || comment.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Comment must contain 1–2,000 characters",
        });
      }

      feedback.comment = comment.trim();
    }

    await feedback.save();

    const updatedFeedback = await Feedback.findById(feedback._id)
      .populate("event", "title date venue")
      .populate("student", "name email");

    res.status(200).json({
      success: true,
      message: "Feedback updated successfully",
      feedback: updatedFeedback,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update feedback",
    });
  }
};

const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete feedback",
    });
  }
};

module.exports = {
  createFeedback,
  getMyFeedback,
  getEventFeedback,
  updateFeedback,
  deleteFeedback,
};