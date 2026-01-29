const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function resetDB() {
    try {
        await client.connect();

        console.log("--- NUKING DATABASE (Clean Slate) ---");
        // 1. Drop Everything
        await client.query('DROP SCHEMA public CASCADE');
        await client.query('CREATE SCHEMA public');

        // 2. Apply Schema (Now uses VARCHARs natively)
        console.log("Applying Schema...");
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);

        console.log("✅ Database Completely Reset & Schema Applied!");
        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("Reset Failed:", err.message);
        process.exit(1);
    }
}

resetDB();
