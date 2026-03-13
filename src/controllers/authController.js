const authService = require('../services/authService');

const hasNonEmptyString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isValidPreferenceArray = (value) => {
  return Array.isArray(value)
    && value.length >= 1
    && value.length <= 3
    && value.every((item) => typeof item === 'string' && item.trim().length > 0);
};

// ─── POST /api/auth/register/step1 ───────────────────────────────────────────
// Create profile: credentials + personal info
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

    const requiredFields = { 
      email,
      username,
      password,
      name,
      nickname,
      gender,
      birthday,
      telephone,
      university,
      faculty,
      uniYear,
    };

    console.log(typeof(uniYear));

    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => {
        if (typeof value === 'string') {
          console.log(`Checking field ${key}: "${value}"`);
          return !hasNonEmptyString(value);
        }
        if (key === 'uniYear') {
          console.log(`Checking field ${key}: ${value}`);
          const parsedUniYear = Number(value);
          return Number.isNaN(parsedUniYear) || parsedUniYear < 1 || parsedUniYear > 6;
        }
        return value === undefined || value === null;
      })
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields, uniYear must be a number between 1 and 6',
        error: missingFields
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

    const requiredScalarFields = {
      agePreference,
      personality,
      personalityPreference,
      loveLangExpress,
      loveLangReceive,
    };

    const missingScalarFields = Object.entries(requiredScalarFields)
      .filter(([, value]) => !hasNonEmptyString(value))
      .map(([key]) => key);

    const requiredArrayFields = {
      hobbies,
      fashionStyle,
      fashionPreference,
      characteristics,
      characteristicPreference,
      faceType,
      faceTypePreference,
    };

    const invalidArrayFields = Object.entries(requiredArrayFields)
      .filter(([, value]) => !isValidPreferenceArray(value))
      .map(([key]) => key);

    if (missingScalarFields.length > 0 || invalidArrayFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'All step 2 fields are required except quote. Array fields must contain 1 to 3 items.',
        errors: {
          missingOrInvalidFields: missingScalarFields,
          invalidArrayFields,
        },
      });
    }

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
