const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const profileRoutes = require('./profileRoutes');
const sessionRoutes = require('./sessionRoutes');
const bookingRoutes = require('./bookingRoutes');

// Auth routes: /api/auth/...
router.use('/auth', authRoutes);

// Profile routes: /api/profiles/...
router.use('/profiles', profileRoutes);

// Session routes: /api/sessions/... (includes nested bookings)
router.use('/sessions', sessionRoutes);

// Booking routes: /api/bookings/...
router.use('/bookings', bookingRoutes);

module.exports = router;
