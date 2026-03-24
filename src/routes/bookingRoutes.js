const express = require("express");
const router = express.Router({ mergeParams: true }); // Important: merge params from parent router

const { createBooking } = require("../controllers/bookingController");
const { protect } = require("../middleware/auth");
const { upload } = require("../utils/upload");

// POST /api/sessions/:sessionId/bookings - Create booking for a session
router.post("/", protect, upload.single("slip"), createBooking);

module.exports = router;
