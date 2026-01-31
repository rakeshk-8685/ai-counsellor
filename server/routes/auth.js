const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_prototype';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
        // hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // insert user
        const result = await db.query(
            'INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, full_name, email, role',
            [fullName, email, hash, 'student', true] // FORCE STUDENT ROLE & ACTIVE
        );

        const user = result.rows[0];

        // create token
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

        // Initialize User Progress (Strict Flow)
        await db.query(
            "INSERT INTO user_progress (user_id, onboarding_completed, current_stage) VALUES ($1, FALSE, 1)",
            [user.id]
        );

        res.status(201).json({
            user: { ...user, progress: { onboarding_completed: false, current_stage: 1 } },
            token
        });

    } catch (err) {
        console.error(err);
        if (err.constraint === 'users_email_key' || err.message.includes('unique')) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/firebase-sync
router.post('/firebase-sync', async (req, res) => {
    const { uid, email, fullName } = req.body;

    try {
        // Check if user exists
        let result = await db.query('SELECT * FROM users WHERE id = $1', [uid]);
        let user = result.rows[0];

        if (!user) {
            try {
                // Conflict Check: Does email exist with different ID? (e.g. Seeded Admin)
                const existingRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
                if (existingRes.rows.length > 0) {
                    console.log(`Replacing seeded user ${email} with Firebase User`);
                    await db.query('DELETE FROM users WHERE email = $1', [email]);
                }

                // Create new user with Firebase UID
                // Auto-Promote Admins
                let role = 'student';
                if (email === 'uni@admin.com') role = 'university_admin';
                if (email === 'super@admin.com') role = 'super_admin';

                const insertRes = await db.query(
                    `INSERT INTO users (id, full_name, email, password_hash, role, is_active) 
                     VALUES ($1, $2, $3, 'firebase-managed', $4, true) 
                     RETURNING id, full_name, email, role`,
                    [uid, fullName || 'User', email, role]
                );
                user = insertRes.rows[0];

                // Initialize Progress
                await db.query(
                    "INSERT INTO user_progress (user_id, onboarding_completed, current_stage) VALUES ($1, FALSE, 1) ON CONFLICT (user_id) DO NOTHING",
                    [user.id]
                );
            } catch (err) {
                if (err.code === '23505') { // Unique Violation (Race Condition)
                    console.log("⚠️ Race Condition detected in Sync. Recovering...");
                    // Fetch the user that beat us to the insert
                    const retryRes = await db.query('SELECT * FROM users WHERE id = $1', [uid]);
                    user = retryRes.rows[0];
                    if (!user) throw err; // If still missing, real error
                } else {
                    throw err; // Other errors mismatch
                }
            }
        }

        // Fetch User Progress
        const progressRes = await db.query('SELECT * FROM user_progress WHERE user_id = $1', [user.id]);
        let progress = progressRes.rows[0];

        // Ensure progress exists (for legacy/edge cases)
        if (!progress) {
            // Upsert Progress safe
            const newProgress = await db.query(
                `INSERT INTO user_progress (user_id, onboarding_completed, current_stage) 
                 VALUES ($1, FALSE, 1) 
                 ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
                 RETURNING *`,
                [user.id]
            );
            progress = newProgress.rows[0];
        }

        res.json({
            user: { ...user, progress }
        });

    } catch (err) {
        console.error("Sync Error:", err);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// POST /api/auth/login (Legacy/Hybrid)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        // If user is firebase-managed, they can't login with password here unless we set one.
        if (user.password_hash === 'firebase-managed') {
            return res.status(400).json({ error: 'Please login via Social/Firebase' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is disabled. Contact support.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Role Validation based on Portal Context
        const { expectedRole } = req.body;
        if (expectedRole) {
            if (expectedRole === 'admin' && !['university_admin', 'super_admin'].includes(user.role)) {
                return res.status(403).json({ error: 'Access denied: Admin privileges required' });
            }
            if (expectedRole === 'student' && user.role !== 'student') {
                return res.status(403).json({ error: 'Access denied: Please use the Admin Portal' });
            }
        }

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

        // Fetch User Progress
        const progressRes = await db.query('SELECT * FROM user_progress WHERE user_id = $1', [user.id]);
        let progress = progressRes.rows[0];

        // Fallback if no progress record exists (migrating old users)
        if (!progress) {
            const profileRes = await db.query('SELECT status FROM profiles WHERE user_id = $1', [user.id]);
            const isComplete = profileRes.rows.length > 0 && profileRes.rows[0].status === 'complete';

            // Create default progress
            const newProgress = await db.query(
                `INSERT INTO user_progress (user_id, onboarding_completed, current_stage) 
                 VALUES ($1, $2, $3) RETURNING *`,
                [user.id, isComplete, isComplete ? 2 : 1] // If onboarding done, stage 2 (Discovery)
            );
            progress = newProgress.rows[0];
        }

        res.json({
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                progress
            },
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/admin/signup - Register Admin Details (After Frontend Firebase Create)
router.post('/admin/signup', async (req, res) => {
    const { uid, email, fullName, password, role, secretCode, organizationName } = req.body;

    try {
        // 1. Role Validation
        if (!['university_admin', 'super_admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // 2. Secret Code Validation (Hardcoded for Prototype)
        // In real app, this would check a 'invites' table
        const SUPER_SECRET = process.env.SUPER_ADMIN_SECRET || 'SUPER_SECRET_KEY_2026';

        if (role === 'super_admin') {
            if (secretCode !== SUPER_SECRET) {
                return res.status(403).json({ error: 'Invalid Super Admin Secret Code' });
            }
        }

        // 3. Check for existing user (Conflict Resolution)
        // If they managed to create Firebase Auth but Postgres has legacy data
        const existingRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingRes.rows.length > 0) {
            // Delete legacy to allow clean insert (or blocked if different flow?)
            // Assuming clean slate for new admin signup
            await db.query('DELETE FROM users WHERE email = $1', [email]);
        }

        // 4. Hash Password (Redundant if using Firebase Auth for login, but good for backup/portability)
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // 5. Insert User
        const result = await db.query(
            `INSERT INTO users (id, full_name, email, password_hash, role, organization_name, status, is_active) 
             VALUES ($1, $2, $3, $4, $5, $6, 'active', TRUE) 
             RETURNING id, full_name, email, role, status`,
            [uid, fullName, email, hash, role, organizationName || null]
        );

        // 6. Initialize Progress (Admin doesn't need it but keeps schema clean)
        await db.query(
            "INSERT INTO user_progress (user_id, onboarding_completed, current_stage) VALUES ($1, TRUE, 0)",
            [uid]
        );

        res.status(201).json({ user: result.rows[0] });

    } catch (err) {
        console.error("Admin Signup Error:", err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

module.exports = router;
