const express = require("express");
const router = express.Router({ mergeParams: true }); // Important: merge params from parent router

const { createBooking, updateBookingStatus } = require("../controllers/bookingController");
const { protect, adminOnly } = require("../middleware/auth");
const { upload } = require("../utils/upload");

// POST /api/sessions/:sessionId/bookings - Create booking for a session
// Direct path are deprecated since {sessionId} is required as req.param not req.body
router.post("/", protect, upload.single("slip"), createBooking);

// PATCH /api/bookings/:bookingId/status - Update booking status
router.patch("/:bookingId/status", protect, adminOnly, updateBookingStatus);

module.exports = router;
