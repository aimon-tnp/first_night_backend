const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hasNonEmptyString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isValidPreferenceArray = (value) => {
  return Array.isArray(value)
    && value.length >= 1
    && value.length <= 3
    && value.every((item) => typeof item === 'string' && item.trim().length > 0);
};

// ─── Step 1: Register profile (credentials + personal info) ─────────────────

/**
 * Create a new Profile record.
 */
const registerProfile = async ({
  email,
  username,
  password,
  role,
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
}) => {

  if (!hasNonEmptyString(email)) {
    const err = new Error('email is required');
    err.statusCode = 400;
    throw err;
  }

  if (!hasNonEmptyString(username)) {
    const err = new Error('username is required');
    err.statusCode = 400;
    throw err;
  }

  if (!hasNonEmptyString(password)) {
    const err = new Error('password is required');
    err.statusCode = 400;
    throw err;
  }

  // Validate personal info fields
  const personalInfoFields = { name, nickname, gender, birthday, telephone, university, faculty, uniYear };
  const allFieldsProvided = Object.values(personalInfoFields).every(v => v !== undefined && v !== null);
  
  if (allFieldsProvided) {
    const requiredFields = { name, nickname, gender, birthday, telephone, university, faculty, uniYear };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => {
        if (typeof value === 'string') {
          return !hasNonEmptyString(value);
        }
        if (key === 'uniYear') {
          const parsedUniYear = Number(value);
          return Number.isNaN(parsedUniYear) || parsedUniYear < 1 || parsedUniYear > 6;
        }
        return value === undefined || value === null;
      })
      .map(([key]) => key);

    if (missingFields.length > 0) {
      const err = new Error('Missing required fields, uniYear must be a number from 1 to 6');
      err.statusCode = 400;
      err.missingFields = missingFields;
      throw err;
    }
  }

  // Check uniqueness
  const existingEmail = await prisma.profile.findUnique({ where: { email } });
  if (existingEmail) {
    const err = new Error('Email is already registered');
    err.statusCode = 409;
    throw err;
  }

  const existingUsername = await prisma.profile.findUnique({ where: { username } });
  if (existingUsername) {
    const err = new Error('Username is already taken');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const profile = await prisma.profile.create({
    data: {
      email,
      username,
      passwordHash,
      role: role || 'USER',
      name,
      nickname,
      gender,
      birthday: birthday ? new Date(birthday) : undefined,
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
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      name: true,
      nickname: true,
      gender: true,
      createdAt: true,
    },
  });

  const token = signToken({ id: profile.id, username: profile.username, role: profile.role });

  return { profile, token };
};

// ─── Step 2: Create preferences for an already-registered profile ────────────

/**
 * Create a Preferences record linked to a Profile.
 */
const createPreferences = async (profileId, {
  agePreference,
  personality,
  personalityPreference,
  loveLangExpress,
  loveLangReceive,
  quote,
  hobbies = [],
  fashionStyle = [],
  fashionPreference = [],
  characteristics = [],
  characteristicPreference = [],
  faceType = [],
  faceTypePreference = [],
}) => {
  // Validate required scalar fields
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

  if (missingScalarFields.length > 0) {
    const err = new Error('Missing required scalar fields');
    err.statusCode = 400;
    err.missingFields = missingScalarFields;
    throw err;
  }

  // Validate required array fields
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

  if (invalidArrayFields.length > 0) {
    const err = new Error('Array fields must contain 1 to 3 non-empty items');
    err.statusCode = 400;
    err.invalidFields = invalidArrayFields;
    throw err;
  }

  // Ensure the profile exists and doesn't already have preferences
  const existing = await prisma.preferences.findUnique({ where: { profileId } });
  if (existing) {
    const err = new Error('Preferences already set for this profile');
    err.statusCode = 409;
    throw err;
  }

  const preferences = await prisma.preferences.create({
    data: {
      profileId,
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
    },
  });

  return preferences;
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async ({ username, password }) => {
  // Validate required fields
  if (!hasNonEmptyString(username)) {
    const err = new Error('username is required');
    err.statusCode = 400;
    throw err;
  }

  if (!hasNonEmptyString(password)) {
    const err = new Error('password is required');
    err.statusCode = 400;
    throw err;
  }

  const profile = await prisma.profile.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      name: true,
      nickname: true,
      passwordHash: true,
    },
  });

  if (!profile) {
    const err = new Error('Invalid username or password');
    err.statusCode = 401;
    throw err;
  }

  const isValid = await bcrypt.compare(password, profile.passwordHash);
  if (!isValid) {
    const err = new Error('Invalid username or password');
    err.statusCode = 401;
    throw err;
  }

  const { passwordHash, ...safeProfile } = profile;
  const token = signToken({ id: profile.id, username: profile.username, role: profile.role });

  return { profile: safeProfile, token };
};

module.exports = { registerProfile, createPreferences, login };
