const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/auth");
const {
  uploadAvatar,
  getMe,
  updateProfile,
  updatePreferences,
  deleteProfile,
} = require("../controllers/profileController");

const { upload } = require("../utils/upload");

/**
 * @swagger
 * /api/profiles/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get("/me", protect, getMe);

/**
 * @swagger
 * /api/profiles/credentials:
 *   patch:
 *     summary: Update emergency contact and medical information
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *               instagram:
 *                 type: string
 *               telephone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid input or missing required fields
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.patch("/credentials", protect, updateProfile);

/**
 * @swagger
 * /api/profiles/preferences:
 *   patch:
 *     summary: Update user preferences
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Preferences'
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Preferences'
 *       401:
 *         description: Unauthorized
 */
router.patch("/preferences", protect, updatePreferences);

/**
 * @swagger
 * /api/profiles/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Invalid file
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Storage upload failed
 */
router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);

/**
 * @swagger
 * /api/profiles:
 *   delete:
 *     summary: Delete current user profile
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.delete("/", protect, deleteProfile);

/**
 * @swagger
 * /api/profiles/{profileId}:
 *   delete:
 *     summary: Delete user profile by ID (Admin only)
 *     tags: [Profiles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *        description: Profile not found
 */
router.delete("/:profileId", protect, deleteProfile);

module.exports = router;
