const pool = require('./db');

const test = async () => {
    try {
        const res = await pool.query('SELECT name, image_url FROM universities LIMIT 1');
        console.log("DB Test Result:", res.rows[0]);
    } catch (e) {
        console.error("DB Test Error:", e);
    } finally {
        // We don't want to hang
        process.exit();
    }
};

test();
