const prisma = require("../config/db");
const { uploadBookingSlip } = require("./storageService");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hasNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

const isValidDecimal = (value) => {
  return typeof value === "number" && value > 0 && !isNaN(value);
};

const isValidDate = (value) => {
  const date = new Date(value);
  return date instanceof Date && !isNaN(date.getTime());
};

// ─── Create Booking ──────────────────────────────────────────────────────────

/**
 * Create a new Booking record with full validation
 * Required: userId, sessionId, amount, transferDate, transferTime, slipFile,
 *           refundBankName, refundBankNumber, refundAccountName
 * slipFile: multer file object (required)
 * Status defaults to "pending"
 */
const createBooking = async ({
  userId,
  sessionId,
  amount,
  transferDate,
  transferTime,
  slipFile,
  refundBankName,
  refundBankNumber,
  refundAccountName,
}) => {
  // Validate amount
  if (!isValidDecimal(amount)) {
    const err = new Error("amount must be a positive number");
    err.statusCode = 400;
    throw err;
  }

  // Validate transfer dates and times
  if (!isValidDate(transferDate) || !isValidDate(transferTime)) {
    const err = new Error("transferDate and transferTime must be valid dates");
    err.statusCode = 400;
    throw err;
  }

  // Validate slipFile
  if (!slipFile) {
    const err = new Error("slipFile is required");
    err.statusCode = 400;
    throw err;
  }

  // Validate refund bank details
  if (!hasNonEmptyString(refundBankName)) {
    const err = new Error("refundBankName is required");
    err.statusCode = 400;
    throw err;
  }

  if (!hasNonEmptyString(refundBankNumber)) {
    const err = new Error("refundBankNumber is required");
    err.statusCode = 400;
    throw err;
  }

  if (!hasNonEmptyString(refundAccountName)) {
    const err = new Error("refundAccountName is required");
    err.statusCode = 400;
    throw err;
  }

  try {
    // Verify user exists
    const user = await prisma.profile.findUnique({
      where: { id: userId },
    });
    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      const err = new Error("Session not found");
      err.statusCode = 404;
      throw err;
    }

    // Create booking without slip URL (will be added after file upload)
    const booking = await prisma.booking.create({
      data: {
        userId,
        sessionId,
        amount,
        transferDate: new Date(transferDate),
        transferTime: new Date(transferTime),
        refundBankName,
        refundBankNumber,
        refundAccountName,
      },
    });

    // Upload slip file and update booking with URL
    const slipUrl = await uploadBookingSlip(booking.id, slipFile);
    
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: { slipUrl },
    });

    return updatedBooking;
  } catch (err) {
    // Handle unique constraint violation
    if (err.code === "P2002") {
      const error = new Error("User has already booked this session");
      error.statusCode = 409;
      throw error;
    }

    // Re-throw known errors with status codes
    if (err.statusCode) {
      throw err;
    }

    // Handle unexpected database errors
    const error = new Error("Failed to create booking");
    error.statusCode = 500;
    error.originalError = err;
    throw error;
  }
};

module.exports = { createBooking };