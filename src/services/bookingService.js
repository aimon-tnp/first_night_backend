const prisma = require("../config/db");
const { uploadBookingSlip } = require("./storageService");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hasNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};

const isValidDecimal = (value) => {
  return typeof value === "number" && value > 0 && !isNaN(value);
};

/**
 * Parse date string (DD/MM/YYYY) and time string (HH:MM) into a single DateTime
 */
const parseTransferDateTime = (dateStr, timeStr) => {
  if (!hasNonEmptyString(dateStr) || !hasNonEmptyString(timeStr)) {
    throw new Error("transferDate and transferTime are required");
  }

  // Parse date
  const dateParts = dateStr.split("/");
  if (dateParts.length !== 3) {
    throw new Error("transferDate must be in DD/MM/YYYY format");
  }

  const [day, month, year] = dateParts.map((p) => parseInt(p, 10));

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    throw new Error("transferDate must be in DD/MM/YYYY format");
  }

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    throw new Error("Invalid date values");
  }

  // Parse time
  const timeParts = timeStr.split(":");
  if (timeParts.length !== 2) {
    throw new Error("transferTime must be in HH:MM format");
  }

  const [hours, minutes] = timeParts.map((p) => parseInt(p, 10));

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error("transferTime must be in HH:MM format");
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error("Invalid time values (hours: 0-23, minutes: 0-59)");
  }

  // Create combined DateTime
  const dateTime = new Date(year, month - 1, day, hours, minutes, 0);

  // Validate that the date is valid (e.g., no Feb 30)
  if (
    dateTime.getDate() !== day ||
    dateTime.getMonth() !== month - 1 ||
    dateTime.getFullYear() !== year
  ) {
    throw new Error("Invalid date");
  }

  return dateTime;
};

// ─── Create Booking ──────────────────────────────────────────────────────────

/**
 * Create a new Booking record with full validation
 * transferDate: string in DD/MM/YYYY format
 * transferTime: string in HH:MM format (24-hour)
 * slipFile: multer file object
 * status: defaults to "pending"
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

  // Validate and combine transfer date and time
  let transferDateTime;
  try {
    transferDateTime = parseTransferDateTime(transferDate, transferTime);
  } catch (err) {
    const error = new Error(err.message);
    error.statusCode = 400;
    throw error;
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
        transferDateTime,
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
