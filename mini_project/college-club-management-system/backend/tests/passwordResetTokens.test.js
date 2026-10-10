const test = require("node:test");
const assert = require("node:assert/strict");
const { createPasswordResetToken, hashPasswordResetToken } = require("../utils/passwordResetTokens");

test("password reset tokens are high-entropy hex strings with a 20-minute expiry", () => {
  const now = 1_800_000_000_000;
  const result = createPasswordResetToken(now);
  assert.match(result.token, /^[a-f0-9]{64}$/);
  assert.match(result.tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(result.expiresAt.getTime(), now + 20 * 60 * 1000);
  assert.notEqual(result.token, result.tokenHash);
  assert.equal(hashPasswordResetToken(result.token), result.tokenHash);
});

test("separate reset tokens produce separate hashes", () => {
  const first = createPasswordResetToken();
  const second = createPasswordResetToken();
  assert.notEqual(first.token, second.token);
  assert.notEqual(first.tokenHash, second.tokenHash);
});
