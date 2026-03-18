const express = require('express');
const multer = require('multer');
const router = express.Router();

const { createSession, uploadSessionImageHandler } = require('../controllers/sessionController');
const { protect, adminOnly } = require('../middleware/auth');

// Multer setup - keep file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max for session images
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
});

// POST /api/session (Admin Only)
router.post('/', protect, adminOnly, createSession);

// POST /api/session/:sessionId/images (Admin Only)
router.post('/:sessionId/images', protect, adminOnly, upload.array('image', 5), uploadSessionImageHandler);

module.exports = router;
