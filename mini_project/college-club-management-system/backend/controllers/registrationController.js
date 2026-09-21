const Registration = require("../models/Registration");
const Event = require("../models/Event");

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Event ID is required",
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.status !== "registration_open") {
      return res.status(400).json({
        success: false,
        message: "Registration is not open for this event",
      });
    }

    const now = new Date();

    if (now > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: "Registration deadline has passed",
      });
    }

    if (now >= event.date) {
      return res.status(400).json({
        success: false,
        message: "Event registration is no longer available",
      });
    }

    const existingRegistration = await Registration.findOne({
      event: eventId,
      student: req.user.id,
    });

    if (
      existingRegistration &&
      existingRegistration.status === "registered"
    ) {
      return res.status(409).json({
        success: false,
        message: "Already registered for this event",
      });
    }

    const registeredCount = await Registration.countDocuments({
      event: eventId,
      status: "registered",
    });

    if (registeredCount >= event.capacity) {
      return res.status(400).json({
        success: false,
        message: "Event capacity is full",
      });
    }

    let registration;

    if (existingRegistration) {
      existingRegistration.status = "registered";
      existingRegistration.registeredAt = new Date();
      registration = await existingRegistration.save();
    } else {
      registration = await Registration.create({
        event: eventId,
        student: req.user.id,
      });
    }

    const populatedRegistration = await Registration.findById(
      registration._id
    )
      .populate("event", "title date time venue capacity status")
      .populate("student", "name email");

    res.status(201).json({
      success: true,
      message: "Event registration successful",
      registration: populatedRegistration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to register for event",
    });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      student: req.user.id,
    })
      .populate("event", "title date time venue capacity status category")
      .sort({ registeredAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
    });
  }
};

const getEventRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({
      event: req.params.eventId,
      status: "registered",
    })
      .populate("student", "name email department year")
      .populate("event", "title date venue capacity")
      .sort({ registeredAt: 1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch event registrations",
    });
  }
};

const cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findOne({
      _id: req.params.id,
      student: req.user.id,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    if (registration.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Registration is already cancelled",
      });
    }

    const event = await Event.findById(registration.event);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (new Date() >= event.date) {
      return res.status(400).json({
        success: false,
        message: "Registration cannot be cancelled after the event starts",
      });
    }

    registration.status = "cancelled";
    await registration.save();

    res.status(200).json({
      success: true,
      message: "Event registration cancelled",
      registration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel registration",
    });
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  cancelRegistration,
};