const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signToken } = require('../utils/jwt');

const SALT_ROUNDS = 12;

// ─── Step 1: Register profile (credentials + personal info) ─────────────────

/**
 * Create a new Profile record.
 * Required: email, username, password
 * All other profile fields are optional.
 */
const registerProfile = async ({
  // credentials (required)
  email,
  username,
  password,
  role,
  // personal info
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
