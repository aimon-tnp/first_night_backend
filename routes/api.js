const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const regController = require('../controllers/registrationController');
const adminController = require('../controllers/adminController');

// 1. Auth & Profile
router.post('/register', authController.registerUser);

// 2. Booking & Payment
router.post('/book-session', regController.bookSession); // Step 1: Click "Join"
router.post('/upload-slip', regController.uploadSlip);   // Step 2: Upload Slip

// 3. Admin Actions
router.post('/admin/trigger-match', adminController.triggerMatching);

module.exports = router;