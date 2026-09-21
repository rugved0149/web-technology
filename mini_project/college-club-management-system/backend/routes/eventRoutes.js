const express = require("express");
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getEvents);
router.get("/:id", getEventById);

router.post(
  "/",
  protect,
  authorize("admin", "club_coordinator", "faculty_coordinator"),
  createEvent
);

router.put(
  "/:id",
  protect,
  authorize("admin", "club_coordinator", "faculty_coordinator"),
  updateEvent
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteEvent
);

module.exports = router;