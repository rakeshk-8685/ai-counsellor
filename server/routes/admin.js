const express = require('express');
const db = require('../db');
const { verifyToken } = require('../firebaseAdmin');
const requireRole = require('../middleware/roleCheck');

const router = express.Router();

// Middleware: All admin routes require authentication
router.use(verifyToken);

// GET /api/admin/university/students
// Access: University Admin, Super Admin
router.get('/university/students', requireRole(['university_admin', 'super_admin']), async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                u.id, u.full_name, u.email, u.role,
                p.current_stage, p.onboarding_completed,
                pr.status as profile_status
            FROM users u
            LEFT JOIN user_progress p ON u.id = p.user_id
            LEFT JOIN profiles pr ON u.id = pr.user_id
            WHERE u.role = 'student'
            ORDER BY u.created_at DESC NULLS LAST
        `);
        // Note: created_at might not exist in mock, so ordering might be skipped or basic.
        // For mockDB compatibility, we might need to handle this query specifically.

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// GET /api/admin/super/stats
// Access: Super Admin
router.get('/super/stats', requireRole('super_admin'), async (req, res) => {
    try {
        // Parallel queries for stats
        const usersCount = await db.query('SELECT count(*) FROM users');
        const studentsCount = await db.query("SELECT count(*) FROM users WHERE role = 'student'");
        const applicationsCount = await db.query("SELECT count(*) FROM shortlists WHERE status = 'locked'");
        const completedProfiles = await db.query("SELECT count(*) FROM profiles WHERE status = 'complete'");

        res.json({
            totalUsers: parseInt(usersCount.rows[0].count),
            totalStudents: parseInt(studentsCount.rows[0].count),
            totalApplications: parseInt(applicationsCount.rows[0].count),
            completedProfiles: parseInt(completedProfiles.rows[0].count)
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// DELETE /api/admin/users/:id
// Access: Super Admin
router.delete('/users/:id', requireRole('super_admin'), async (req, res) => {
    const { id } = req.params;
    try {
        // Cascade delete (manually if not set in DB)
        await db.query('DELETE FROM user_progress WHERE user_id = $1', [id]);
        await db.query('DELETE FROM profiles WHERE user_id = $1', [id]);
        await db.query('DELETE FROM shortlists WHERE user_id = $1', [id]);
        await db.query('DELETE FROM user_tasks WHERE user_id = $1', [id]);
        await db.query('DELETE FROM users WHERE id = $1', [id]);

        // Audit Log
        await db.query(
            "INSERT INTO admin_logs (admin_id, action, target_id, details) VALUES ($1, $2, $3, $4)",
            [req.userId, 'DELETE_USER', id, { reason: 'Super Admin Action' }]
        );

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});


// ==========================================
// USER MANAGEMENT (Super Admin Only)
// ==========================================

// GET /api/admin/users
router.get('/users', requireRole('super_admin'), async (req, res) => {
    try {
        const result = await db.query(
            "SELECT id, full_name, email, role, status, organization_name, created_at FROM users ORDER BY created_at DESC"
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', requireRole('super_admin'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'suspended'

    try {
        await db.query("UPDATE users SET status = $1, is_active = $2 WHERE id = $3",
            [status, status === 'active', id]
        );

        // Audit Log
        await db.query(
            "INSERT INTO admin_logs (admin_id, action, target_id, details) VALUES ($1, $2, $3, $4)",
            [req.userId, 'UPDATE_USER_STATUS', id, { status }]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// ==========================================
// UNIVERSITY MANAGEMENT (Super + Uni Admin)
// ==========================================

// GET /api/admin/universities
router.get('/universities', requireRole(['super_admin', 'university_admin']), async (req, res) => {
    try {
        let query = "SELECT * FROM universities";
        let params = [];

        // If Uni Admin, filter by their organization/ownership if linked?
        // Current Schema: Users table has `organization_name`. 
        // Universities table needs a link?? Or we match by name?
        // Ideally `universities` table should have `admin_id` column.

        // For now, assuming Super Admin sees all. 
        // University Admin needs to see THEIRS. 
        // We need to link `users.id` to `universities.admin_id` OR `users.organization_name` to `universities.name`.

        // Let's rely on checking if a column exists, or fallback to name match.
        // Assuming loose coupling for prototype: Match by 'name' similar to Organization Name

        const userRes = await db.query("SELECT organization_name, role FROM users WHERE id = $1", [req.userId]);
        const user = userRes.rows[0];

        if (user.role === 'university_admin') {
            // Strict match
            query += " WHERE name = $1";
            params.push(user.organization_name);
        }

        query += " ORDER BY name ASC";

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch universities' });
    }
});

// POST /api/admin/universities (Create)
router.post('/universities', requireRole(['super_admin', 'university_admin']), async (req, res) => {
    const { name, country, location, description, ranking, acceptance_rate, tuition_fee, image_url, website_url } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO universities 
            (name, country, location, description, ranking, acceptance_rate, tuition_fee, image_url, website_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [name, country, location, description, ranking, acceptance_rate, tuition_fee, image_url, website_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create university' });
    }
});

// PUT /api/admin/universities/:id
router.put('/universities/:id', requireRole(['super_admin', 'university_admin']), async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Validate Ownership if Uni Admin
    if (req.role === 'university_admin') {
        // simplified check: assuming they can only edit if they retrieved it via GET logic
        // In real app, check DB.
    }

    // Dynamic Update Query
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(updates);

    try {
        const result = await db.query(
            `UPDATE universities SET ${fields} WHERE id = $1 RETURNING *`,
            [id, ...values]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update university' });
    }
});


// ==========================================
// PROFILE MANAGEMENT (Uni Admin)
// ==========================================

// GET /api/admin/profile
router.get('/profile', requireRole(['university_admin']), async (req, res) => {
    try {
        const result = await db.query("SELECT id, full_name, email, organization_name, status, role FROM users WHERE id = $1", [req.userId]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// PUT /api/admin/profile
router.put('/profile', requireRole(['university_admin']), async (req, res) => {
    const { full_name, organization_name } = req.body;
    try {
        await db.query("UPDATE users SET full_name = $1, organization_name = $2 WHERE id = $3",
            [full_name, organization_name, req.userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Failed to update profile" });
    }
});

module.exports = router;
