const express = require('express');
const db = require('../db');
const router = express.Router();

const { verifyToken } = require('../firebaseAdmin');

// GET /api/progress/:userId
router.get('/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        // Strict Access Control
        if (req.userId !== userId) {
            return res.status(403).json({ error: "Forbidden: Accessing other user's progress" });
        }

        const result = await db.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
        res.json(result.rows[0] || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/progress/complete-onboarding
router.post('/complete-onboarding', verifyToken, async (req, res) => {
    const userId = req.userId; // Trusted from Token
    try {
        // Update Profile Status
        await db.query("UPDATE profiles SET status = 'complete' WHERE user_id = $1", [userId]);

        // Upsert User Progress
        // Try Update first
        const updateRes = await db.query(
            `UPDATE user_progress 
             SET onboarding_completed = TRUE, current_stage = GREATEST(current_stage, 2) 
             WHERE user_id = $1 RETURNING *`,
            [userId]
        );

        let progress = updateRes.rows[0];

        // If no row existed, insert one
        if (!progress) {
            const insertRes = await db.query(
                `INSERT INTO user_progress (user_id, onboarding_completed, current_stage)
                 VALUES ($1, TRUE, 2) RETURNING *`,
                [userId]
            );
            progress = insertRes.rows[0];
        }

        res.json(progress);
    } catch (err) {
        console.error("Complete Onboarding Error:", err);
        res.status(500).json({ error: 'Server error during onboarding completion' });
    }
});

// POST /api/progress/complete-counsellor
router.post('/complete-counsellor', verifyToken, async (req, res) => {
    const userId = req.userId; // Trusted
    try {
        const result = await db.query(
            `UPDATE user_progress 
             SET counsellor_completed = TRUE, current_stage = GREATEST(current_stage, 3) 
             WHERE user_id = $1 RETURNING *`,
            [userId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
