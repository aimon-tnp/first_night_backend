const sessionService = require("../services/sessionService");

/**
 * POST /api/session (Admin Only)
 * Create a new session
 * Required: name, startDateTime, location, earlyBirdPrice, regularPrice, capacity
 * Optional: description, img_url_list
 */
const createSession = async (req, res, next) => {
  try {
    const {
      name,
      description,
      startDateTime,
      durationHours,
      location,
      earlyBirdPrice,
      regularPrice,
      capacity,
      img_url_list,
    } = req.body;

    const session = await sessionService.createSession({
      name,
      description,
      startDateTime,
      durationHours,
      location,
      earlyBirdPrice,
      regularPrice,
      capacity,
      img_url_list,
    });

    res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: { session },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSession };
