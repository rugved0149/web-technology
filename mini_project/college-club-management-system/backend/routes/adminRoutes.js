const express = require("express");
const { getOverview } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/overview", protect, authorize("admin"), getOverview);

module.exports = router;
