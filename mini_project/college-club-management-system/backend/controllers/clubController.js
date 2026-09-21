const Club = require("../models/Club");

const getClubs = async (req, res) => {
  try {
    const clubs = await Club.find()
      .populate("facultyCoordinator", "name email")
      .populate("studentCoordinator", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: clubs.length,
      clubs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch clubs",
    });
  }
};

const getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate("facultyCoordinator", "name email")
      .populate("studentCoordinator", "name email");

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    res.status(200).json({
      success: true,
      club,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to fetch club",
    });
  }
};

const createClub = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      logo,
      facultyCoordinator,
      studentCoordinator,
    } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Name, description and category are required",
      });
    }

    const existingClub = await Club.findOne({
      name: name.trim(),
    });

    if (existingClub) {
      return res.status(409).json({
        success: false,
        message: "Club name already exists",
      });
    }

    const club = await Club.create({
      name,
      description,
      category,
      logo,
      facultyCoordinator: facultyCoordinator || null,
      studentCoordinator: studentCoordinator || null,
    });

    res.status(201).json({
      success: true,
      message: "Club created successfully",
      club,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to create club",
    });
  }
};

const updateClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    const {
      name,
      description,
      category,
      logo,
      facultyCoordinator,
      studentCoordinator,
      status,
    } = req.body;

    if (name && name.trim() !== club.name) {
      const existingClub = await Club.findOne({
        name: name.trim(),
        _id: { $ne: club._id },
      });

      if (existingClub) {
        return res.status(409).json({
          success: false,
          message: "Club name already exists",
        });
      }
    }

    club.name = name ?? club.name;
    club.description = description ?? club.description;
    club.category = category ?? club.category;
    club.logo = logo ?? club.logo;
    club.facultyCoordinator =
      facultyCoordinator ?? club.facultyCoordinator;
    club.studentCoordinator =
      studentCoordinator ?? club.studentCoordinator;
    club.status = status ?? club.status;

    await club.save();

    res.status(200).json({
      success: true,
      message: "Club updated successfully",
      club,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to update club",
    });
  }
};

const deleteClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);

    if (!club) {
      return res.status(404).json({
        success: false,
        message: "Club not found",
      });
    }

    await club.deleteOne();

    res.status(200).json({
      success: true,
      message: "Club deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to delete club",
    });
  }
};

module.exports = {
  getClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
};