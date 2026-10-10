const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
      trim: true,
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    locationUrl: { type: String, trim: true, maxlength: 1000, default: "" },
    organiserName: { type: String, trim: true, maxlength: 100, default: "" },
    organiserEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
    organiserPhone: { type: String, trim: true, maxlength: 40, default: "" },
    approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "approved", index: true },
    approvalNote: { type: String, trim: true, maxlength: 1000, default: "" },
    attendanceCode: { type: String, select: false, default: "" },
    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "registration_open",
        "registration_closed",
        "completed",
      ],
      default: "draft",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);