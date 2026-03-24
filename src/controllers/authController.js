const authService = require('../services/authService');
const { verifyToken } = require('../utils/jwt');

const registerAdmin = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    const { profile, token } = await authService.registerProfile({
      email,
      username,
      password,
      role: 'ADMIN',
      name: 'Admin',
      nickname: 'Admin',
      gender: 'female',
      birthday: '2000-01-01',
      telephone: '0000000000',
      instagram: 'thefirstnight.bkk',
      university: 'Chulalongkorn University',
      faculty: 'BAScii',
      uniYear: 2,
      emergencyName: null,
      emergencyRelationship: null,
      emergencyTelephone: null,
      allergies: null,
      medications: null,
    });

    const preferences = await authService.createPreferences(profile.id, {
      agePreference: 'no_preference',
      personality: 'ambivert',
      personalityPreference: 'ambivert',
      loveLangExpress: '-',
      loveLangReceive: '-',
      quote: '-',
      hobbies: ['-'],
      fashionStyle: ['-'],
      fashionPreference: ['-'],
      characteristics: ['-'],
      characteristicPreference: ['-'],
      faceType: ['-'],
      faceTypePreference: ['-'],
    });

    res.status(201).json({
      success: true,
      message: 'Admin profile created.',
      data: { profile, token, preferences },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/register/step1 ───────────────────────────────────────────
// Create profile
const registerStep1 = async (req, res, next) => {
  try {
    const {
      email,
      username,
      password,
      name,
      nickname,
      gender,
      birthday,
      telephone,
      instagram,
      university,
      faculty,
      uniYear,
      emergencyName,
      emergencyRelationship,
      emergencyTelephone,
      allergies,
      medications,
    } = req.body;

    const { profile, token } = await authService.registerProfile({
      email,
      username,
      password,
      name,
      nickname,
      gender,
      birthday,
      telephone,
      instagram,
      university,
      faculty,
      uniYear,
      emergencyName,
      emergencyRelationship,
      emergencyTelephone,
      allergies,
      medications,
    });

    res.status(201).json({
      success: true,
      message: 'Profile created. Proceed to step 2 to set preferences.',
      data: { profile, token },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/register/step2 ───────────────────────────────────────────
// Create preferences
const registerStep2 = async (req, res, next) => {
  try {
    const profileId = req.user.id;

    const {
      agePreference,
      personality,
      personalityPreference,
      loveLangExpress,
      loveLangReceive,
      quote,
      hobbies,
      fashionStyle,
      fashionPreference,
      characteristics,
      characteristicPreference,
      faceType,
      faceTypePreference,
    } = req.body;

    const preferences = await authService.createPreferences(profileId, {
      agePreference,
      personality,
      personalityPreference,
      loveLangExpress,
      loveLangReceive,
      quote,
      hobbies,
      fashionStyle,
      fashionPreference,
      characteristics,
      characteristicPreference,
      faceType,
      faceTypePreference,
    });

    res.status(201).json({
      success: true,
      message: 'Preferences saved. Registration complete.',
      data: { preferences },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const { profile, token } = await authService.login({ username, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { profile, token },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/auth/logout ────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const token = req.token;

    await authService.logout(token, verifyToken);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { registerAdmin, registerStep1, registerStep2, login, logout };
