const prisma = require('../config/db');

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
}) => {
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

const getOwnProfile = async (profileId) => {
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
};


module.exports = { updateProfileInfo, updateUserPreferences, deleteProfile, getOwnProfile };
