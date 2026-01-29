const express = require('express');
const db = require('../db');
const router = express.Router();

// GET /api/universities/shortlist?userId=...
router.get('/shortlist', async (req, res) => {
    const { userId } = req.query;
    try {
        // In a real app, this joins with a 'universities' table
        // Here we select from 'shortlists'
        const result = await db.query('SELECT * FROM shortlists WHERE user_id = $1', [userId]);

        // If empty, mock some data for the prototype "Discovery" phase
        if (result.rows.length === 0) {
            // Mock universities for discovery
            const mockUnis = [
                { id: 'u1', university_name: 'Arizona State University', status: 'recommended', university_data: { country: 'USA', chance: 'High', cost: 'Medium' } },
                { id: 'u2', university_name: 'University of Toronto', status: 'recommended', university_data: { country: 'Canada', chance: 'Medium', cost: 'High' } },
                { id: 'u3', university_name: 'Technical University of Munich', status: 'recommended', university_data: { country: 'Germany', chance: 'Low', cost: 'Low' } },
            ];
            return res.json({ shortlists: mockUnis });
        }

        res.json({ shortlists: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch universities' });
    }
});

// POST /api/universities/lock
router.post('/lock', async (req, res) => {
    const { userId, universityId, universityName } = req.body;
    try {
        // Upsert or Update status to 'locked'
        // Ideally we check if user has already locked 1. 
        // For prototype, allow locking multiple or just one. Requirement says "At least one".

        // Insert into shortlist if not exists, set status to locked
        // We use a mock ID generator or rely on client/db default

        // Check if exists
        // const check = await db.query('SELECT * FROM shortlists WHERE user_id = $1 AND university_name = $2', [userId, universityName]);

        // upsert logic simplified:
        // Delete old (if exists) and insert new as locked? Or update?
        // Let's just INSERT for simplicity of the prototype flow "Locking" logic

        await db.query(`INSERT INTO shortlists (user_id, university_name, status, university_data) 
            VALUES ($1, $2, 'locked', '{}')`, [userId, universityName]);

        res.json({ success: true, message: 'University Locked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to lock university' });
    }
});

module.exports = router;
