const sessionService = require("../services/sessionService");
const { uploadSessionImage } = require("../services/storageService");

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

/**
 * POST /api/session/:sessionId/images (Admin Only)
 * Upload up to 5 images for a session and append URLs to img_url_list
 * Expects: multipart/form-data with field name "image" (can send multiple files)
 */
const uploadSessionImageHandler = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided. Send up to 5 images in the "image" field.',
      });
    }

    const imageUrls = [];
    for (const file of req.files) {
      const imageUrl = await uploadSessionImage(sessionId, file);
      imageUrls.push(imageUrl);
    }

    res.status(200).json({
      success: true,
      message: `${imageUrls.length} image(s) uploaded successfully`,
      data: { imageUrls },
    });
  } catch (err) {
    next(err);
  }
};

const updateSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const {
      name,
      description,
      startDateTime,
      location,
      durationHours,
      earlyBirdPrice,
      regularPrice,
      capacity,
      img_url_list,
    } = req.body;

    const updatedSession = await sessionService.updateSession(sessionId, {
      name,
      description,
      startDateTime,
      location,
      durationHours,
      earlyBirdPrice,
      regularPrice,
      capacity,
      img_url_list,
    });

    res.status(200).json({
      success: true,
      message: "Session updated successfully",
      data: { session: updatedSession },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSession, uploadSessionImageHandler, updateSession };
