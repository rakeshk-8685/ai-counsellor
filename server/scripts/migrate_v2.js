const { Pool } = require('pg');
const dotenv = require('dotenv');
const { URL } = require('url');

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("❌ No DATABASE_URL found.");
    process.exit(1);
}

const parsedUrl = new URL(dbUrl);
const config = {
    user: parsedUrl.username,
    password: String(parsedUrl.password), // Force string
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    database: parsedUrl.pathname.split('/')[1],
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

const pool = new Pool(config);

async function migrate() {
    try {
        console.log("🔌 Connecting to Database...");
        const client = await pool.connect();

        console.log("🛠️ Adding custom_tasks column to profiles...");

        // Add custom_tasks column if it doesn't exist
        await client.query(`
            ALTER TABLE profiles 
            ADD COLUMN IF NOT EXISTS custom_tasks JSONB DEFAULT '[]';
        `);

        console.log("✅ Migration Successful: custom_tasks column added.");
        client.release();
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration Failed:", err.message);
        process.exit(1);
    }
}

migrate();
