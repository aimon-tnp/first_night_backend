const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');

router.post('/auth/register', asyncHandler(authController.register));
router.post('/auth/login', asyncHandler(authController.login));

module.exports = router;