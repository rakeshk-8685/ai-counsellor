const pool = require('./db');

const migrate = async () => {
    try {
        console.log("Creating user_tasks table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_tasks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                university_id UUID, 
                task_name VARCHAR(255) NOT NULL,
                category VARCHAR(50), 
                status VARCHAR(50) DEFAULT 'pending', 
                priority VARCHAR(20) DEFAULT 'medium',
                due_date DATE,
                reasoning TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        console.log("Migration complete!");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
};

migrate();
