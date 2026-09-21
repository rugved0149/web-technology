const Event = require("../models/Event");
const Club = require("../models/Club");

const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("club", "name category")
      .populate("createdBy", "name email")
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("club", "name category")
      .populate("createdBy", "name email");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
};

const createEvent = async (req, res) => {
  try {
    const {
      club,
      title,
      description,
      date,
      time,
      venue,
      capacity,
      registrationDeadline,
      category,
      status,
    } = req.body;

    if (
      !club ||
      !title ||
      !description ||
      !date ||
      !time ||
      !venue ||
      !capacity ||
      !registrationDeadline ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message: "All required event fields must be provided",
      });
    }

    if (Number(capacity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be greater than zero",
      });
    }

    const eventDate = new Date(date);
    const deadline = new Date(registrationDeadline);

    if (Number.isNaN(eventDate.getTime()) || Number.isNaN(deadline.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date or registration deadline",
      });
    }

    if (deadline >= eventDate) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline must be before the event date",
      });
    }

    const clubExists = await Club.findById(club);

    if (!clubExists) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    const event = await Event.create({
      club,
      title,
      description,
      date: eventDate,
      time,
      venue,
      capacity: Number(capacity),
      registrationDeadline: deadline,
      category,
      createdBy: req.user.id,
      status: status || "draft",
    });

    const populatedEvent = await Event.findById(event._id)
      .populate("club", "name category")
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: populatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create event",
    });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const {
      club,
      title,
      description,
      date,
      time,
      venue,
      capacity,
      registrationDeadline,
      category,
      status,
    } = req.body;

    if (club) {
      const clubExists = await Club.findById(club);

      if (!clubExists) {
        return res.status(404).json({
          success: false,
          message: "Club not found",
        });
      }

      event.club = club;
    }

    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (time !== undefined) event.time = time;
    if (venue !== undefined) event.venue = venue;
    if (category !== undefined) event.category = category;
    if (status !== undefined) event.status = status;
    if (capacity !== undefined) event.capacity = Number(capacity);

    if (date !== undefined) {
      const newDate = new Date(date);

      if (Number.isNaN(newDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid event date",
        });
      }

      event.date = newDate;
    }

    if (registrationDeadline !== undefined) {
      const newDeadline = new Date(registrationDeadline);

      if (Number.isNaN(newDeadline.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid registration deadline",
        });
      }

      event.registrationDeadline = newDeadline;
    }

    if (event.capacity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Capacity must be greater than zero",
      });
    }

    if (event.registrationDeadline >= event.date) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline must be before the event date",
      });
    }

    await event.save();

    const updatedEvent = await Event.findById(event._id)
      .populate("club", "name category")
      .populate("createdBy", "name email");

    res.status(200).json({
      success: true,
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update event",
    });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};