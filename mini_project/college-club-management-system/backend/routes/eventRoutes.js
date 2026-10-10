const express = require("express");
const { getEvents, getEventById, getMyEvents, createEvent, updateEvent, deleteEvent, getPendingEvents, reviewEvent, getAttendanceLink } = require("../controllers/eventController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const router = express.Router();

router.get("/", getEvents);
router.get("/mine", protect, authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"), getMyEvents);
router.get("/admin/pending", protect, authorize("admin"), getPendingEvents);
router.put("/:id/review", validateObjectId("id"), protect, authorize("admin"), reviewEvent);
router.get("/:id/attendance-link", validateObjectId("id"), protect, authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"), getAttendanceLink);
router.get("/:id", validateObjectId("id"), getEventById);
router.post("/", protect, authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"), createEvent);
router.put("/:id", validateObjectId("id"), protect, authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"), updateEvent);
router.delete("/:id", validateObjectId("id"), protect, authorize("admin"), deleteEvent);
module.exports = router;
