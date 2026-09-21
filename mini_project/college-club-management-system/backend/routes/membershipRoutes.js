const express = require("express");

const {
  requestMembership,
  getMyMemberships,
  getClubMemberships,
  updateMembershipStatus,
  leaveClub,
} = require("../controllers/membershipController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, authorize("student"), requestMembership);

router.get("/my", protect, authorize("student"), getMyMemberships);

router.get(
  "/club/:clubId",
  protect,
  authorize("admin", "club_coordinator", "faculty_coordinator"),
  getClubMemberships
);

router.put(
  "/:id/status",
  protect,
  authorize("admin", "club_coordinator", "faculty_coordinator"),
  updateMembershipStatus
);

router.put(
  "/:id/leave",
  protect,
  authorize("student"),
  leaveClub
);

module.exports = router;