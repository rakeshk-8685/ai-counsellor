const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function checkAdmin() {
    try {
        await client.connect();
        console.log("Connected. Fetching admin...");
        const res = await client.query("SELECT id, email, role, password_hash FROM users WHERE email = 'super@admin.com'");
        console.log("Admin User:", res.rows[0]);

        if (res.rows[0]) {
            const bcrypt = require('bcryptjs');
            const isMatch = await bcrypt.compare('admin123', res.rows[0].password_hash);
            console.log("Password 'admin123' match check:", isMatch);
        }

        await client.end();
    } catch (err) {
        console.error("Error:", err);
    }
}

checkAdmin();
