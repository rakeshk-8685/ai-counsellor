const express = require('express');
const db = require('../db');
const router = express.Router();

const { verifyToken } = require('../firebaseAdmin');
const stageGuard = require('../middleware/stageGuard');

// GET /api/tasks
router.get('/', verifyToken, stageGuard(4), async (req, res) => {
    const userId = req.userId; // Trusted
    try {
        // 1. Get Locked University
        const lockedRes = await db.query("SELECT * FROM shortlists WHERE user_id = $1 AND status = 'locked'", [userId]);
        const lockedUni = lockedRes.rows[0];

        if (!lockedUni) return res.json({ tasks: [], locked: false });

        // 2. Fetch Existing Tasks
        const tasksRes = await db.query("SELECT * FROM user_tasks WHERE user_id = $1 ORDER BY due_date ASC", [userId]);

        // 3. Auto-Generate if Empty
        if (tasksRes.rows.length === 0) {
            console.log("Generating initial tasks for", lockedUni.university_name);
            const uniData = lockedUni.university_data || {};
            const country = uniData.country || 'USA';

            const newTasks = [
                { name: "Draft Statement of Purpose (SOP)", category: "Essay", priority: "High", daysOffset: 14 },
                { name: "Request 3 Letters of Recommendation", category: "Document", priority: "High", daysOffset: 7 },
                { name: "Order Official Transcripts", category: "Document", priority: "Medium", daysOffset: 10 },
                { name: "Complete Online Application", category: "Application", priority: "High", daysOffset: 30 },
            ];

            // Country deviations
            if (country === 'USA') {
                newTasks.push({ name: "Send GRE/SAT Scores", category: "Test", priority: "Medium", daysOffset: 20 });
            } else if (country === 'UK') {
                newTasks.push({ name: "Write Personal Statement (UCAS)", category: "Essay", priority: "High", daysOffset: 14 });
            } else {
                newTasks.push({ name: "Check English Proficiency Req (IELTS/TOEFL)", category: "Test", priority: "High", daysOffset: 5 });
            }

            // Insert
            for (const t of newTasks) {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + t.daysOffset);

                await db.query(
                    `INSERT INTO user_tasks (user_id, university_id, task_name, category, priority, due_date) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [userId, lockedUni.id, t.name, t.category, t.priority, dueDate]
                );
            }

            // Re-fetch
            const newRes = await db.query("SELECT * FROM user_tasks WHERE user_id = $1 ORDER BY due_date ASC", [userId]);
            return res.json({ tasks: newRes.rows, locked: true, university: lockedUni });
        }

        res.json({ tasks: tasksRes.rows, locked: true, university: lockedUni });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST /api/tasks/update
router.post('/update', verifyToken, async (req, res) => {
    const { taskId, status } = req.body;
    const userId = req.userId;
    try {
        // Secure Update: Check ownership
        const result = await db.query("UPDATE user_tasks SET status = $1 WHERE id = $2 AND user_id = $3", [status, taskId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Task not found or owned by you" });
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

module.exports = router;
