const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const upload = multer();
const { authenticate, requireRole } = require('../middleware/auth');

const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');

router.post('/auth/register', upload.single('avatar'), asyncHandler(authController.register));
router.post('/auth/login', asyncHandler(authController.login));
router.post('/auth/logout', authenticate, asyncHandler(authController.logout));
router.get('/auth/me', authenticate, asyncHandler(authController.getMe));

module.exports = router;