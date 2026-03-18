const express = require('express');
const router = express.Router();

const { createSession } = require('../controllers/sessionController');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/session (Admin Only)
router.post('/', protect, adminOnly, createSession);

module.exports = router;
