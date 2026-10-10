const Club = require("../models/Club");

/** Return a club only when the supplied account may manage it. */
const findManagedClub = async (user, clubId) => {
  if (!user || !clubId) return null;
  if (user.role === "admin") return Club.findById(clubId);

  const alternatives = [];
  if (user.role === "club_manager") alternatives.push({ owner: user.id });
  if (user.role === "club_coordinator") alternatives.push({ studentCoordinator: user.id });
  if (user.role === "faculty_coordinator") alternatives.push({ facultyCoordinator: user.id });
  if (!alternatives.length) return null;

  return Club.findOne({ _id: clubId, $or: alternatives });
};

module.exports = { findManagedClub };
