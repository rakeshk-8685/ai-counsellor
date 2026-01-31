const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from specific path
dotenv.config({ path: path.join(__dirname, '../.env') });

// FORCE MOCK DB: explicit flag
process.env.FORCE_MOCK = 'true';

// Use app's DB module to verify logic (works with Mock DB too)
const db = require('../db');

async function verify() {
    try {
        console.log("🔌 Connecting via App DB Module...");

        // Mock DB doesn't need connect/release, but real one might (pool hidden in db.js)
        // db.query handles it.

        const userId = 'verification-test-user-' + Date.now();

        console.log("🛠️ Creating/Resetting Test Profile...");
        // Ensure User Exists
        await db.query(`
            INSERT INTO users (id, full_name, email, password_hash)
            VALUES ($1, 'Test User', $2, 'hash')
        `, [userId, `test-${Date.now()}@example.com`]);

        // 1. Insert Profile
        await db.query(`
            INSERT INTO profiles (user_id, academic_data, status, custom_tasks) 
            VALUES ($1, $2, 'incomplete', $3) 
        `, [userId, { gpa: "3.5" }, JSON.stringify([{ id: 'init', title: 'Initial Task', done: false }])]);
        // Note: Mock DB doesn't support ON CONFLICT, so we just INSERT for fresh user.

        // 2. Test Persistence via SQL (Simulating App Behavior)
        console.log("🛠️ Testing Task Update...");
        const newTask = { id: Date.now(), title: "New Agent Task " + Date.now(), done: false };

        // Simulating the update query profile.js uses
        await db.query(`
            UPDATE profiles 
            SET custom_tasks = $2, updated_at = NOW()
            WHERE user_id = $1
        `, [userId, JSON.stringify([newTask])]);
        // Note: The logic in profile.js replaces the whole array (no concatenation in SQL).
        // Wait, profile.js logic: `SET custom_tasks = $2`. It completely replaces it!
        // The appending logic must happen in memory if we want appending.
        // Let's check profile.js again.
        // It fetches profile, gets `custom_tasks` (line 77+127), then appends?
        // No, `POST /update` takes `data` and sets it to the column. 
        // So the frontend (or agent) is responsible for sending the FULL array.
        // My verification script simulates this REPLACE behavior.

        // 3. Verify
        const res = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = res.rows[0];

        console.log("📊 Results:");
        console.log("- Custom Tasks:", JSON.stringify(profile.custom_tasks, null, 2));

        const taskFound = profile.custom_tasks.some(t => t.title === newTask.title);

        if (taskFound) {
            console.log("✅ SUCCESS: Tasks persisted correctly!");
        } else {
            console.error("❌ FAILURE: Tasks missing.");
            process.exit(1);
        }

        // Cleanup (Mock DB is in-memory, so it disappears, but good practice)
        await db.query('DELETE FROM profiles WHERE user_id = $1', [userId]);
        await db.query('DELETE FROM users WHERE id = $1', [userId]);

        process.exit(0);

    } catch (err) {
        console.error("❌ verification failed:", err);
        process.exit(1);
    }
}

verify();
