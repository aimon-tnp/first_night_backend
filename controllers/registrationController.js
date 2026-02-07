const prisma = require('../config/db');

// Step 1: User clicks "Join"
exports.bookSession = async (req, res) => {
  const { userId, sessionId } = req.body; // e.g., 'feb_2026'

  try {
    // TODO: Check if registration already exists
    const newReg = await prisma.registration.create({
      data: {
        userId,
        sessionId,
        status: 'waiting_for_slip'
      }
    });
    res.json({ success: true, registrationId: newReg.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Step 2: User uploads slip
exports.uploadSlip = async (req, res) => {
  const { 
    userId, sessionId, 
    slipUrl, amount, transferDate, transferTime,
    refundBankName, refundBankNumber, refundAccountName 
  } = req.body;

  try {
    // TODO: Validate that slipUrl is not empty
    const updatedReg = await prisma.registration.update({
      where: {
        userId_sessionId: { userId, sessionId } // Composite Unique Key
      },
      data: {
        slipUrl,
        amount,
        transferDate: new Date(transferDate),
        // TODO: Handle Time format correctly for Prisma (ISO string)
        status: 'verification_pending',
        refundBankName,
        refundBankNumber,
        refundAccountName
      }
    });

    res.json({ success: true, status: updatedReg.status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};