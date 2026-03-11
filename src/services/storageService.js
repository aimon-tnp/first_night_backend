const supabase = require('../config/supabase');
const prisma = require('../config/db');

const BUCKET = 'avatars';

/**
 * Upload an avatar file to Supabase Storage and save the public URL on the profile.
 * @param {string} profileId
 * @param {{ buffer: Buffer, mimetype: string, originalname: string }} file - from multer memoryStorage
 * @returns {string} public avatar URL
 */
const uploadAvatar = async (profileId, file) => {
  const ext = file.originalname.split('.').pop().toLowerCase();
  const path = `${profileId}.${ext}`;

  // Upload (upsert so re-uploads overwrite the old file)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadError) {
    const err = new Error(`Storage upload failed: ${uploadError.message}`);
    err.statusCode = 500;
    throw err;
  }

  // Get public URL
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const avatarUrl = data.publicUrl;

  // Persist URL on profile
  await prisma.profile.update({
    where: { id: profileId },
    data: { avatarUrl },
  });

  return avatarUrl;
};

module.exports = { uploadAvatar };
