const express = require('express');
const db = require('../db');
const router = express.Router();

// --- SMART DASHBOARD LOGIC START ---

const { calculateProfileStrength } = require('../utils/analysis');

// --- REFACTORED SMART LOGIC ---

async function fetchLockedStatus(userId) {
    const res = await db.query("SELECT * FROM shortlists WHERE user_id = $1 AND status = 'locked'", [userId]);
    return res.rows;
}

function determineStage(progress) {
    // Strict Stage Mapping based on DB
    const stages = {
        1: { id: 1, name: "Building Profile", progress: 25 },
        2: { id: 2, name: "Discovery", progress: 50 }, // Unlocked by Onboarding
        3: { id: 3, name: "Finalizing", progress: 75 }, // Unlocked by Counsellor
        4: { id: 4, name: "Application", progress: 90 }, // Unlocked by Locking
        5: { id: 5, name: "Guidance", progress: 100 }
    };
    return stages[progress.current_stage] || stages[1];
}

function generateTasks(profile, stage, strength, lockedUnis) {
    const tasks = [];

    // Stage 4: Application Tasks (Highest Priority)
    if (stage.name === 'Application' && lockedUnis) {
        lockedUnis.forEach(uni => {
            tasks.push({ id: `app-${uni.id}`, title: `Submit Application to ${uni.university_name}`, done: false, critical: true, type: 'application' });
            tasks.push({ id: `sop-${uni.id}`, title: `Tailor SOP for ${uni.university_name}`, done: false, type: 'sop' });
        });
        tasks.push({ id: 'visa', title: "Check Visa Requirements", done: false, type: 'visa' });
        return tasks; // Return early to focus on application
    }

    // Stage 1 & 2 Tasks (Fallback if not applying)
    if (profile.status === 'incomplete') tasks.push({ id: 't1', title: "Complete Onboarding Profile", done: false, critical: true });

    if (stage.name === 'Discovery') {
        tasks.push({ id: 't3', title: "Shortlist 5 Universities", done: false });
    }

    if (!profile.exams?.ieltsScore && !profile.exams?.toeflScore) {
        tasks.push({ id: 't5', title: "Book IELTS/TOEFL Exam", done: false, type: 'exam' });
    }

    return tasks;
}

// --- SMART DASHBOARD LOGIC END ---

const { verifyToken } = require('../firebaseAdmin');

// GET /api/profile/:userId
router.get('/:userId', verifyToken, async (req, res) => {
    // Note: userId in params is checked against token
    const { userId } = req.params;
    if (req.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
    }

    try {
        const result = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = result.rows[0] || {};
        const lockedUnis = await fetchLockedStatus(userId);
        const progressRes = await db.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
        const progress = progressRes.rows[0] || { current_stage: 1 };

        const strength = calculateProfileStrength(profile);
        const stage = determineStage(progress);
        const generatedTasks = generateTasks(profile, stage, strength, lockedUnis);
        const customTasks = profile.custom_tasks || [];
        const tasks = [...generatedTasks, ...customTasks];

        res.json({ ...profile, strength, stage, tasks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// POST /api/profile/update
router.post('/update', verifyToken, async (req, res) => {
    // Use userId from Token
    const userId = req.userId;
    const { section, data } = req.body;

    try {
        const check = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        let query = '';
        let params = [];

        if (check.rows.length === 0) {
            query = `INSERT INTO profiles (user_id, academic_data, study_goals, budget, exams, status) 
                     VALUES ($1, $2, $3, $4, $5, 'incomplete') RETURNING *`;
            // ... (Creation Logic remains same)
            const empty = {};
            const val = section === 'academic' ? data : empty;
            const val2 = section === 'goals' ? data : empty;
            const val3 = section === 'budget' ? data : empty;
            const val4 = section === 'exams' ? data : empty;
            // Explicitly stringify if db adapter doesn't handle JSON automatically (pg supports it, but safer)
            // Actually, pg handles objects for JSONB.
            params = [userId, val, val2, val3, val4];
        } else {
            // ... (Update Logic remains same)
            const map = { 'academic': 'academic_data', 'goals': 'study_goals', 'budget': 'budget', 'exams': 'exams' };
            const col = map[section];
            if (!col) return res.status(400).json({ error: 'Invalid section' });
            query = `UPDATE profiles SET ${col} = $2, updated_at = NOW() WHERE user_id = $1 RETURNING *`;
            params = [userId, data];
        }

        const result = await db.query(query, params);
        const profile = result.rows[0];
        const lockedUnis = await fetchLockedStatus(userId);
        const progressRes = await db.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
        const progress = progressRes.rows[0] || { current_stage: 1 };

        const strength = calculateProfileStrength(profile);
        const stage = determineStage(progress);
        const generatedTasks = generateTasks(profile, stage, strength, lockedUnis);
        const customTasks = profile.custom_tasks || [];
        const tasks = [...generatedTasks, ...customTasks];

        res.json({ profile: { ...profile, strength, stage, tasks } });
    } catch (err) {
        console.error("Profile Update Error:", err);
        res.status(500).json({
            error: 'Failed to update profile',
            details: err.message, // Expose for debugging
            hint: err.detail || err.hint // Postgres hints
        });
    }
});

module.exports = router;
