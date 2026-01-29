const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function checkUsers() {
    try {
        await client.connect();

        console.log("\n--- Checking Schema Types ---");
        const t1 = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id'");
        console.log(`users.id: ${t1.rows[0]?.data_type}`);

        const t2 = await client.query("SELECT data_type FROM information_schema.columns WHERE table_name = 'user_progress' AND column_name = 'user_id'");
        console.log(`user_progress.user_id: ${t2.rows[0]?.data_type}`);

        console.log("\n--- Checking Users ---");
        const res = await client.query('SELECT id, full_name, email FROM users');
        if (res.rowCount === 0) console.log("NO USERS FOUND.");
        res.rows.forEach(u => console.log(`[${u.id}] ${u.email}`));

        await client.end();
    } catch (err) {
        console.error("Query Failed:", err.message);
    }
}

checkUsers();
