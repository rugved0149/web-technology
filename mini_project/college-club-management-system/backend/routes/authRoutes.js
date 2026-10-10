const express = require("express");

const {
  register,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  login,
  getProfile,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);

router.post("/verify-email", verifyEmail);

router.post("/resend-verification", resendVerification);

router.post("/forgot-password", requestPasswordReset);

router.post("/reset-password", resetPassword);

router.post("/login", login);

router.get("/profile", protect, getProfile);

module.exports = router;