const allowedRolesByLoginType = Object.freeze({
  student: Object.freeze(["student"]),
  club: Object.freeze(["club_manager", "club_coordinator", "faculty_coordinator"]),
  admin: Object.freeze(["admin"]),
});

const isRoleAllowedForLoginType = (loginType, role) => (
  Array.isArray(allowedRolesByLoginType[loginType])
  && allowedRolesByLoginType[loginType].includes(role)
);

module.exports = { allowedRolesByLoginType, isRoleAllowedForLoginType };
