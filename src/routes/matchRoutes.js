const express = require('express');
const router = express.Router({ mergeParams: true });

const { createBatchMatches } = require('../controllers/matchingController');
const { protect, adminOnly } = require('../middleware/auth');

/**
 * @swagger
 * /api/sessions/{sessionId}/matches:
 *   post:
 *     summary: Create batch matches for a session (Admin only)
 *     description: |
 *       Runs the matching algorithm to create optimal pairings between males and females.
 *       
 *       Prerequisites:
 *       - All participants must have status "confirmed" in bookings
 *       - All must have complete profiles + preferences
 *       - Admin should hand-select participants down to desired count before calling
 *       
 *       Algorithm:
 *       - Scores pairs on: personality (20), age (25), love language (12), hobbies (13), 
 *         fashion style (10), characteristics (10), face type (10)
 *       - Applies age preferences as hard filter first
 *       - Relaxes age filter if insufficient matches
 *       - Uses assignment algorithm for optimal pairing
 *       - Creates match records with sequential numbers (70, 71, ...)
 *     tags: [Matches]
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
 *       201:
 *         description: Batch matches created successfully
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
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                       format: uuid
 *                     totalMatches:
 *                       type: integer
 *                     matches:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           matchNumber:
 *                             type: integer
 *                           compatibilityScore:
 *                             type: number
 *                           male:
 *                             type: object
 *                           female:
 *                             type: object
 *       400:
 *         description: Invalid input or insufficient participants
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Session not found
 *       500:
 *         description: Matching algorithm failed
 */
router.post('/', protect, adminOnly, createBatchMatches);

module.exports = router;
