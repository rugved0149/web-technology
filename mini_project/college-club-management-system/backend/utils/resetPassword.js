require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const askHidden = (question) => new Promise((resolve, reject) => {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    reject(new Error("Run this script directly in an interactive CMD or terminal."));
    return;
  }

  let value = "";
  process.stdout.write(question);
  input.setRawMode(true);
  input.resume();
  input.setEncoding("utf8");

  const cleanup = () => {
    input.setRawMode(false);
    input.pause();
    input.removeListener("data", onData);
  };

  const onData = (key) => {
    if (key === "\u0003") {
      cleanup();
      process.exit(130);
    }
    if (key === "\r" || key === "\n") {
      cleanup();
      process.stdout.write("\n");
      resolve(value);
    } else if (key === "\u007f" || key === "\b") {
      value = value.slice(0, -1);
    } else if (!/[\u0000-\u001f\u007f]/.test(key)) {
      value += key;
    }
  };

  input.on("data", onData);
});

async function resetPassword() {
  const email = (process.argv[2] || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: node utils/resetPassword.js verified-account@example.com");
  }
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing from .env.");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email });
    if (!user) throw new Error(`No account found for ${email}.`);
    if (!user.emailVerified) throw new Error("Verify this account's email before resetting its password.");

    const password = await askHidden("Enter new password (8–128 characters): ");
    const confirmation = await askHidden("Confirm new password: ");
    if (password.length < 8 || password.length > 128) throw new Error("Password must contain 8–128 characters.");
    if (password !== confirmation) throw new Error("Passwords do not match.");

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    console.log(`Password reset successfully for ${user.email}.`);
    console.log(`Current account role: ${user.role}`);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

resetPassword().catch((error) => {
  console.error("Password reset failed:", error.message);
  process.exitCode = 1;
});
