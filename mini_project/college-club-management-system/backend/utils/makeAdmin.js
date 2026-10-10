require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

const promoteToAdmin = async () => {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Usage: node utils/makeAdmin.js user@example.com");
    process.exitCode = 1;
    return;
  }
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email });

    if (!user) {
      console.error("No account found for that email. Register and verify the account first.");
      process.exitCode = 1;
      return;
    }
    if (!user.emailVerified) {
      console.error("The account must verify its email before it can be promoted.");
      process.exitCode = 1;
      return;
    }

    user.role = "admin";
    await user.save();
    console.log(`Administrator role assigned to ${user.email}`);
  } catch (error) {
    console.error("Could not promote account:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
};

promoteToAdmin();
