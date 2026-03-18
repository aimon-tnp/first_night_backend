const express = require('express');
const router = express.Router();

const { registerAdmin, registerStep1, registerStep2, login, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register/admin', registerAdmin);

router.post('/register/step1', registerStep1);
router.post('/register/step2', protect, registerStep2);

router.post('/login', login);

router.post('/logout', protect, logout);

module.exports = router;
