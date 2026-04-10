const storageService = require('../services/storageService');
const profileService = require('../services/profileService');

// ─── POST /api/profile/avatar ─────────────────────────────────────────────────
// Expects: multipart/form-data with field name "avatar"
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided. Send an image in the "avatar" field.' });
    }

    const avatarUrl = await storageService.uploadAvatar(req.user.id, req.file);

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
// Get current user's own profile
const getMe = async (req, res, next) => {
  try {
    const profile = await profileService.getProfile(req.user.id);

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
    const profile = await profileService.updateProfileInfo(req.user.id, req.body);

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
    const preferences = await profileService.updateUserPreferences(req.user.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Preferences updated',
      data: { preferences },
    });
  } catch (err) {
    next(err);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      const { profileId } = req.params;
      const deletedProfile = await profileService.deleteProfile(profileId);
      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully',
        data: { profile: deletedProfile },
      });
    } else if (req.user.role === 'USER') {
      const deletedProfile = await profileService.deleteProfile(req.user.id);
      res.status(200).json({
        success: true,
        message: 'Your profile has been deleted',
        data: { profile: deletedProfile },
      });
    }
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/profiles/:profileId ────────────────────────────────────────────
// Admin only: Get another user's profile data
const getOtherUserProfile = async (req, res, next) => {
  try {
    const { profileId } = req.params;

    const profile = await profileService.getProfile(profileId);

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { profile },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadAvatar, getMe, updateProfile, updatePreferences, deleteProfile, getOtherUserProfile };
