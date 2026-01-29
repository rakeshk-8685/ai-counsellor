const pool = require('./db');

const migrate = async () => {
    try {
        console.log("Applying schema migration...");
        await pool.query('ALTER TABLE shortlists ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP');
        await pool.query('ALTER TABLE shortlists ADD COLUMN IF NOT EXISTS unlock_reason TEXT');
        console.log("Migration complete!");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
};

migrate();
