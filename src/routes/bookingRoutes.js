const express = require("express");
const router = express.Router({ mergeParams: true }); // Important: merge params from parent router

const { createBooking, updateBookingStatus, getSessionBookings } = require("../controllers/bookingController");
const { protect, adminOnly } = require("../middleware/auth");
const { upload } = require("../utils/upload");

/**
 * @swagger
 * /api/sessions/{sessionId}/bookings:
 *   get:
 *     summary: Get all bookings for a session (Admin only)
 *     tags: [Bookings]
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
 *         description: Session bookings fetched successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Session not found
 *       500:
 *         description: Failed to fetch session bookings
 */
router.get("/", protect, adminOnly, getSessionBookings);

/*
 * @swagger
 * /api/sessions/{sessionId}/bookings:
 *   post:
 *     summary: Create a booking for a session
 *     tags: [Bookings]
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
 *               amount:
 *                 type: number
 *                 example: 149.99
 *                 description: Payment amount
 *               transferDateTime:
 *                 type: string
 *                 format: date-time
 *                 description: When payment was made
 *               refundBankName:
 *                 type: string
 *                 description: Bank name for refund
 *               refundBankNumber:
 *                 type: string
 *                 description: Bank account number for refund
 *               refundAccountName:
 *                 type: string
 *                 description: Account name for refund
 *               slip:
 *                 type: string
 *                 format: binary
 *                 description: Payment receipt/slip image
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: No slip file provided or profile incomplete (avatar or preferences missing) || Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Session not found
 *       409:
 *         description: User has already booked this session
 *       500:
 *         description: Failed to create booking
 */
router.post("/", protect, upload.single("slip"), createBooking);

/**
 * @swagger
 * /api/bookings/{bookingId}/status:
 *   patch:
 *     summary: Update booking status (Admin only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
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
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, rejected, refunded]
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Failed to update booking status
 */
router.patch("/:bookingId/status", protect, adminOnly, updateBookingStatus);

module.exports = router;
