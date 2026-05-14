const express = require('express');
const router = express.Router();

const { registerAdmin, registerStep1, registerStep2, login, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/upload');

/**
 * @swagger
 * /api/auth/register/admin:
 *   post:
 *     summary: Register a new admin user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, username]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@example.com
 *               password:
 *                 type: string
 *                 description: Minimum 8 characters
 *                 example: SecurePassword123
 *               username:
 *                 type: string
 *                 example: admin_user
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid input or user already exists
 */
router.post('/register/admin', registerAdmin);

/**
 * @swagger
 * /api/auth/register/step1:
 *   post:
 *     summary: Register step 1 - Create profile with avatar
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [email, username, password, name, nickname, gender, birthday, telephone, university, faculty, uniYear, avatar]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: Minimum 8 characters
 *               name:
 *                 type: string
 *               nickname:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               birthday:
 *                 type: string
 *                 format: date
 *               telephone:
 *                 type: string
 *               instagram:
 *                 type: string
 *               university:
 *                 type: string
 *               faculty:
 *                 type: string
 *               uniYear:
 *                 type: integer
 *               emergencyName:
 *                 type: string
 *               emergencyRelationship:
 *                 type: string
 *               emergencyTelephone:
 *                 type: string
 *               allergies:
 *                 type: string
 *               medications:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (required)
 *     responses:
 *       201:
 *         description: Profile created with avatar. Proceed to step 2 to set preferences
 *       400:
 *         description: Invalid input, missing avatar, or email/username already exists
 */
router.post('/register/step1', upload.single('avatar'), registerStep1);

/**
 * @swagger
 * /api/auth/register/step2:
 *   post:
 *     summary: Register step 2 - Set preferences
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [personality, personalityPreference, agePreference, loveLangExpress, loveLangReceive, hobbies, fashionStyle, fashionPreference, characteristics, characteristicPreference, faceType, faceTypePreference]
 *             properties:
 *               quote:
 *                 type: string
 *                 description: Personal quote (optional)
 *               personality:
 *                 type: string
 *                 enum: [introvert, extrovert, ambivert]
 *               personalityPreference:
 *                 type: string
 *                 enum: [introvert, extrovert, ambivert]
 *               agePreference:
 *                 type: string
 *                 enum: [same, younger, older, no_preference]
 *               loveLangExpress:
 *                 type: string
 *               loveLangReceive:
 *                 type: string
 *               hobbies:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 3
 *               fashionStyle:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 3
 *               fashionPreference:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 3
 *               characteristics:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 3
 *               characteristicPreference:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 3
 *               faceType:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 3
 *               faceTypePreference:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 3
 *     responses:
 *       201:
 *         description: Preferences created successfully
 *       400:
 *        description: Invalid input or missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/register/step2', protect, registerStep2);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 example: SecurePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: JWT authorization token
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Missing username or password
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', protect, logout);

module.exports = router;
