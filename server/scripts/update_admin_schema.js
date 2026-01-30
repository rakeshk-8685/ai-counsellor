const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function updateSchemaForAdminSignup() {
    try {
        await client.connect();
        console.log("Updating Schema for Admin Signup...");

        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255)`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'`);

        // Sync is_active with status
        await client.query(`UPDATE users SET status = 'active' WHERE is_active = TRUE`);
        await client.query(`UPDATE users SET status = 'suspended' WHERE is_active = FALSE`);

        console.log("✅ Schema Updated: organization_name, status");

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Schema Update Failed:", err);
        process.exit(1);
    }
}

updateSchemaForAdminSignup();
