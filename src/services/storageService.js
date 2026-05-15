const supabase = require('../config/supabase');
const prisma = require('../config/db');

const AVATARS_BUCKET = 'avatars';
const SESSIONS_BUCKET = 'sessions';
const BOOKING_SLIPS_BUCKET = 'booking-slips';
const PHOTO_STORIES_BUCKET = 'photo-stories';

/**
 * Upload an avatar file to Supabase Storage and save the public URL on the profile.
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
  try {
    await prisma.profile.update({
      where: { id: profileId },
      data: { avatarUrl },
    });
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error('Profile not found');
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }

  return avatarUrl;
};

/**
 * Upload a session image to Supabase Storage and return the public URL.
 * Appends the URL to the session's img_url_list.
 */
const uploadSessionImage = async (sessionId, file) => {
  // Verify session exists
  let session;
  try {
    session = await prisma.session.findUnique({ where: { id: sessionId } });
  } catch (err) {
    const error = new Error('Database error while verifying session');
    error.statusCode = 500;
    throw error;
  }

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
  let updatedSession;
  try {
    updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        img_url_list: {
          push: imageUrl,
        },
      },
    });
  } catch (err) {
    if (err.code === 'P2025') {
      const error = new Error('Session not found');
      error.statusCode = 404;
      throw error;
    }
    throw err;
  }

  const maxImages = 5;
  if (updatedSession.img_url_list.length > maxImages) {

    const oldestImageUrl = updatedSession.img_url_list[0];
    const newImageList = updatedSession.img_url_list.slice(1);

    // Extract path from the public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const pathMatch = oldestImageUrl.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
    if (pathMatch && pathMatch[1]) {
      const filePath = decodeURIComponent(pathMatch[1]);
      
      // Delete old file from storage
      const { error: deleteError } = await supabase.storage
        .from(SESSIONS_BUCKET)
        .remove([filePath]);

      if (deleteError) {
        console.warn(`Failed to delete old session image: ${deleteError.message}`);
      } else {
        console.log(`Deleted old session image: ${filePath}`);
      }
    }

    // Update session with new image list
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          img_url_list: newImageList,
        },
      });
    } catch (err) {
      if (err.code === 'P2025') {
        const error = new Error('Session not found');
        error.statusCode = 404;
        throw error;
      }
      throw err;
    }
  }

  return imageUrl;
};

/**
 * Upload a booking slip file to Supabase Storage and return the public URL.
 */
const uploadBookingSlip = async (bookingId, file) => {
  if (!file) {
    const err = new Error('File is required');
    err.statusCode = 400;
    throw err;
  }

  const ext = file.originalname.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const path = `${bookingId}/${timestamp}.${ext}`;

  // Upload to booking-slips bucket
  const { error: uploadError } = await supabase.storage
    .from(BOOKING_SLIPS_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) {
    const err = new Error(`Storage upload failed: ${uploadError.message}`);
    err.statusCode = 500;
    throw err;
  }

  // Get public URL
  const { data } = supabase.storage.from(BOOKING_SLIPS_BUCKET).getPublicUrl(path);
  const slipUrl = data.publicUrl;

  return slipUrl;
};

/**
 * Upload a photo story file to Supabase Storage and return the public URL.
 */
const uploadPhotoStory = async (userId, sessionId, file) => {
  if (!file) {
    const err = new Error('File is required');
    err.statusCode = 400;
    throw err;
  }

  const ext = file.originalname.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const path = `${userId}/${sessionId}/${timestamp}.${ext}`;

  // Upload to photo-stories bucket
  const { error: uploadError } = await supabase.storage
    .from(PHOTO_STORIES_BUCKET)
    .upload(path, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) {
    const err = new Error(`Storage upload failed: ${uploadError.message}`);
    err.statusCode = 500;
    throw err;
  }

  // Get public URL
  const { data } = supabase.storage.from(PHOTO_STORIES_BUCKET).getPublicUrl(path);
  const photoUrl = data.publicUrl;

  return photoUrl;
};

/**
 * Delete a photo story file from Supabase Storage.
 * Extracts the file path from the public URL and removes it.
 */
const deletePhotoStory = async (photoUrl) => {
  if (!photoUrl) {
    return; // No file to delete
  }

  try {
    // Extract path from the public URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const pathMatch = photoUrl.match(/\/storage\/v1\/object\/public\/[^\/]+\/(.+)$/);
    if (pathMatch && pathMatch[1]) {
      const filePath = decodeURIComponent(pathMatch[1]);

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from(PHOTO_STORIES_BUCKET)
        .remove([filePath]);

      if (deleteError) {
        console.warn(`Failed to delete photo story: ${deleteError.message}`);
      } else {
        console.log(`Deleted photo story: ${filePath}`);
      }
    }
  } catch (err) {
    console.warn(`Error deleting photo story file: ${err.message}`);
  }
};

module.exports = { uploadAvatar, uploadSessionImage, uploadBookingSlip, uploadPhotoStory, deletePhotoStory };
