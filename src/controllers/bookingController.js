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

const updateBookingStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    const updatedBooking = await bookingService.updateBookingStatus(bookingId, status);

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: { booking: updatedBooking },
    });

  } catch (err) {
    next(err);
  }
};

// ─── GET /api/sessions/:sessionId/bookings ──────────────────────────────────
// Admin only: Get all bookings for a specific session
// Optional query params: gender (male|female), status (pending|confirmed|rejected|refunded)
const getSessionBookings = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    let { gender, status } = req.query;

    // Validate gender filter if provided
    if (gender) {
      gender = gender.toLowerCase();
      if (!['male', 'female'].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid gender filter. Valid values: male, female',
        });
      }
    }

    // Validate status filter if provided
    if (status) {
      status = status.toLowerCase();
      const validStatuses = ['pending', 'confirmed', 'rejected', 'refunded'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status filter. Valid values: ${validStatuses.join(', ')}`,
        });
      }
    }

    const bookings = await bookingService.getSessionBookings(sessionId, gender, status);

    res.status(200).json({
      success: true,
      message: "Session bookings fetched successfully",
      data: {
        total: bookings.length,
        bookings,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, updateBookingStatus, getSessionBookings };
