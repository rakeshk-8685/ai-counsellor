const { Pool } = require('pg');
const dotenv = require('dotenv');
const { URL } = require('url');

dotenv.config({ path: './.env' }); // Path relative to server/

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("❌ No DATABASE_URL found.");
    process.exit(1);
}

const parsedUrl = new URL(dbUrl);
const config = {
    user: parsedUrl.username,
    password: String(parsedUrl.password),
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    database: parsedUrl.pathname.split('/')[1],
    ssl: false,
};

const pool = new Pool(config);

async function verify() {
    try {
        console.log("🔌 Connecting...");
        const client = await pool.connect();

        const userId = '123e4567-e89b-12d3-a456-426614174000'; // Test UUID

        console.log("🛠️ Creating Mock User...");
        await client.query(`
            INSERT INTO users (id, full_name, email, password_hash) 
            VALUES ($1, 'Mock User', 'mock@test.com', 'hash')
            ON CONFLICT (id) DO NOTHING
        `, [userId]);

        console.log("🛠️ Testing Profile Update...");
        // 1. Ensure Profile Exists
        await client.query(`
            INSERT INTO profiles (user_id, academic_data, status) 
            VALUES ($1, $2, 'incomplete') 
            ON CONFLICT (user_id) DO UPDATE SET academic_data = $2
        `, [userId, { gpa: "4.0", major: "CS" }]);

        // 2. Test Custom Task Update (The Fix)
        console.log("🛠️ Testing Agent Task Addition...");
        const taskTitle = "Verification Task " + Date.now();

        // This is the EXACT query usage from chat.js
        await client.query(`
            UPDATE profiles 
            SET custom_tasks = COALESCE(custom_tasks, '[]'::jsonb) || $2::jsonb 
            WHERE user_id = $1
        `, [userId, JSON.stringify([{ id: Date.now(), title: taskTitle, done: false }])]);

        // 3. Verify
        const res = await client.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = res.rows[0];

        console.log("📊 Results:");
        console.log("- Academic Data:", profile.academic_data);
        console.log("- Custom Tasks:", JSON.stringify(profile.custom_tasks, null, 2));

        const taskFound = profile.custom_tasks && profile.custom_tasks.some(t => t.title === taskTitle);

        if (taskFound) {
            console.log("✅ SUCCESS: Task persisted correctly!");
        } else {
            console.error("❌ FAILURE: Task NOT found.");
            process.exit(1);
        }

        await client.release();
        process.exit(0);

    } catch (err) {
        console.error("❌ verification failed:", err);
        process.exit(1);
    }
}

verify();
