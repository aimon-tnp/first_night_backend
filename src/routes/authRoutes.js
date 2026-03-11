const express = require('express');
const router = express.Router();

const { registerStep1, registerStep2, login, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Registration — two-step flow
// Step 1: create profile (no auth required)
router.post('/register/step1', registerStep1);

// Step 2: create preferences (requires JWT from step 1)
router.post('/register/step2', protect, registerStep2);

// Login
router.post('/login', login);

// Logout (requires a valid token so we can confirm identity; stateless)
router.post('/logout', protect, logout);

module.exports = router;
