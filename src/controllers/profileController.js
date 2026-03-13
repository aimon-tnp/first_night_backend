const multer = require('multer');
const prisma = require('../config/db');
const { uploadAvatar } = require('../services/storageService');

// Keep file in memory — no disk writes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

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

// ─── PATCH /api/profile/medical-emergency ───────────────────────────────────
// Update: emergencyName, emergencyRelationship, emergencyTelephone,
//         allergies, medications
const updateMedicalEmergency = async (req, res, next) => {
  try {
    const {
      emergencyName,
      emergencyRelationship,
      emergencyTelephone,
      allergies,
      medications,
    } = req.body;

    const updateData = {};

    if (emergencyName !== undefined) updateData.emergencyName = emergencyName;
    if (emergencyRelationship !== undefined) updateData.emergencyRelationship = emergencyRelationship;
    if (emergencyTelephone !== undefined) updateData.emergencyTelephone = emergencyTelephone;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (medications !== undefined) updateData.medications = medications;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one field is required: emergencyName, emergencyRelationship, emergencyTelephone, allergies, medications',
      });
    }

    const profile = await prisma.profile.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        emergencyName: true,
        emergencyRelationship: true,
        emergencyTelephone: true,
        allergies: true,
        medications: true,
      },
    });

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
// Update all attributes in Preferences table (partial updates supported)
const updatePreferences = async (req, res, next) => {
  try {
    const {
      quote,
      personality,
      personalityPreference,
      agePreference,
      loveLangExpress,
      loveLangReceive,
      hobbies,
      fashionStyle,
      fashionPreference,
      characteristics,
      characteristicPreference,
    } = req.body;

    const updateData = {};

    if (quote !== undefined) updateData.quote = quote;
    if (personality !== undefined) updateData.personality = personality;
    if (personalityPreference !== undefined) updateData.personalityPreference = personalityPreference;
    if (agePreference !== undefined) updateData.agePreference = agePreference;
    if (loveLangExpress !== undefined) updateData.loveLangExpress = loveLangExpress;
    if (loveLangReceive !== undefined) updateData.loveLangReceive = loveLangReceive;
    if (hobbies !== undefined) updateData.hobbies = hobbies;
    if (fashionStyle !== undefined) updateData.fashionStyle = fashionStyle;
    if (fashionPreference !== undefined) updateData.fashionPreference = fashionPreference;
    if (characteristics !== undefined) updateData.characteristics = characteristics;
    if (characteristicPreference !== undefined) updateData.characteristicPreference = characteristicPreference;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one preferences field is required',
      });
    }

    const preferences = await prisma.preferences.update({
      where: { profileId: req.user.id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Preferences updated',
      data: { preferences },
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Preferences not found for this profile',
      });
    }
    next(err);
  }
};

module.exports = { upload, uploadAvatarHandler, getMe, updateMedicalEmergency, updatePreferences };
