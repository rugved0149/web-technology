const express = require("express");
const { getCoordinators } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/coordinators", protect, authorize("admin"), getCoordinators);

module.exports = router;
