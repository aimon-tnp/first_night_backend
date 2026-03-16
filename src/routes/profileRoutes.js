const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const {
	upload,
	uploadAvatarHandler,
	getMe,
	updateProfile,
	updatePreferences,
} = require('../controllers/profileController');

// GET /api/profile/me
router.get('/me', protect, getMe);

// PATCH /api/profile/medical-emergency
router.patch('/medical-emergency', protect, updateProfile);

// PATCH /api/profile/preferences
router.patch('/preferences', protect, updatePreferences);

// POST /api/profile/avatar
// multipart/form-data, field: "avatar"
router.post('/avatar', protect, upload.single('avatar'), uploadAvatarHandler);

module.exports = router;
