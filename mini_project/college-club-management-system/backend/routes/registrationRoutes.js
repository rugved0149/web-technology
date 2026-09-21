const express = require("express");

const {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  cancelRegistration,
} = require("../controllers/registrationController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("student"),
  registerForEvent
);

router.get(
  "/my",
  protect,
  authorize("student"),
  getMyRegistrations
);

router.get(
  "/event/:eventId",
  protect,
  authorize("admin", "club_coordinator", "faculty_coordinator"),
  getEventRegistrations
);

router.put(
  "/:id/cancel",
  protect,
  authorize("student"),
  cancelRegistration
);

module.exports = router;