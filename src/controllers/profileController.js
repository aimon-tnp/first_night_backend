const prisma = require('../config/db');
const { uploadAvatar } = require('../services/storageService');
const { updateProfileInfo, updateUserPreferences } = require('../services/profileService');

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
    const profile = await prisma.profile.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        createdAt: true,
        email: true,
        username: true,
        role: true,
        name: true,
        nickname: true,
        gender: true,
        birthday: true,
        telephone: true,
        instagram: true,
        university: true,
        faculty: true,
        uniYear: true,
        emergencyName: true,
        emergencyRelationship: true,
        emergencyTelephone: true,
        allergies: true,
        medications: true,
        avatarUrl: true,
        isMatched: true,
        preferences: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    res.status(200).json({ success: true, data: { profile } });
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

module.exports = { uploadAvatarHandler, getMe, updateProfile, updatePreferences };
