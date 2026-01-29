const express = require('express');
const db = require('../db');
const router = express.Router();

const { verifyToken } = require('../firebaseAdmin');

// GET /api/universities/shortlist?userId=...
router.get('/shortlist', verifyToken, async (req, res) => {
    const userId = req.userId; // Trusted
    try {
        const result = await db.query('SELECT * FROM shortlists WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json({ shortlists: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch shortlists' });
    }
});

// GET /api/universities/discover
const { calculateMatch, estimateCost } = require('../utils/recommendation');
const stageGuard = require('../middleware/stageGuard');

router.get('/discover', verifyToken, stageGuard(3), async (req, res) => {
    const userId = req.userId; // Trusted
    const { country } = req.query;
    try {
        // 1. Fetch User Profile
        const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = profileRes.rows[0];

        if (!profile) return res.json({ universities: [] });

        // 2. Fetch All Universities (Prototype size: ~50)
        let query = 'SELECT * FROM universities';
        let params = [];
        if (country && country !== 'All') {
            query += ' WHERE country = $1';
            params.push(country);
        }
        const uniRes = await db.query(query, params);

        // 3. Apply Match & Cost Logic
        const results = uniRes.rows.map(uni => {
            const match = calculateMatch(profile, uni);
            const cost = estimateCost(profile.budget, uni);

            return {
                ...uni,
                matchLabel: match.label, // Dream, Target, Safe
                matchScore: match.score,
                fitReason: match.fit,
                costDetails: cost,
                programs: uni.programs // JSONB
            };
        });

        // 4. Sort by Match Score
        results.sort((a, b) => b.matchScore - a.matchScore);

        res.json({ universities: results });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Discovery failed' });
    }
});

// POST /api/universities/lock
router.post('/lock', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { universityId } = req.body;
    try {
        // Strict Check: Ensure no other university is locked
        const check = await db.query("SELECT * FROM shortlists WHERE user_id = $1 AND status = 'locked'", [userId]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'You already have a locked university. Please unlock it first.' });
        }

        await db.query(`UPDATE shortlists SET status = 'locked', locked_at = NOW() WHERE id = $1 AND user_id = $2`, [universityId, userId]);

        // Update Strict Flow Progress
        await db.query(`
            UPDATE user_progress 
            SET application_locked = TRUE, current_stage = GREATEST(current_stage, 4) 
            WHERE user_id = $1
        `, [userId]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to lock university' });
    }
});

// POST /api/universities/unlock
router.post('/unlock', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { universityId, reason } = req.body;
    try {
        await db.query(`UPDATE shortlists SET status = 'shortlisted', locked_at = NULL, unlock_reason = $3 WHERE id = $1 AND user_id = $2`, [universityId, userId, reason]);

        // Revert Strict Flow Progress
        await db.query(`
            UPDATE user_progress 
            SET application_locked = FALSE, current_stage = CASE WHEN current_stage >= 4 THEN 3 ELSE current_stage END
            WHERE user_id = $1
        `, [userId]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to unlock university' });
    }
});

// POST /api/universities/shortlist (Manual add)
router.post('/shortlist', verifyToken, async (req, res) => {
    const userId = req.userId;
    const { name, country, chance } = req.body;
    try {
        await db.query(
            'INSERT INTO shortlists (user_id, university_name, university_data) VALUES ($1, $2, $3)',
            [userId, name, { country, chance }]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to shortlist' });
    }
});

module.exports = router;
