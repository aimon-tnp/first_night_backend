const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const sessionRoutes = require('./sessionRoutes');

// Auth routes: /api/auth/...
router.use('/auth', authRoutes);

// Profile routes: /api/profile/...
router.use('/profile', profileRoutes);

// Session routes: /api/session/...
router.use('/session', sessionRoutes);

module.exports = router;
