const nodemailer = require("nodemailer");

const isEmailConfigured = () => Boolean(
  process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD
);

const createTransporter = () => nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: (process.env.EMAIL_APP_PASSWORD || "").replace(/\s/g, ""),
  },
});

const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character]));

const sendVerificationEmail = async (email, name, otp) => {
  if (!isEmailConfigured()) throw new Error("EMAIL_USER and EMAIL_APP_PASSWORD must be configured");
  const transporter = createTransporter();
  const safeName = escapeHtml(name);
  await transporter.sendMail({
    from: `"ClubSphere" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "ClubSphere email verification",
    text: `Hello ${name},\n\nYour ClubSphere verification code is: ${otp}\n\nThis code expires in 10 minutes. If you did not create this account, you can ignore this email.\n\nClubSphere`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:24px auto;padding:32px;border:1px solid #e6eaf2;border-radius:16px;color:#172033;">
        <p style="color:#3858d6;font-size:12px;font-weight:bold;letter-spacing:2px;">CLUBSPHERE</p>
        <h2 style="margin-bottom:8px;">Verify your email</h2>
        <p>Hello ${safeName},</p>
        <p>Use this one-time code to finish creating your account:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0;padding:20px;background:#f4f6ff;border-radius:12px;text-align:center;">${otp}</div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p style="color:#667085;font-size:13px;">If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, name, token) => {
  if (!isEmailConfigured()) throw new Error("EMAIL_USER and EMAIL_APP_PASSWORD must be configured");
  const transporter = createTransporter();
  const safeName = escapeHtml(name);
  const baseUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const safeResetUrl = escapeHtml(resetUrl);

  await transporter.sendMail({
    from: `"ClubSphere" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your ClubSphere password",
    text: `Hello ${name},\n\nUse this link to reset your ClubSphere password: ${resetUrl}\n\nThe link expires in 20 minutes and can only be used once. If you did not request a password reset, you can ignore this email.\n\nClubSphere`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:24px auto;padding:32px;border:1px solid #e6eaf2;border-radius:16px;color:#172033;">
        <p style="color:#3858d6;font-size:12px;font-weight:bold;letter-spacing:2px;">CLUBSPHERE</p>
        <h2 style="margin-bottom:8px;">Reset your password</h2>
        <p>Hello ${safeName},</p>
        <p>We received a request to reset your ClubSphere password. Use the button below to choose a new one.</p>
        <p style="margin:28px 0;"><a href="${safeResetUrl}" style="background:#3858d6;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;display:inline-block;">Reset password</a></p>
        <p>This link expires in <strong>20 minutes</strong> and can only be used once.</p>
        <p style="color:#667085;font-size:13px;">If you did not request this reset, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, isEmailConfigured };
