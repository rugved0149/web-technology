const User = require("../models/User");

const getCoordinators = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only administrators can view coordinator accounts" });
    }

    const coordinators = await User.find({
      active: true,
      emailVerified: true,
      role: { $in: ["club_coordinator", "faculty_coordinator"] },
    })
      .select("name email role department")
      .sort({ role: 1, name: 1 })
      .lean();

    return res.status(200).json({ success: true, coordinators });
  } catch (error) {
    console.error("Coordinator list error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load coordinator accounts" });
  }
};

module.exports = { getCoordinators };
