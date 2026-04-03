const express = require("express");
const router = express.Router();

const {
  createSession,
  uploadSessionImage,
  updateSession,
  deleteSession,
  getSession,
  getAllSessions,
} = require("../controllers/sessionController");

const { protect, adminOnly } = require("../middleware/auth");
const { upload } = require("../utils/upload");
const bookingRoutes = require("./bookingRoutes");

/**
 * @swagger
 * /api/sessions:
 *   post:
 *     summary: Create a new session (Admin only)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDateTime, durationHours, location, earlyBirdPrice, regularPrice, capacity]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Session name/title
 *               description:
 *                 type: string
 *                 description: Detailed description (optional)
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: Session start date/time
 *               durationHours:
 *                 type: number
 *                 format: float
 *                 description: Duration in hours
 *               capacity:
 *                 type: integer
 *                 description: Maximum participants
 *               earlyBirdPrice:
 *                 type: number
 *                 example: 99.99
 *                 description: Early bird price
 *               regularPrice:
 *                 type: number
 *                 example: 149.99
 *                 description: Regular price
 *               location:
 *                 type: string
 *               img_url_list:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Initial session images (optional)
 *     responses:
 *       201:
 *         description: Session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       409:
 *         description: Session with the same name already exists
 */
router.post("/", protect, adminOnly, createSession);

/**
 * @swagger
 * /api/sessions:
 *   get:
 *     summary: Get all sessions
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to retrieve sessions
 */
router.get("/", protect, getAllSessions);

/**
 * @swagger
 * /api/sessions/{sessionId}:
 *   get:
 *     summary: Get a specific session
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Session details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 */
router.get("/:sessionId", protect, getSession);

/**
 * @swagger
 * /api/sessions/{sessionId}:
 *   patch:
 *     summary: Update session (Admin only)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDateTime:
 *                 type: string
 *                 format: date-time
 *               durationHours:
 *                 type: number
 *                 format: float
 *               capacity:
 *                 type: integer
 *               earlyBirdPrice:
 *                 type: number
 *               regularPrice:
 *                 type: number
 *               location:
 *                 type: string
 *               img_url_list:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Session updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Session not found
 */
router.patch("/:sessionId", protect, adminOnly, updateSession);

/**
 * @swagger
 * /api/sessions/{sessionId}:
 *   delete:
 *     summary: Delete session (Admin only)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Session deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Session not found
 */
router.delete("/:sessionId", protect, adminOnly, deleteSession);

/**
 * @swagger
 * /api/sessions/{sessionId}/images:
 *   post:
 *     summary: Upload session images (Admin only, max 5)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 5
 *                 description: Session images (up to 5)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: No files provided or too many files (max 5)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Session not found
 *       500:
 *         description: Database or storage error during image upload
 */
router.post(
  "/:sessionId/images",
  protect,
  adminOnly,
  upload.array("image", 5),
  uploadSessionImage,
);

// Nested: /api/sessions/:sessionId/bookings
router.use("/:sessionId/bookings", bookingRoutes);

module.exports = router;
