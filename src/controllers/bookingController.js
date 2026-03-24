const prisma = require("../config/db");
const { createBooking } = require("../services/bookingService");

// ─── POST /api/bookings ──────────────────────────────────────────────────────
// Expects: multipart/form-data with field name "slip" and booking data in body
const createBookingHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'No slip file provided. Send an image in the "slip" field.' });
    }

    const {
      sessionId,
      amount,
      transferDate, // DD/MM/YYYY
      transferTime, // HH:mm (24-hour)
      refundBankName,
      refundBankNumber,
      refundAccountName,
    } = req.body;

    // Verify profile is complete
    const profile = await prisma.profile.findUnique({
      where: { id: req.user.id },
      include: { preferences: true },
    });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    // Check if user has uploaded profile picture
    if (!profile.avatarUrl) {
      return res.status(400).json({
        success: false,
        message: "Profile is incomplete. Please upload a profile picture first.",
      });
    }

    // Check if user has created preferences
    if (!profile.preferences) {
      return res.status(400).json({
        success: false,
        message: "Profile is incomplete. Please set up your preferences first.",
      });
    }

    // Create booking
    const booking = await createBooking({
      userId: req.user.id,
      sessionId,
      amount: Number(amount),
      transferDate,
      transferTime,
      slipFile: req.file,
      refundBankName,
      refundBankNumber,
      refundAccountName,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBookingHandler };
