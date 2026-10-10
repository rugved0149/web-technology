const express = require("express");

const {
  requestMembership,
  getMyMemberships,
  getClubMemberships,
  updateMembershipStatus,
  leaveClub,
} = require("../controllers/membershipController");

const { protect, authorize } = require("../middleware/authMiddleware");

const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.post("/", protect, authorize("student"), requestMembership);

router.get("/my", protect, authorize("student"), getMyMemberships);

router.get(
  "/club/:clubId",
  validateObjectId("clubId"),
  protect,
  authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"),
  getClubMemberships
);

router.put(
  "/:id/status",
  validateObjectId("id"),
  protect,
  authorize("admin", "club_manager", "club_coordinator", "faculty_coordinator"),
  updateMembershipStatus
);

router.put(
  "/:id/leave",
  validateObjectId("id"),
  protect,
  authorize("student"),
  leaveClub
);

module.exports = router;