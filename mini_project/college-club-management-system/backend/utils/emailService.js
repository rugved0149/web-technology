const nodemailer = require("nodemailer");

const getProvider = () => (
  process.env.EMAIL_PROVIDER || (process.env.BREVO_API_KEY ? "brevo" : "smtp")
).trim().toLowerCase();

const isEmailConfigured = () => {
  if (getProvider() === "brevo") {
    return Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);
  }
  return Boolean(process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD);
};

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

const sendWithBrevo = async ({ to, subject, text, html }) => {
  if (!process.env.BREVO_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("EMAIL_PROVIDER=brevo requires BREVO_API_KEY and EMAIL_FROM");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.EMAIL_FROM_NAME || "ClubSphere",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    let reason = detail;
    try {
      const parsed = JSON.parse(detail);
      reason = parsed.message || parsed.code || detail;
    } catch {
      // Keep the provider's plain-text response.
    }
    throw new Error(`Brevo email API returned HTTP ${response.status}: ${String(reason).slice(0, 240)}`);
  }

  return response.json().catch(() => ({}));
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isEmailConfigured()) {
    throw new Error(getProvider() === "brevo"
      ? "EMAIL_PROVIDER=brevo requires BREVO_API_KEY and EMAIL_FROM"
      : "EMAIL_USER and EMAIL_APP_PASSWORD must be configured");
  }

  if (getProvider() === "brevo") {
    return sendWithBrevo({ to, subject, text, html });
  }

  return createTransporter().sendMail({
    from: `"ClubSphere" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

const sendVerificationEmail = async (email, name, otp) => {
  const safeName = escapeHtml(name);
  const text = `Hello ${name},\n\nYour ClubSphere verification code is: ${otp}\n\nThis code expires in 10 minutes. If you did not create this account, you can ignore this email.\n\nClubSphere`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:24px auto;padding:32px;border:1px solid #e6eaf2;border-radius:16px;color:#172033;">
      <p style="color:#3858d6;font-size:12px;font-weight:bold;letter-spacing:2px;">CLUBSPHERE</p>
      <h2 style="margin-bottom:8px;">Verify your email</h2>
      <p>Hello ${safeName},</p>
      <p>Use this one-time code to finish creating your account:</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:24px 0;padding:20px;background:#f4f6ff;border-radius:12px;text-align:center;">${otp}</div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#667085;font-size:13px;">If you did not create this account, you can ignore this email.</p>
    </div>
  `;

  return sendEmail({ to: email, subject: "ClubSphere email verification", text, html });
};

const sendPasswordResetEmail = async (email, name, token) => {
  const safeName = escapeHtml(name);
  const baseUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const safeResetUrl = escapeHtml(resetUrl);
  const text = `Hello ${name},\n\nUse this link to reset your ClubSphere password: ${resetUrl}\n\nThe link expires in 20 minutes and can only be used once. If you did not request a password reset, you can ignore this email.\n\nClubSphere`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:24px auto;padding:32px;border:1px solid #e6eaf2;border-radius:16px;color:#172033;">
      <p style="color:#3858d6;font-size:12px;font-weight:bold;letter-spacing:2px;">CLUBSPHERE</p>
      <h2 style="margin-bottom:8px;">Reset your password</h2>
      <p>Hello ${safeName},</p>
      <p>We received a request to reset your ClubSphere password. Use the button below to choose a new one.</p>
      <p style="margin:28px 0;"><a href="${safeResetUrl}" style="background:#3858d6;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;display:inline-block;">Reset password</a></p>
      <p>This link expires in <strong>20 minutes</strong> and can only be used once.</p>
      <p style="color:#667085;font-size:13px;">If you did not request this reset, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({ to: email, subject: "Reset your ClubSphere password", text, html });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, isEmailConfigured };
