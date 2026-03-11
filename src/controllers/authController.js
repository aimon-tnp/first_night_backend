const authService = require('../services/authService');

// ─── POST /api/auth/register/step1 ───────────────────────────────────────────
// Create profile: credentials + personal info
const registerStep1 = async (req, res, next) => {
  try {
    const {
      // required
      email,
      username,
      password,
      // optional
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

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'email, username, and password are required',
      });
    }

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
// Create preferences — requires a valid JWT from step 1 (via protect middleware)
const registerStep2 = async (req, res, next) => {
  try {
    const profileId = req.user.id;

    const {
      // required
      agePreference,
      personality,
      loveLangExpress,
      loveLangReceive,
      // optional
      quote,
      personalityPreference,
      hobbies,
      fashionStyle,
      fashionPreference,
      characteristics,
      characteristicPreference,
    } = req.body;

    if (!agePreference || !personality || !loveLangExpress || !loveLangReceive) {
      return res.status(400).json({
        success: false,
        message: 'agePreference, personality, loveLangExpress, and loveLangReceive are required',
      });
    }

    const preferences = await authService.createPreferences(profileId, {
      agePreference,
      quote,
      personality,
      personalityPreference,
      loveLangExpress,
      loveLangReceive,
      hobbies,
      fashionStyle,
      fashionPreference,
      characteristics,
      characteristicPreference,
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

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'username and password are required',
      });
    }

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
// Stateless logout — the client is responsible for discarding the token.
// No server-side token blacklist exists in the current schema.
const logout = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please discard your token on the client.',
  });
};

module.exports = { registerStep1, registerStep2, login, logout };
