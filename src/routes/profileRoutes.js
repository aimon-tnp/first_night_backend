const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { upload, uploadAvatarHandler, getMe } = require('../controllers/profileController');

// GET /api/profile/me
router.get('/me', protect, getMe);

// POST /api/profile/avatar
// multipart/form-data, field: "avatar"
router.post('/avatar', protect, upload.single('avatar'), uploadAvatarHandler);

module.exports = router;
