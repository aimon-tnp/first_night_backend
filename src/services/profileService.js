const prisma = require('../config/db');

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

/**
 * Update profile emergency and medical information
 */
const updateProfileInfo = async (profileId, {
  emergencyName,
  emergencyRelationship,
  emergencyTelephone,
  allergies,
  medications,
  instagram,
  telephone,
}) => {
  const updateData = {};

  if (emergencyName !== undefined) updateData.emergencyName = emergencyName;
  if (emergencyRelationship !== undefined) updateData.emergencyRelationship = emergencyRelationship;
  if (emergencyTelephone !== undefined) updateData.emergencyTelephone = emergencyTelephone;
  if (allergies !== undefined) updateData.allergies = allergies;
  if (medications !== undefined) updateData.medications = medications;
  if (instagram !== undefined) updateData.instagram = instagram;
  if (telephone !== undefined) updateData.telephone = telephone;

  if (Object.keys(updateData).length === 0) {
    const err = new Error('At least one field is required');
    err.statusCode = 400;
    throw err;
  }

  try {
    const profile = await prisma.profile.update({
      where: { id: profileId },
      data: updateData,
      select: {
        id: true,
        emergencyName: true,
        emergencyRelationship: true,
        emergencyTelephone: true,
        allergies: true,
        medications: true,
        instagram: true,
        telephone: true,
      },
    });

    return profile;
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error('Profile not found');
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }
};

/**
 * Update user preferences
 */
const updateUserPreferences = async (profileId, {
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
  faceType,
  faceTypePreference,
}) => {
  const updateData = {};

  // Optional scalar field
  if (quote !== undefined) updateData.quote = quote;

  // Validate and add required scalar fields
  const requiredScalarFields = {
    personality,
    personalityPreference,
    agePreference,
    loveLangExpress,
    loveLangReceive,
  };

  const providedScalarFields = Object.entries(requiredScalarFields)
    .filter(([, value]) => value !== undefined);

  const invalidScalarFields = providedScalarFields
    .filter(([, value]) => !hasNonEmptyString(value))
    .map(([key]) => key);

  if (invalidScalarFields.length > 0) {
    const err = new Error('Scalar fields must be non-empty strings');
    err.statusCode = 400;
    err.invalidFields = invalidScalarFields;
    throw err;
  }

  if (personality !== undefined) updateData.personality = personality;
  if (personalityPreference !== undefined) updateData.personalityPreference = personalityPreference;
  if (agePreference !== undefined) updateData.agePreference = agePreference;
  if (loveLangExpress !== undefined) updateData.loveLangExpress = loveLangExpress;
  if (loveLangReceive !== undefined) updateData.loveLangReceive = loveLangReceive;

  // Validate and add array fields
  const arrayFields = {
    hobbies,
    fashionStyle,
    fashionPreference,
    characteristics,
    characteristicPreference,
    faceType,
    faceTypePreference,
  };

  const providedArrayFields = Object.entries(arrayFields)
    .filter(([, value]) => value !== undefined);

  const invalidArrayFields = providedArrayFields
    .filter(([, value]) => !isValidPreferenceArray(value))
    .map(([key]) => key);

  if (invalidArrayFields.length > 0) {
    const err = new Error('Array fields must contain 1 to 3 non-empty items');
    err.statusCode = 400;
    err.invalidFields = invalidArrayFields;
    throw err;
  }

  if (hobbies !== undefined) updateData.hobbies = hobbies;
  if (fashionStyle !== undefined) updateData.fashionStyle = fashionStyle;
  if (fashionPreference !== undefined) updateData.fashionPreference = fashionPreference;
  if (characteristics !== undefined) updateData.characteristics = characteristics;
  if (characteristicPreference !== undefined) updateData.characteristicPreference = characteristicPreference;
  if (faceType !== undefined) updateData.faceType = faceType;
  if (faceTypePreference !== undefined) updateData.faceTypePreference = faceTypePreference;

  if (Object.keys(updateData).length === 0) {
    const err = new Error('At least one preferences field is required');
    err.statusCode = 400;
    throw err;
  }

  try {
    const preferences = await prisma.preferences.update({
      where: { profileId },
      data: updateData,
    });

    return preferences;
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error('Preferences not found for this profile');
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }
};

const deleteProfile = async (profileId) => {
  try {
    await prisma.profile.delete({
      where: { id: profileId },
    });
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error('Profile not found');
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }
};

const getProfile = async (profileId) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        preferences: true,
      },
    });

    if (!profile) {
      const err = new Error('Profile not found');
      err.statusCode = 404;
      throw err;
    }

    return profile;
  } catch (err) {
    if (err.code === 'P2025' || err.statusCode === 404) {
      const error = new Error('Profile not found');
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }
};

module.exports = { updateProfileInfo, updateUserPreferences, deleteProfile, getProfile };
