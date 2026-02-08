const prisma = require('../config/db');
const jwt = require('jsonwebtoken');
const { hashPassword, verifyPassword } = require('../utils/password');

const JWT_SECRET = process.env.JWT_SECRET || 'asdfghjkl;;lkjhgfdsa';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

async function register(req, res, next) {
    try {
        const {
            username,
            email,
            password,
            name,
            nickname,
            gender,
            birthday,
            telephone,
            instagram,
            university,
            faculty,
            uniYear,
            personality,
            hobbies,
            quote,
            loveLangExpress,
            loveLangReceive,
            personalityPreference,
            agePreference,
            emergencyName,
            emergencyRelationship,
            emergencyTelephone,
            allergies,
            medications
        } = req.body;

        // Validate
        const required = [
            'username', 'email', 'password', 'name', 'nickname', 'gender', 'birthday',
            'telephone', 'university', 'faculty', 'uniYear', 'personality', 'hobbies',
            'loveLangExpress', 'loveLangReceive', 'personalityPreference', 'agePreference'
        ];

        const missing = required.filter((k) => {
            const v = req.body[k];
            if (v === undefined || v === null) return true;
            if (typeof v === 'string' && v.trim() === '') return true;
            if (Array.isArray(v) && v.length === 0) return true;

            return false;
        });

        if (missing.length) return res.status(400).json({ error: `missing required fields: ${missing.join(', ')}` });

        if (isNaN(Date.parse(birthday))) return res.status(400).json({ error: 'invalid birthday (expected YYYY-MM-DD)' });

        const passwordHash = await hashPassword(password);

        const toArray = (v) => {
            if (!v) return [];
            if (Array.isArray(v)) return v;
            if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
            return [];
        };

        const user = await prisma.profile.create({
            data: {
                email,
                username,
                name,
                nickname,
                gender,
                birthday: new Date(birthday),
                telephone,
                instagram: instagram || null,
                university,
                faculty,
                uniYear: parseInt(uniYear, 10),
                personality,
                hobbies: toArray(hobbies),
                quote: quote || null,
                passwordHash,
                role: 'USER',
                loveLangExpress: toArray(loveLangExpress),
                loveLangReceive,
                personalityPreference,
                agePreference,
                emergencyName: emergencyName || null,
                emergencyRelationship: emergencyRelationship || null,
                emergencyTelephone: emergencyTelephone || null,
                allergies: allergies || null,
                medications: medications || null
            }
        });

        const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        // Forward to centralized error handler to map Prisma errors and avoid crashing
        return next(err);
    }
}

async function login(req, res, next) {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'username and password are required' });

        const user = await prisma.profile.findUnique({ where: { username } });
        if (!user) return res.status(401).json({ error: 'invalid credentials' });

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'invalid credentials' });

        const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        res.json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
    } catch (err) {
        console.error(err);
        return next(err);
    }
}

module.exports = { register, login };
