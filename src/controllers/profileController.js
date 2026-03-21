const prisma = require('../config/db');
const { uploadAvatar } = require('../services/storageService');
const { updateProfileInfo, updateUserPreferences, deleteProfile, getOwnProfile } = require('../services/profileService');

// ─── POST /api/profile/avatar ─────────────────────────────────────────────────
// Expects: multipart/form-data with field name "avatar"
const uploadAvatarHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided. Send an image in the "avatar" field.' });
    }

    const avatarUrl = await uploadAvatar(req.user.id, req.file);

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatarUrl },
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/profile/me ─────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const profile = await getOwnProfile(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { profile },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/profile/credentials ───────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const profile = await updateProfileInfo(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Medical and emergency fields updated',
      data: { profile },
    });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/profile/preferences ─────────────────────────────────────────
const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await updateUserPreferences(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Preferences updated',
      data: { preferences },
    });
  } catch (err) {
    next(err);
  }
};

const deleteProfileHandler = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      const { profileId } = req.params;
      const deletedProfile = await deleteProfile(profileId);
      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully',
        data: { profile: deletedProfile },
      });
    } else if (req.user.role === 'USER') {
      const deletedProfile = await deleteProfile(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Your profile has been deleted',
        data: { profile: deletedProfile },
      });
    } else {
      res.status(403).json({ success: false, message: 'Unauthorized' });
    }
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadAvatarHandler, getMe, updateProfile, updatePreferences, deleteProfileHandler };
