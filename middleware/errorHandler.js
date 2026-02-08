const { Prisma } = require('@prisma/client');

function prismaErrorToResponse(err, res) {
    // Known request errors (constraint violations, invalid enum values, etc.)
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // e.g. P2002 unique constraint, P2003 foreign key, etc.
        return res.status(400).json({ error: 'database error', code: err.code, message: err.message });
    }

    if (err instanceof Prisma.PrismaClientValidationError) {
        return res.status(400).json({ error: 'validation error', message: err.message });
    }

    // Default prisma error
    return null;
}

module.exports = function errorHandler(err, req, res, next) {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);

    // If Prisma-specific, map to 400 with details
    const prismaResp = prismaErrorToResponse(err, res);
    if (prismaResp) return prismaResp;

    if (res.headersSent) return next(err);
    res.status(err.status || 500).json({ error: err.message || 'internal server error' });
};
