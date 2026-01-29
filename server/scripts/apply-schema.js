const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function applySchema() {
    try {
        await client.connect();
        const schemaPath = path.join(__dirname, '../schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log("Applying Schema...");
        await client.query(schemaSql);
        console.log("✅ Schema Applied Successfully!");

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Schema Application Failed:", err.message);
        process.exit(1);
    }
}

applySchema();
