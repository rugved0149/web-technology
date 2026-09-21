const express = require("express");

const {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
} = require("../controllers/clubController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getClubs);
router.get("/:id", getClubById);

router.post(
  "/",
  protect,
  authorize("admin", "club_coordinator", "faculty_coordinator"),
  createClub
);

router.put(
  "/:id",
  protect,
  authorize("admin", "club_coordinator", "faculty_coordinator"),
  updateClub
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteClub
);

module.exports = router;