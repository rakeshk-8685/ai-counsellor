const pool = require('./db');

const migrateIds = async () => {
    try {
        console.log("Starting Migration: Converting UUID columns to VARCHAR for Firebase Compatibility...");

        // List of tables and columns to alter
        const tables = [
            'users',
            'profiles',
            'shortlists',
            'chat_history',
            'user_progress',
            'user_tasks'
        ];

        await pool.query('BEGIN');

        for (const table of tables) {
            // For referencing tables
            if (table !== 'users') {
                try {
                    await pool.query(`ALTER TABLE ${table} ALTER COLUMN user_id TYPE VARCHAR(255) USING user_id::text`);
                    console.log(`Updated ${table}.user_id`);
                } catch (e) {
                    console.log(`Failed ${table}:`, e.message);
                }
            }
        }

        // Primary Table
        try {
            await pool.query(`ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255) USING id::text`);
            console.log(`Updated users.id`);
        } catch (e) {
            console.log("Failed users:", e.message);
        }

        await pool.query('COMMIT');
        console.log("Migration Attempt Complete");
        process.exit(0);
    } catch (e) {
        await pool.query('ROLLBACK');
        console.error("Migration Fatal Error:", e);
        process.exit(1);
    }
};

migrateIds();
