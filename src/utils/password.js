const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

async function hashPassword(plainPassword) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(plainPassword, salt);
    return hash;
}

async function verifyPassword(plainPassword, hash) {
    if (!hash) return false;
    return bcrypt.compare(plainPassword, hash);
}

module.exports = { hashPassword, verifyPassword };
