const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const upload = multer();

const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');

router.post('/auth/register', upload.single('avatar'), asyncHandler(authController.register));
router.post('/auth/login', asyncHandler(authController.login));

module.exports = router;