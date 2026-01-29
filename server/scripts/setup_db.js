const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("❌ No DATABASE_URL found in .env file.");
    process.exit(1);
}

const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function setup() {
    try {
        console.log("🔌 Connecting to Database...");
        const client = await pool.connect();
        console.log("✅ Connected successfully.");

        console.log("📄 Reading schema.sql...");
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("🛠️ Running Schema Migration...");
        await client.query(schemaSql);
        console.log("✅ Tables created successfully.");

        client.release();
        process.exit(0);
    } catch (err) {
        console.error("❌ Setup Failed:", err.message);
        console.log("💡 Tip: Ensure PostgreSQL is running and the credentials in .env are correct.");
        process.exit(1);
    }
}

setup();
