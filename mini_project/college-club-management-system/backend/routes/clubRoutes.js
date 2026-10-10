const express = require("express");
const {
  getClubs, getClubById, getMyClubs, applyForClub, getAdminApplications,
  getAdminClubDetails, createClub, updateClub, reviewClub,
  requestClubDeletion, cancelClubDeletion, deleteClub,
} = require("../controllers/clubController");
const { protect, authorize } = require("../middleware/authMiddleware");
const validateObjectId = require("../middleware/validateObjectId");
const router = express.Router();

router.get("/", getClubs);
router.get("/mine", protect, authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"), getMyClubs);
router.post("/applications", protect, authorize("club_manager"), applyForClub);
router.get("/admin/applications", protect, authorize("admin"), getAdminApplications);
router.get("/admin/:id/details", validateObjectId("id"), protect, authorize("admin"), getAdminClubDetails);
router.put("/:id/review", validateObjectId("id"), protect, authorize("admin"), reviewClub);
router.put("/:id/request-deletion", validateObjectId("id"), protect, authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"), requestClubDeletion);
router.put("/:id/cancel-deletion", validateObjectId("id"), protect, authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"), cancelClubDeletion);
router.post("/", protect, authorize("admin"), createClub);
router.get("/:id", validateObjectId("id"), getClubById);
router.put("/:id", validateObjectId("id"), protect, authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"), updateClub);
router.delete("/:id", validateObjectId("id"), protect, authorize("admin"), deleteClub);

module.exports = router;
