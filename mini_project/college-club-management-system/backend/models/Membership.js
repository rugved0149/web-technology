const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    club: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "active", "left", "suspended"],
      default: "pending",
    },

    requestedAt: {
      type: Date,
      default: Date.now,
    },

    joinedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

membershipSchema.index(
  { student: 1, club: 1 },
  { unique: true }
);

module.exports = mongoose.model("Membership", membershipSchema);