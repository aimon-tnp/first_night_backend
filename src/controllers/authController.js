const prisma = require('../config/db');
const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const { hashPassword, verifyPassword } = require('../utils/password');

const JWT_SECRET = process.env.JWT_SECRET || 'asdfghjkl;;lkjhgfdsa';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

const toArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
    return [];
};

async function register(req, res, next) {
    try {
        const {
            username, email, password, name, nickname, gender, birthday,
            telephone, instagram, university, faculty, uniYear,
            personality, hobbies, quote, loveLangExpress, loveLangReceive,
            personalityPreference, agePreference, appearancePreference,
            emergencyName, emergencyRelationship, emergencyTelephone,
            allergies, medications
        } = req.body;

        const required = [
            'username', 'email', 'password', 'name', 'nickname', 'gender', 'birthday',
            'telephone', 'university', 'faculty', 'uniYear', 'personality', 'hobbies',
            'loveLangExpress', 'loveLangReceive', 'personalityPreference', 'agePreference'
        ];

        const missing = required.filter((k) => {
            const v = req.body[k];
            if (v === undefined || v === null) return true;

            if (typeof v === 'string' && v.trim() === '') return true;

            return false;
        });

        if (missing.length) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

        if (isNaN(Date.parse(birthday))) return res.status(400).json({ error: 'Invalid birthday (expected YYYY-MM-DD)' });

        if (isNaN(parseInt(uniYear, 10))) return res.status(400).json({ error: 'Invalid uniYear (expected number)' });

        const passwordHash = await hashPassword(password);

        let finalAvatarUrl = null;

        // Scenario A: Client sent a direct path (already uploaded)
        if (req.body.avatarPath && typeof req.body.avatarPath === 'string' && req.body.avatarPath.trim()) {
            finalAvatarUrl = req.body.avatarPath;
        } 
        // Scenario B: Server-side file upload (Multipart Form)
        else if (req.file && req.file.buffer) {
            const file = req.file;
            const safeUsername = username.replace(/[^a-zA-Z0-9]/g, '_');
            const ext = (file.mimetype && file.mimetype.split('/')[1]) || 'jpg';
            const path = `avatars/${safeUsername}_${Date.now()}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, file.buffer, { 
                    contentType: file.mimetype,
                    upsert: true 
                });

            if (uploadError) {
                console.error("SUPABASE UPLOAD ERROR DETAILS:", uploadError); 

                const e = new Error('Avatar upload failed');
                e.cause = uploadError;
                throw e;
            }

            // FIX: Get Public URL correctly
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(path);
                
            finalAvatarUrl = urlData.publicUrl;
        }

        const user = await prisma.profile.create({
            data: {
                email,
                username,
                passwordHash,
                role: 'USER',

                name,
                nickname,
                gender,
                birthday: new Date(birthday),
                telephone,
                instagram: instagram || null,
                
                avatarUrl: finalAvatarUrl, 

                university,
                faculty,
                uniYear: parseInt(uniYear, 10),

                personality,
                hobbies: toArray(hobbies),
                quote: quote || null,

                loveLangExpress: toArray(loveLangExpress),
                loveLangReceive,
                personalityPreference,
                agePreference,
                appearancePreference: appearancePreference || null,

                emergencyName: emergencyName || null,
                emergencyRelationship: emergencyRelationship || null,
                emergencyTelephone: emergencyTelephone || null,
                allergies: allergies || null,
                medications: medications || null
            }
        });

        const token = jwt.sign(
            { sub: user.id, role: user.role, username: user.username },
            JWT_SECRET, 
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({ 
            success: true,
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                username: user.username, 
                role: user.role, 
                avatarUrl: user.avatarUrl 
            } 
        });

    } catch (err) {
        if (err.code === 'P2002') {
            const target = err.meta ? err.meta.target : 'field';
            return res.status(409).json({ error: `User with this ${target} already exists.` });
        }

        if (err.constructor.name === 'PrismaClientValidationError') {
            console.error("Validation Error Details:", err.message);
            return res.status(400).json({ error: 'Invalid input data' });
        }
        
        return next(err);
    }
}

async function login(req, res, next) {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

        const user = await prisma.profile.findUnique({ where: { username } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { sub: user.id, role: user.role, username: user.username }, 
            JWT_SECRET, 
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({ 
            success: true,
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                username: user.username, 
                role: user.role, 
                avatarUrl: user.avatarUrl 
            } 
        });
    } catch (err) {
        console.error("Login Error:", err);
        return next(err);
    }
}

async function logout(req, res, next) {
    try {
        res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' });
        return res.json({ success: true, message: 'Logged out' });
    } catch (err) {
        console.error('Logout Error:', err);
        return next(err);
    }
}

async function getMe(req, res, next) {
    try {
        const username = req.user.username;

        const user = await prisma.profile.findUnique({
            where: { username },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                name: true,
                nickname: true,
                avatarUrl: true
            }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        return res.json({ success: true, user });
    } catch (err) {
        console.error('Get Me Error:', err);
        return next(err);
    }
    
}

module.exports = { register, login, logout, getMe };