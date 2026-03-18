const supabase = require('../config/supabase');
const prisma = require('../config/db');

const AVATARS_BUCKET = 'avatars';
const SESSIONS_BUCKET = 'sessions';

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
    .from(AVATARS_BUCKET)
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
  const { data } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
  const avatarUrl = data.publicUrl;

  // Persist URL on profile
  await prisma.profile.update({
    where: { id: profileId },
    data: { avatarUrl },
  });

  return avatarUrl;
};

/**
 * Upload a session image to Supabase Storage and return the public URL.
 * Appends the URL to the session's img_url_list.
 * @param {string} sessionId
 * @param {{ buffer: Buffer, mimetype: string, originalname: string }} file - from multer memoryStorage
 * @returns {string} public image URL
 */
const uploadSessionImage = async (sessionId, file) => {
  // Verify session exists
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) {
    const err = new Error('Session not found');
    err.statusCode = 404;
    throw err;
  }

  const ext = file.originalname.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const path = `${sessionId}/${timestamp}.${ext}`;

  // Upload to sessions bucket
  const { error: uploadError } = await supabase.storage
    .from(SESSIONS_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) {
    const err = new Error(`Storage upload failed: ${uploadError.message}`);
    err.statusCode = 500;
    throw err;
  }

  // Get public URL
  const { data } = supabase.storage.from(SESSIONS_BUCKET).getPublicUrl(path);
  const imageUrl = data.publicUrl;

  // Append URL to img_url_list
  const updatedSession = await prisma.session.update({
    where: { id: sessionId },
    data: {
      img_url_list: {
        push: imageUrl,
      },
    },
  });

  return imageUrl;
};

module.exports = { uploadAvatar, uploadSessionImage };
