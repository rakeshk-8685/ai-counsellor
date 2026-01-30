/**
 * AI Counsellor Action Endpoints
 * 
 * Dedicated routes for AI-triggered platform actions.
 * These endpoints are called by the chat.js action parser.
 */

const express = require('express');
const db = require('../db');
const router = express.Router();
const { verifyToken } = require('../firebaseAdmin');
const { calculateGranularStrength, recalculateStage, generateStageTasks } = require('../utils/dashboardService');

// ============================================
// 1. CREATE_TASK
// POST /api/actions/task
// ============================================
router.post('/task', verifyToken, async (req, res, next) => {
    const userId = req.userId;
    const { title, critical = false, type = 'ai-generated' } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'Task title is required' });
    }

    try {
        const taskId = `task-${Date.now()}`;

        // Insert into dashboard_tasks
        await db.query(
            'INSERT INTO dashboard_tasks (user_id, task_id, done, created_at) VALUES ($1, $2, FALSE, NOW()) ON CONFLICT (user_id, task_id) DO NOTHING',
            [userId, taskId]
        );

        // Also add to profile custom_tasks for display
        await db.query(
            `UPDATE profiles 
             SET custom_tasks = COALESCE(custom_tasks, '[]'::jsonb) || $2::jsonb 
             WHERE user_id = $1`,
            [userId, JSON.stringify([{ id: taskId, title, done: false, type, critical }])]
        );

        res.json({
            success: true,
            taskId,
            message: `Task "${title}" created`
        });
    } catch (err) {
        next(err);
    }
});

// ============================================
// 2. UPDATE_TASK / TOGGLE_TASK
// PATCH /api/actions/task/:taskId
// ============================================
router.patch('/task/:taskId', verifyToken, async (req, res, next) => {
    const userId = req.userId;
    const { taskId } = req.params;
    const { done, title } = req.body;

    try {
        // Update task completion status
        if (done !== undefined) {
            await db.query(
                `UPDATE dashboard_tasks 
                 SET done = $3, completed_at = CASE WHEN $3 THEN NOW() ELSE NULL END
                 WHERE user_id = $1 AND task_id = $2`,
                [userId, taskId, done]
            );
        }

        // Recalculate strength after task change
        const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = profileRes.rows[0] || {};
        const tasksRes = await db.query('SELECT * FROM dashboard_tasks WHERE user_id = $1', [userId]);
        const completedTasks = tasksRes.rows.filter(t => t.done).map(t => t.task_id);

        const strength = calculateGranularStrength(profile, completedTasks);

        res.json({
            success: true,
            taskId,
            done,
            strength: {
                score: strength.overall.score,
                label: strength.overall.label
            }
        });
    } catch (err) {
        next(err);
    }
});

// ============================================
// 3. SHORTLIST_UNIVERSITY
// POST /api/actions/shortlist
// Stage Gate: Stage >= 2
// ============================================
router.post('/shortlist', verifyToken, async (req, res, next) => {
    const userId = req.userId;
    const { name, country, chance, university_data = {} } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'University name is required' });
    }

    try {
        // Stage gate check
        const progressRes = await db.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
        const progress = progressRes.rows[0] || { current_stage: 1 };

        if (progress.current_stage < 2) {
            return res.status(403).json({
                error: 'Stage gate blocked',
                message: 'Complete onboarding before shortlisting universities',
                requiredStage: 2,
                currentStage: progress.current_stage
            });
        }

        // Check if already shortlisted
        const existing = await db.query(
            'SELECT * FROM shortlists WHERE user_id = $1 AND university_name = $2',
            [userId, name]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'University already shortlisted' });
        }

        // Insert shortlist
        const result = await db.query(
            'INSERT INTO shortlists (user_id, university_name, university_data, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
            [userId, name, { country, chance, ...university_data }, 'shortlisted']
        );

        res.json({
            success: true,
            shortlist: result.rows[0],
            message: `${name} added to shortlist as ${chance}`
        });
    } catch (err) {
        next(err);
    }
});

// ============================================
// 4. REMOVE_SHORTLIST
// DELETE /api/actions/shortlist/:id
// Constraint: Cannot remove locked
// ============================================
router.delete('/shortlist/:id', verifyToken, async (req, res, next) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
        // Check if locked
        const check = await db.query(
            'SELECT * FROM shortlists WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Shortlist item not found' });
        }

        if (check.rows[0].status === 'locked') {
            return res.status(403).json({
                error: 'Cannot remove locked university',
                message: 'Unlock the university first before removing'
            });
        }

        await db.query('DELETE FROM shortlists WHERE id = $1 AND user_id = $2', [id, userId]);

        res.json({
            success: true,
            message: `${check.rows[0].university_name} removed from shortlist`
        });
    } catch (err) {
        next(err);
    }
});

// ============================================
// 5. LOCK_UNIVERSITY
// POST /api/actions/lock
// Stage Gate: Stage >= 3
// ============================================
router.post('/lock', verifyToken, async (req, res, next) => {
    const userId = req.userId;
    const { universityName } = req.body;

    if (!universityName) {
        return res.status(400).json({ error: 'University name is required' });
    }

    try {
        // Stage gate check
        const progressRes = await db.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
        const progress = progressRes.rows[0] || { current_stage: 1 };

        if (progress.current_stage < 3) {
            return res.status(403).json({
                error: 'Stage gate blocked',
                message: 'Complete counsellor session before locking universities',
                requiredStage: 3,
                currentStage: progress.current_stage
            });
        }

        // Check if shortlisted
        const existing = await db.query(
            'SELECT * FROM shortlists WHERE user_id = $1 AND university_name = $2',
            [userId, universityName]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'University not in shortlist' });
        }

        // Lock the university
        await db.query(
            "UPDATE shortlists SET status = 'locked', locked_at = NOW() WHERE user_id = $1 AND university_name = $2",
            [userId, universityName]
        );

        // Advance to Stage 4
        await db.query(
            "UPDATE user_progress SET application_locked = TRUE, current_stage = 4, updated_at = NOW() WHERE user_id = $1",
            [userId]
        );

        res.json({
            success: true,
            message: `${universityName} locked. Advancing to Application stage.`,
            newStage: 4
        });
    } catch (err) {
        next(err);
    }
});

// ============================================
// 6. RECALCULATE_PROFILE_STRENGTH
// GET /api/actions/strength
// ============================================
router.get('/strength', verifyToken, async (req, res, next) => {
    const userId = req.userId;

    try {
        const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = profileRes.rows[0] || {};

        let completedTasks = [];
        try {
            const tasksRes = await db.query('SELECT task_id FROM dashboard_tasks WHERE user_id = $1 AND done = TRUE', [userId]);
            completedTasks = tasksRes.rows.map(t => t.task_id);
        } catch (e) { /* table may not exist */ }

        const strength = calculateGranularStrength(profile, completedTasks);

        res.json({
            overall: strength.overall,
            academics: strength.academics,
            exams: strength.exams,
            sop: strength.sop,
            missing: strength.missing,
            recommendations: strength.recommendations
        });
    } catch (err) {
        next(err);
    }
});

// ============================================
// 7. REVALIDATE_STAGE
// POST /api/actions/revalidate
// ============================================
router.post('/revalidate', verifyToken, async (req, res, next) => {
    const userId = req.userId;
    const { force = false } = req.body;

    try {
        // Fetch all required state
        const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = profileRes.rows[0] || { status: 'incomplete' };

        const progressRes = await db.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);
        const progress = progressRes.rows[0] || { current_stage: 1 };

        const lockedRes = await db.query("SELECT * FROM shortlists WHERE user_id = $1 AND status = 'locked'", [userId]);
        const lockedUnis = lockedRes.rows;

        let tasksCompleted = [];
        try {
            const tasksRes = await db.query('SELECT task_id FROM dashboard_tasks WHERE user_id = $1 AND done = TRUE', [userId]);
            tasksCompleted = tasksRes.rows.map(t => t.task_id);
        } catch (e) { /* table may not exist */ }

        // Recalculate stage
        const stageInfo = recalculateStage(progress, profile, lockedUnis, tasksCompleted);
        const oldStage = progress.current_stage;
        const newStage = stageInfo.current.id;

        // Update if changed
        if (oldStage !== newStage || force) {
            await db.query(
                'UPDATE user_progress SET current_stage = $2, updated_at = NOW() WHERE user_id = $1',
                [userId, newStage]
            );
        }

        res.json({
            previousStage: oldStage,
            currentStage: newStage,
            stageChanged: oldStage !== newStage,
            stageName: stageInfo.current.name,
            progress: stageInfo.progress,
            blockingReasons: stageInfo.blockingReasons
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
