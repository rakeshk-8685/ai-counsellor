const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function fixDB() {
    try {
        await client.connect();

        console.log("--- Fixing Database State ---");

        // 1. Clear Old Data (Cascade deletes profiles, progress, etc.)
        console.log("Clearing old users...");
        await client.query('TRUNCATE TABLE users CASCADE');

        // 2. Force Schema Compatibility (Ensure IDs are VARCHAR)
        console.log("Ensuring ID columns are VARCHAR...");
        await client.query('ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255)');
        await client.query('ALTER TABLE profiles ALTER COLUMN user_id TYPE VARCHAR(255)');
        await client.query('ALTER TABLE user_progress ALTER COLUMN user_id TYPE VARCHAR(255)');
        await client.query('ALTER TABLE user_tasks ALTER COLUMN user_id TYPE VARCHAR(255)');
        await client.query('ALTER TABLE shortlists ALTER COLUMN user_id TYPE VARCHAR(255)');

        console.log("✅ Database Fixed & Cleared!");
        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("Fix Failed:", err.message);
        process.exit(1);
    }
}

fixDB();
