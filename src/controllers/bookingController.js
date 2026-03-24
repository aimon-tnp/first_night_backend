const prisma = require("../config/db");
const bookingService = require("../services/bookingService");

// ─── POST /api/sessions/:sessionId/bookings ──────────────────────────────────
// Expects: multipart/form-data with field name "slip" and booking data in body
const createBooking = async (req, res, next) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: 'No slip file provided. Send an image in the "slip" field.' });
    }

    const { sessionId } = req.params;
    const {
      amount,
      transferDate, // DD/MM/YYYY
      transferTime, // HH:mm (24-hour)
      refundBankName,
      refundBankNumber,
      refundAccountName,
    } = req.body;

    const profile = await prisma.profile.findUnique({
      where: { id: req.user.id },
      include: { preferences: true },
    });

    // User has created preferences + uploaded avatar pic
    if (!profile.avatarUrl) {
      return res.status(400).json({
        success: false,
        message: "Profile is incomplete. Please upload a profile picture first.",
      });
    }
    if (!profile.preferences) {
      return res.status(400).json({
        success: false,
        message: "Profile is incomplete. Please set up your preferences first.",
      });
    }

    const booking = await bookingService.createBooking({
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

module.exports = { createBooking };
