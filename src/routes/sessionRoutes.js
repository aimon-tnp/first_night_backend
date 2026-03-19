const express = require('express');
const router = express.Router();

const { createSession, uploadSessionImageHandler, updateSession, deleteSession } = require('../controllers/sessionController');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../utils/upload');

router.post('/', protect, adminOnly, createSession);
router.post('/:sessionId/images', protect, adminOnly, upload.array('image', 5), uploadSessionImageHandler); // at most 5 images at once

router.patch('/:sessionId', protect, adminOnly, updateSession);

router.delete('/:sessionId', protect, adminOnly, deleteSession);

module.exports = router;
