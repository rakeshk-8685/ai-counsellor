const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function testConnection() {
    try {
        await client.connect();
        console.log("✅ Successfully connected to Postgres!");
        const res = await client.query('SELECT NOW()');
        console.log("Server Time:", res.rows[0].now);
        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Connection Failed:", err.message);
        process.exit(1);
    }
}

testConnection();
