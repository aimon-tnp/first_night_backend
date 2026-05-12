const prisma = require('../config/db');
const { batchMatch } = require('../services/matchingService');

/**
 * POST /api/sessions/{sessionId}/matches
 * Admin-only: Batch create matches for a session
 * 
 * Prerequisites:
 * - All participants must have confirmed bookings
 * - All must have completed profile + preferences
 * - Admin should hand-pick down to desired participant count before calling
 */
const createBatchMatches = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    // Verify session exists and get capacity
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, capacity: true, name: true },
    });

    if (!session) {
      const err = new Error('Session not found');
      err.statusCode = 404;
      throw err;
    }

    // Validate capacity: must be even number (for equal male/female split)
    if (session.capacity % 2 !== 0) {
      return res.status(400).json({
        success: false,
        message: `Session capacity (${session.capacity}) must be an even number for matching`,
      });
    }

    const requiredPerGender = session.capacity / 2;

    // Count confirmed bookings by gender
    const maleCount = await prisma.booking.count({
      where: {
        sessionId,
        status: 'confirmed',
        user: { gender: 'male' },
      },
    });

    const femaleCount = await prisma.booking.count({
      where: {
        sessionId,
        status: 'confirmed',
        user: { gender: 'female' },
      },
    });

    // Validate counts match capacity requirements
    if (maleCount !== requiredPerGender) {
      return res.status(400).json({
        success: false,
        message: `Session requires exactly ${requiredPerGender} confirmed male bookings, but found ${maleCount}`,
      });
    }

    if (femaleCount !== requiredPerGender) {
      return res.status(400).json({
        success: false,
        message: `Session requires exactly ${requiredPerGender} confirmed female bookings, but found ${femaleCount}`,
      });
    }

    // Fetch all confirmed bookings for this session with full profile + preferences
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        sessionId,
        status: 'confirmed',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            gender: true,
            birthday: true,
            preferences: {
              select: {
                personality: true,
                personalityPreference: true,
                agePreference: true,
                loveLangExpress: true,
                loveLangReceive: true,
                hobbies: true,
                fashionStyle: true,
                fashionPreference: true,
                characteristics: true,
                characteristicPreference: true,
                faceType: true,
                faceTypePreference: true,
              },
            },
          },
        },
      },
    });

    if (confirmedBookings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No confirmed bookings for this session',
      });
    }

    // Split into males and females
    const males = confirmedBookings
      .filter(b => b.user.gender === 'male')
      .map(b => b.user);
    const females = confirmedBookings
      .filter(b => b.user.gender === 'female')
      .map(b => b.user);

    // Run batch matching algorithm
    const matchPairs = await batchMatch(males, females);

    if (matchPairs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid matches could be created',
      });
    }

    // Get highest match number for this session
    const lastMatch = await prisma.match.findFirst({
      where: { sessionId },
      orderBy: { matchNumber: 'desc' },
      select: { matchNumber: true },
    });

    const nextMatchNumber = (lastMatch?.matchNumber ?? 69) + 1;

    // Create match records
    const createdMatches = [];
    for (let i = 0; i < matchPairs.length; i++) {
      const { male, female, score } = matchPairs[i];

      const match = await prisma.match.create({
        data: {
          sessionId,
          matchNumber: nextMatchNumber + i,
          maleId: male.id,
          femaleId: female.id,
          compatibilityScore: parseFloat(score.toFixed(2)),
        },
        include: {
          male: {
            select: {
              id: true,
              username: true,
              name: true,
              gender: true,
            },
          },
          female: {
            select: {
              id: true,
              username: true,
              name: true,
              gender: true,
            },
          },
        },
      });

      createdMatches.push(match);
    }

    res.status(201).json({
      success: true,
      message: `Created ${createdMatches.length} matches successfully`,
      data: {
        sessionId,
        totalMatches: createdMatches.length,
        matches: createdMatches,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBatchMatches };
