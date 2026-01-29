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
            'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, full_name, email',
            [fullName, email, hash]
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
            // Create new user with Firebase UID
            // Password hash is dummy 'firebase-auth' as we don't auth with it
            const insertRes = await db.query(
                `INSERT INTO users (id, full_name, email, password_hash) 
                 VALUES ($1, $2, $3, 'firebase-managed') 
                 RETURNING id, full_name, email`,
                [uid, fullName || 'User', email]
            );
            user = insertRes.rows[0];

            // Initialize Progress
            await db.query(
                "INSERT INTO user_progress (user_id, onboarding_completed, current_stage) VALUES ($1, FALSE, 1)",
                [user.id]
            );
        }

        // Fetch User Progress
        const progressRes = await db.query('SELECT * FROM user_progress WHERE user_id = $1', [user.id]);
        let progress = progressRes.rows[0];

        // Ensure progress exists (for legacy/edge cases)
        if (!progress) {
            const newProgress = await db.query(
                `INSERT INTO user_progress (user_id, onboarding_completed, current_stage) 
                 VALUES ($1, FALSE, 1) RETURNING *`,
                [user.id]
            );
            progress = newProgress.rows[0];
        }

        res.json({
            user: { ...user, progress }
        });

    } catch (err) {
        console.error(err);
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

        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
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
                progress
            },
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
