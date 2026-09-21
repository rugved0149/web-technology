const Membership = require("../models/Membership");
const Club = require("../models/Club");

const requestMembership = async (req, res) => {
  try {
    const { clubId } = req.body;

    if (!clubId) {
      return res.status(400).json({
        success: false,
        message: "Club ID is required",
      });
    }

    const club = await Club.findById(clubId);

    if (!club || club.status !== "active") {
      return res.status(404).json({
        success: false,
        message: "Active club not found",
      });
    }

    const existingMembership = await Membership.findOne({
      student: req.user.id,
      club: clubId,
    });

    if (existingMembership) {
      return res.status(409).json({
        success: false,
        message: "Membership request already exists",
        status: existingMembership.status,
      });
    }

    const membership = await Membership.create({
      student: req.user.id,
      club: clubId,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Membership request submitted",
      membership,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to submit membership request",
    });
  }
};

const getMyMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find({
      student: req.user.id,
    })
      .populate("club", "name category status logo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: memberships.length,
      memberships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch memberships",
    });
  }
};

const getClubMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find({
      club: req.params.clubId,
    })
      .populate("student", "name email department year")
      .populate("club", "name category")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: memberships.length,
      memberships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch club memberships",
    });
  }
};

const updateMembershipStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["approved", "rejected", "suspended"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid membership status",
      });
    }

    const membership = await Membership.findById(req.params.id);

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    membership.status = status;

    if (status === "approved") {
      membership.joinedAt = new Date();
      membership.status = "active";
    }

    await membership.save();

    res.status(200).json({
      success: true,
      message: `Membership ${status === "approved" ? "approved" : status}`,
      membership,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update membership",
    });
  }
};

const leaveClub = async (req, res) => {
  try {
    const membership = await Membership.findOne({
      _id: req.params.id,
      student: req.user.id,
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    if (membership.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active memberships can be left",
      });
    }

    membership.status = "left";

    await membership.save();

    res.status(200).json({
      success: true,
      message: "Club membership ended",
      membership,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to leave club",
    });
  }
};

module.exports = {
  requestMembership,
  getMyMemberships,
  getClubMemberships,
  updateMembershipStatus,
  leaveClub,
};