const pool = require('./db');

async function check() {
    try {
        console.log("Verifying data insertion...");
        const res = await pool.query('SELECT name, country_code, city, website FROM universities WHERE country_code IS NOT NULL');
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error("Verification failed:", err);
        process.exit(1);
    }
}

check();
