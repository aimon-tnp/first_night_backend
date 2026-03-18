const express = require('express');
const router = express.Router();

const { createSession, uploadSessionImageHandler } = require('../controllers/sessionController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../utils/upload');

// POST /api/session (Admin Only)
router.post('/', protect, adminOnly, createSession);

// POST /api/session/:sessionId/images (Admin Only)
router.post('/:sessionId/images', protect, adminOnly, upload.array('image', 5), uploadSessionImageHandler);

module.exports = router;
