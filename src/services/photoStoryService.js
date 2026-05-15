const prisma = require('../config/db');
const { deletePhotoStory } = require('./storageService');

/**
 * Create or update a PhotoStory record.
 * If a PhotoStory already exists for the given [userId, sessionId], delete the old one and replace it.
 */
const createOrUpdatePhotoStory = async (userId, sessionId, photoUrl) => {
  // Check if PhotoStory already exists
  let existingPhotoStory;
  try {
    existingPhotoStory = await prisma.photoStory.findFirst({
      where: {
        userId,
        sessionId,
      },
    });
  } catch (err) {
    const error = new Error('Database error while checking existing photo story');
    error.statusCode = 500;
    throw error;
  }

  // If exists, delete old file from storage and the old record
  if (existingPhotoStory && existingPhotoStory.photoUrl) {
    await deletePhotoStory(existingPhotoStory.photoUrl);
    
    // Delete the old record
    try {
      await prisma.photoStory.delete({
        where: { id: existingPhotoStory.id },
      });
    } catch (err) {
      console.warn(`Failed to delete old photo story record: ${err.message}`);
    }
  }

  // Create new PhotoStory
  let photoStory;
  try {
    photoStory = await prisma.photoStory.create({
      data: {
        userId,
        sessionId,
        photoUrl,
      },
    });
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error('User or Session not found');
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }

  return photoStory;
};

/**
 * Get a PhotoStory by userId and sessionId.
 */
const getPhotoStory = async (userId, sessionId) => {
  try {
    const photoStory = await prisma.photoStory.findFirst({
      where: {
        userId,
        sessionId,
      },
    });
    return photoStory;
  } catch (err) {
    const error = new Error('Database error while retrieving photo story');
    error.statusCode = 500;
    throw error;
  }
};

/**
 * Delete a PhotoStory by ID (also deletes the file from storage).
 */
const deletePhotoStoryById = async (photoStoryId) => {
  try {
    const photoStory = await prisma.photoStory.findUnique({
      where: { id: photoStoryId },
    });

    if (!photoStory) {
      const err = new Error('Photo story not found');
      err.statusCode = 404;
      throw err;
    }

    // Delete file from storage
    if (photoStory.photoUrl) {
      await deletePhotoStory(photoStory.photoUrl);
    }

    // Delete from database
    await prisma.photoStory.delete({
      where: { id: photoStoryId },
    });

    return photoStory;
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error('Photo story not found');
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }
};

module.exports = {
  createOrUpdatePhotoStory,
  getPhotoStory,
  deletePhotoStoryById,
};
