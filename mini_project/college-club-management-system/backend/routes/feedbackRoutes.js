const express = require("express");

const {
  createFeedback,
  getMyFeedback,
  getEventFeedback,
  updateFeedback,
  deleteFeedback,
} = require("../controllers/feedbackController");

const { protect, authorize } = require("../middleware/authMiddleware");

const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("student"),
  createFeedback
);

router.get(
  "/my",
  protect,
  authorize("student"),
  getMyFeedback
);

router.get(
  "/event/:eventId",
  validateObjectId("eventId"),
  protect,
  authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"),
  getEventFeedback
);

router.put(
  "/:id",
  validateObjectId("id"),
  protect,
  authorize("student"),
  updateFeedback
);

router.delete(
  "/:id",
  validateObjectId("id"),
  protect,
  authorize("admin"),
  deleteFeedback
);

module.exports = router;