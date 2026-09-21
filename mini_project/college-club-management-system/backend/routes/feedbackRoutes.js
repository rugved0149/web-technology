const express = require("express");

const {
  createFeedback,
  getMyFeedback,
  getEventFeedback,
  updateFeedback,
  deleteFeedback,
} = require("../controllers/feedbackController");

const { protect, authorize } = require("../middleware/authMiddleware");

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
  protect,
  authorize("admin", "club_coordinator", "faculty_coordinator"),
  getEventFeedback
);

router.put(
  "/:id",
  protect,
  authorize("student"),
  updateFeedback
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteFeedback
);

module.exports = router;