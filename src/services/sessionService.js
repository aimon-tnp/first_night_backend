const prisma = require("../config/db");

const hasNonEmptyString = (value) => {
    return typeof value === "string" && value.trim().length > 0;
};

/**
 * Create a new session with full validation
 * Required: name, startDateTime, location, earlyBirdPrice, regularPrice, capacity
 * Optional: description, img_url_list
 */
const createSession = async ({
    name,
    description,
    startDateTime,
    location,
    durationHours,
    earlyBirdPrice,
    regularPrice,
    capacity,
    img_url_list = [],
}) => {
    // Validate required string fields
    if (!hasNonEmptyString(name)) {
        const err = new Error("name is required");
        err.statusCode = 400;
        throw err;
    }

    if (!hasNonEmptyString(location)) {
        const err = new Error("location is required");
        err.statusCode = 400;
        throw err;
    }

    // Validate numeric fields
    if (typeof durationHours !== "number" || durationHours <= 0) {
        const err = new Error("durationHours must be a positive number");
        err.statusCode = 400;
        throw err;
    }
    if (typeof earlyBirdPrice !== "number" || earlyBirdPrice < 0) {
        const err = new Error("earlyBirdPrice must be a non-negative number");
        err.statusCode = 400;
        throw err;
    }

    if (typeof regularPrice !== "number" || regularPrice < 0) {
        const err = new Error("regularPrice must be a non-negative number");
        err.statusCode = 400;
        throw err;
    }

    if (typeof capacity !== "number" || capacity < 1) {
        const err = new Error("capacity must be a positive number");
        err.statusCode = 400;
        throw err;
    }

    // Validate datetime
    const startDate = new Date(startDateTime);
    if (isNaN(startDate.getTime())) {
        const err = new Error("startDateTime must be a valid ISO 8601 datetime");
        err.statusCode = 400;
        throw err;
    }

    if (startDate < new Date()) {
        const err = new Error("startDateTime must be in the future");
        err.statusCode = 400;
        throw err;
    }

    // Validate img_url_list
    if (!Array.isArray(img_url_list)) {
        const err = new Error("img_url_list must be an array");
        err.statusCode = 400;
        throw err;
    }

    const session = await prisma.session.create({
        data: {
            name,
            description: description || null,
            startDateTime: startDate,
            durationHours,
            location,
            earlyBirdPrice,
            regularPrice,
            capacity,
            img_url_list,
        },
    });

    return session;
};

const updateSession = async (
    sessionId,
    {
        name,
        description,
        startDateTime,
        location,
        durationHours,
        earlyBirdPrice,
        regularPrice,
        capacity,
        img_url_list,
    },
) => {
    const updateData = {};

    // if present, validate and add to updateData
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (startDateTime !== undefined) {
        const startDate = new Date(startDateTime);
        if (isNaN(startDate.getTime())) {
            const err = new Error("startDateTime must be a valid ISO 8601 datetime");
            err.statusCode = 400;
            throw err;
        }
        if (startDate < new Date()) {
            const err = new Error("startDateTime must be in the future");
            err.statusCode = 400;
            throw err;
        }
        updateData.startDateTime = startDate;
    }
    if (location !== undefined) updateData.location = location;
    if (durationHours !== undefined) {
        if (typeof durationHours !== "number" || durationHours <= 0) {
            const err = new Error("durationHours must be a positive number");
            err.statusCode = 400;
            throw err;
        }
        updateData.durationHours = durationHours;
    }
    if (earlyBirdPrice !== undefined) {
        if (typeof earlyBirdPrice !== "number" || earlyBirdPrice < 0) {
            const err = new Error("earlyBirdPrice must be a non-negative number");
            err.statusCode = 400;
            throw err;
        }
        updateData.earlyBirdPrice = earlyBirdPrice;
    }
    if (regularPrice !== undefined) {
        if (typeof regularPrice !== "number" || regularPrice < 0) {
            const err = new Error("regularPrice must be a non-negative number");
            err.statusCode = 400;
            throw err;
        }
        updateData.regularPrice = regularPrice;
    }
    if (capacity !== undefined) {
        if (typeof capacity !== "number" || capacity < 1) {
            const err = new Error("capacity must be a positive number");
            err.statusCode = 400;
            throw err;
        }
        updateData.capacity = capacity;
    }
    if (img_url_list !== undefined) {
        if (!Array.isArray(img_url_list)) {
            const err = new Error("img_url_list must be an array");
            err.statusCode = 400;
            throw err;
        }
        updateData.img_url_list = img_url_list;
    }

    // At least one field must be provided
    if (Object.keys(updateData).length === 0) {
        const err = new Error("At least one field is required to update");
        err.statusCode = 400;
        throw err;
    }

    try {
        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: updateData,
        });
        return updatedSession;
    } catch (err) {
        if (err.code === "P2025") {
            const notFoundErr = new Error("Session not found");
            notFoundErr.statusCode = 404;
            throw notFoundErr;
        }
        throw err;
    }
};

const deleteSession = async (sessionId) => {
    try {
        await prisma.session.delete({
            where: { id: sessionId },
        });
    } catch (err) {
        if (err.code === "P2025") {
            const notFoundErr = new Error("Session not found");
            notFoundErr.statusCode = 404;
            throw notFoundErr;
        }
        throw err;
    }
};

module.exports = { createSession, updateSession, deleteSession };
