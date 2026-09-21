const express = require("express");

const {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require("../controllers/announcementController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAnnouncements);
router.get("/:id", getAnnouncementById);

router.post(
  "/",
  protect,
  authorize("admin", "club_coordinator", "faculty_coordinator"),
  createAnnouncement
);

router.put(
  "/:id",
  protect,
  authorize("admin", "club_coordinator", "faculty_coordinator"),
  updateAnnouncement
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteAnnouncement
);

module.exports = router;