const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const EmailVerification = require("../models/EmailVerification");
const PasswordReset = require("../models/PasswordReset");
const { createPasswordResetToken, hashPasswordResetToken } = require("../utils/passwordResetTokens");
const { sendVerificationEmail, sendPasswordResetEmail, isEmailConfigured } = require("../utils/emailService");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const register = async (req, res) => {
  let createdUserId = null;
  let normalizedEmail = "";
  try {
    const { name, email, password, department, year, accountType } = req.body;

    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    const normalizedName = name.trim().replace(/\s+/g, " ");
    normalizedEmail = email.trim().toLowerCase();
    if (normalizedName.length < 2 || normalizedName.length > 80) {
      return res.status(400).json({ success: false, message: "Name must be between 2 and 80 characters" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 254) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: "Password must be between 8 and 128 characters" });
    }
    if ((department !== undefined && typeof department !== "string") || (year !== undefined && typeof year !== "string")) {
      return res.status(400).json({ success: false, message: "Department and year must be text values" });
    }
    if (String(department || "").trim().length > 100 || String(year || "").trim().length > 40) {
      return res.status(400).json({ success: false, message: "Department or year is too long" });
    }
    if (!isEmailConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Email verification is not configured on the server. Contact the administrator.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const requestedRole = accountType === "club_manager" ? "club_manager" : "student";
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      department,
      year,
      role: requestedRole,
      emailVerified: false,
    });
    createdUserId = user._id;

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await EmailVerification.deleteMany({
      email: normalizedEmail,
    });

    await EmailVerification.create({
      email: normalizedEmail,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      lastSentAt: new Date(),
    });

    try {
      await sendVerificationEmail(normalizedEmail, user.name, otp);
    } catch (mailError) {
      await Promise.allSettled([
        User.deleteOne({ _id: user._id }),
        EmailVerification.deleteMany({ email: normalizedEmail }),
      ]);
      console.error("Verification email failed:", mailError.message);
      return res.status(503).json({
        success: false,
        message: "Unable to send a verification email right now. Please try again later.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful. Verification OTP sent to your email.",
      email: normalizedEmail,
    });
  } catch (error) {
    if (createdUserId) {
      await Promise.allSettled([
        User.deleteOne({ _id: createdUserId }),
        EmailVerification.deleteMany({ email: normalizedEmail }),
      ]);
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }
    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (typeof email !== "string" || typeof otp !== "string" && typeof otp !== "number") {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = String(otp).trim();
    if (!/^[0-9]{6}$/.test(normalizedOtp)) {
      return res.status(400).json({ success: false, message: "OTP must be a 6-digit code" });
    }

    const verification = await EmailVerification.findOne({
      email: normalizedEmail,
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or expired",
      });
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (verification.attempts >= 5) {
      await EmailVerification.deleteOne({
        _id: verification._id,
      });

      return res.status(429).json({
        success: false,
        message: "Too many verification attempts. Please request a new OTP.",
      });
    }

    const validOtp = await bcrypt.compare(
      normalizedOtp,
      verification.otpHash
    );

    verification.attempts += 1;
    await verification.save();

    if (!validOtp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.emailVerified = true;
    await user.save();

    await EmailVerification.deleteOne({
      _id: verification._id,
    });

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify email",
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }
    if (!isEmailConfigured()) {
      return res.status(503).json({ success: false, message: "Email verification is not configured on the server. Contact the administrator." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const genericMessage = "If this address belongs to an unverified account, a new verification code has been sent.";
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.emailVerified) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    let verification = await EmailVerification.findOne({ email: normalizedEmail });
    const lastSentAt = verification?.lastSentAt || verification?.createdAt;
    if (lastSentAt && Date.now() - lastSentAt.getTime() < 60 * 1000) {
      return res.status(429).json({ success: false, message: "Please wait one minute before requesting another code." });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (verification) {
      verification.otpHash = otpHash;
      verification.expiresAt = expiresAt;
      verification.attempts = 0;
      verification.lastSentAt = new Date();
      await verification.save();
    } else {
      verification = await EmailVerification.create({ email: normalizedEmail, otpHash, expiresAt, attempts: 0, lastSentAt: new Date() });
    }

    try {
      await sendVerificationEmail(normalizedEmail, user.name, otp);
    } catch (mailError) {
      await EmailVerification.deleteOne({ _id: verification._id });
      console.error("Resend verification email failed:", mailError.message);
      return res.status(503).json({ success: false, message: "Unable to send a verification email right now. Please try again later." });
    }

    return res.status(200).json({ success: true, message: genericMessage });
  } catch (error) {
    console.error("Resend verification error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to resend verification code" });
  }
};


const requestPasswordReset = async (req, res) => {
  const genericMessage = "If an account with that email exists and is verified, a password reset link will be sent shortly.";

  try {
    const { email } = req.body;
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }
    if (!isEmailConfigured()) {
      return res.status(503).json({ success: false, message: "Password reset email is not configured on the server." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, active: true, emailVerified: true });
    if (!user) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    const existing = await PasswordReset.findOne({ email: normalizedEmail });
    if (existing && Date.now() - existing.lastSentAt.getTime() < 60 * 1000) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    const { token, tokenHash, expiresAt } = createPasswordResetToken();
    const lastSentAt = new Date();
    if (existing) {
      existing.tokenHash = tokenHash;
      existing.expiresAt = expiresAt;
      existing.lastSentAt = lastSentAt;
      await existing.save();
    } else {
      await PasswordReset.create({ email: normalizedEmail, tokenHash, expiresAt, lastSentAt });
    }

    try {
      await sendPasswordResetEmail(normalizedEmail, user.name, token);
    } catch (mailError) {
      await PasswordReset.deleteOne({ email: normalizedEmail });
      console.error("Password reset email failed:", mailError.message);
      return res.status(200).json({ success: true, message: genericMessage });
    }

    return res.status(200).json({ success: true, message: genericMessage });
  } catch (error) {
    console.error("Password reset request error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to process the password reset request" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ success: false, message: "This password reset link is invalid or has expired. Request a new one." });
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: "Password must be between 8 and 128 characters" });
    }

    const resetRecord = await PasswordReset.findOne({
      tokenHash: hashPasswordResetToken(token),
      expiresAt: { $gt: new Date() },
    });
    if (!resetRecord) {
      return res.status(400).json({ success: false, message: "This password reset link is invalid or has expired. Request a new one." });
    }

    const user = await User.findOne({ email: resetRecord.email, active: true, emailVerified: true });
    if (!user) {
      await PasswordReset.deleteOne({ _id: resetRecord._id });
      return res.status(400).json({ success: false, message: "This password reset link is invalid or has expired. Request a new one." });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    await PasswordReset.deleteMany({ email: resetRecord.email });

    return res.status(200).json({ success: true, message: "Password reset successfully. You can now sign in with your new password." });
  } catch (error) {
    console.error("Password reset error:", error.message);
    return res.status(500).json({ success: false, message: "Unable to reset password right now" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, loginType } = req.body;

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!["student", "club", "admin"].includes(loginType)) {
      return res.status(400).json({
        success: false,
        message: "Choose Student, Club, or Administrator before signing in.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }

    const allowedRolesByLoginType = {
      student: ["student"],
      club: ["club_manager", "club_coordinator", "faculty_coordinator"],
      admin: ["admin"],
    };

    if (!allowedRolesByLoginType[loginType].includes(user.role)) {
      const messageByLoginType = {
        student: "This account is not a student account. Select Club or Administrator if that matches your assigned role.",
        club: "This account is not a club or coordinator account. Select Student or Administrator if that matches your assigned role.",
        admin: "This account does not have administrator privileges. Choose the role assigned to your account.",
      };

      return res.status(403).json({
        success: false,
        message: messageByLoginType[loginType],
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile",
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerification,
  requestPasswordReset,
  resetPassword,
  login,
  getProfile,
};