const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');

// Auth routes: /api/auth/...
router.use('/auth', authRoutes);

// Profile routes: /api/profile/...
router.use('/profile', profileRoutes);

module.exports = router;
