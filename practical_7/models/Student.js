const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [100, "Name must not exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      maxlength: [254, "Email must not exceed 254 characters"],
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"],
      unique: true
    },
    course: {
      type: String,
      required: [true, "Course is required"],
      trim: true,
      minlength: [2, "Course must contain at least 2 characters"],
      maxlength: [100, "Course must not exceed 100 characters"]
    },
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [1, "Year must be between 1 and 6"],
      max: [6, "Year must be between 1 and 6"],
      validate: { validator: Number.isInteger, message: "Year must be a whole number" }
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Student", studentSchema);
