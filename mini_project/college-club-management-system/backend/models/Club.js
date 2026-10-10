const mongoose = require("mongoose");

const keyMemberSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  department: { type: String, trim: true, maxlength: 100, default: "" },
}, { _id: true });

const clubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  category: { type: String, required: true, trim: true, maxlength: 80 },
  department: { type: String, trim: true, maxlength: 100, default: "" },
  logo: { type: String, default: "", maxlength: 500 },
  contactEmail: { type: String, trim: true, lowercase: true, maxlength: 254, default: "" },
  contactPhone: { type: String, trim: true, maxlength: 40, default: "" },
  website: { type: String, trim: true, maxlength: 300, default: "" },
  instagram: { type: String, trim: true, maxlength: 200, default: "" },
  keyMembers: { type: [keyMemberSchema], default: [] },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  facultyCoordinator: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  studentCoordinator: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  status: {
    type: String,
    enum: ["active", "inactive", "pending_approval", "rejected", "deletion_pending"],
    default: "active",
  },
  rejectionReason: { type: String, trim: true, maxlength: 1000, default: "" },
  deletionReason: { type: String, trim: true, maxlength: 1000, default: "" },
  deletionRequestedAt: { type: Date, default: null },
  deletionScheduledAt: { type: Date, default: null, index: true },
}, { timestamps: true });

module.exports = mongoose.model("Club", clubSchema);
