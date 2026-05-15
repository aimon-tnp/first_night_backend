const { uploadPhotoStory } = require('../services/storageService');
const photoStoryService = require('../services/photoStoryService');
const prisma = require('../config/db');

/**
 * Upload a photo story for a session.
 * If a photo story already exists for this user-session pair, replace it.
 * 
 * Request: POST /api/sessions/:sessionId/photo-story
 * Body: multipart/form-data with "photo" file
 * Response: PhotoStory object with { id, userId, sessionId, photoUrl, createdAt }
 */
const uploadPhotoStoryController = async (req, res, next) => {
  try {
    // Validate file
    if (!req.file) {
      const err = new Error('No file provided');
      err.statusCode = 400;
      return next(err);
    }

    const userId = req.user.id;
    const { sessionId } = req.params;

    // Verify session exists
    let session;
    try {
      session = await prisma.session.findUnique({
        where: { id: sessionId },
      });
    } catch (err) {
      const error = new Error('Database error while verifying session');
      error.statusCode = 500;
      return next(error);
    }

    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      return next(err);
    }

    // Upload file to Supabase
    const photoUrl = await uploadPhotoStory(userId, sessionId, req.file);

    // Create or update PhotoStory in database
    const photoStory = await photoStoryService.createOrUpdatePhotoStory(
      userId,
      sessionId,
      photoUrl
    );

    res.status(200).json({
      success: true,
      message: 'Photo story uploaded successfully',
      data: photoStory,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadPhotoStoryController };
