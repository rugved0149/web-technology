const Feedback = require("../models/Feedback");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

const createFeedback = async (req, res) => {
  try {
    const { eventId, rating, comment } = req.body;

    if (!eventId || rating === undefined || !comment) {
      return res.status(400).json({
        success: false,
        message: "Event ID, rating and comment are required",
      });
    }

    const numericRating = Number(rating);

    if (
      Number.isNaN(numericRating) ||
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

    if (new Date() < event.date) {
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
        Number.isNaN(numericRating) ||
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
      if (!comment.trim()) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot be empty",
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