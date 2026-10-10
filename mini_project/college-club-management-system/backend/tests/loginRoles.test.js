const test = require("node:test");
const assert = require("node:assert/strict");
const { isRoleAllowedForLoginType } = require("../utils/loginRoles");

test("student login only accepts the student role", () => {
  assert.equal(isRoleAllowedForLoginType("student", "student"), true);
  assert.equal(isRoleAllowedForLoginType("student", "admin"), false);
  assert.equal(isRoleAllowedForLoginType("student", "club_manager"), false);
});

test("club login accepts representatives and coordinators, but not admins", () => {
  assert.equal(isRoleAllowedForLoginType("club", "club_manager"), true);
  assert.equal(isRoleAllowedForLoginType("club", "club_coordinator"), true);
  assert.equal(isRoleAllowedForLoginType("club", "faculty_coordinator"), true);
  assert.equal(isRoleAllowedForLoginType("club", "student"), false);
  assert.equal(isRoleAllowedForLoginType("club", "admin"), false);
});

test("admin login only accepts the admin role", () => {
  assert.equal(isRoleAllowedForLoginType("admin", "admin"), true);
  assert.equal(isRoleAllowedForLoginType("admin", "student"), false);
  assert.equal(isRoleAllowedForLoginType("admin", "club_manager"), false);
});

test("missing or unknown login types never match a role", () => {
  assert.equal(isRoleAllowedForLoginType(undefined, "admin"), false);
  assert.equal(isRoleAllowedForLoginType("superuser", "admin"), false);
});
