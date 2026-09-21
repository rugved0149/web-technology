const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const updateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const user = await User.findOneAndUpdate(
      { email: "rugved0149@gmail.com" },
      {
        email: "rugved0149@gmail.com",
        role: "admin",
      },
      { returnDocument: "after" }
    );

    if (!user) {
      console.log("User not found");
      process.exit(1);
    }

    console.log(`Admin account updated: ${user.email}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

updateAdmin();