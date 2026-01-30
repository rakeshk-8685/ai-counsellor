const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function updateSchema() {
    try {
        await client.connect();

        console.log("Checking schema...");

        // Add is_active
        try {
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
            console.log("✅ 'is_active' column ensured.");
        } catch (e) {
            console.log("ℹ️ 'is_active' validation note:", e.message);
        }

        // Verify seeded admins are active
        await client.query("UPDATE users SET is_active = TRUE WHERE role IN ('university_admin', 'super_admin')");
        console.log("✅ Admins activated.");

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Schema Update Failed:", err);
        process.exit(1);
    }
}

updateSchema();
