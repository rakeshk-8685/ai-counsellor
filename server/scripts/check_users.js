const { Pool } = require('pg');
const dotenv = require('dotenv');
const { URL } = require('url');

dotenv.config({ path: './.env' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.log("⚠️ No DATABASE_URL. Using Mock?");
    process.exit(0);
}

const parsedUrl = new URL(dbUrl);
const config = {
    user: parsedUrl.username,
    password: String(parsedUrl.password),
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    database: parsedUrl.pathname.split('/')[1],
    ssl: false,
};

const pool = new Pool(config);

async function check() {
    try {
        console.log("🔌 Connecting to DB...");
        const client = await pool.connect();

        console.log("🔍 Checking for existing users...");
        const res = await client.query('SELECT * FROM users');

        console.log(`📊 Found ${res.rows.length} users.`);
        res.rows.forEach(u => console.log(` - ${u.email} (${u.full_name})`));

        if (res.rows.length === 0) {
            console.error("❌ NO USERS FOUND. Data is not persisting.");
        } else {
            console.log("✅ Users exist. Persistence is working.");
        }

        client.release();
        process.exit(0);
    } catch (err) {
        console.error("❌ Check Failed:", err.message);
        process.exit(1);
    }
}

check();
