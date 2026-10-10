const crypto = require("crypto");

const createPasswordResetToken = (now = Date.now()) => {
  const token = crypto.randomBytes(32).toString("hex");
  return {
    token,
    tokenHash: hashPasswordResetToken(token),
    expiresAt: new Date(now + 20 * 60 * 1000),
  };
};

const hashPasswordResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

module.exports = { createPasswordResetToken, hashPasswordResetToken };
