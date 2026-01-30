const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: false
});

async function seedAdmins() {
    try {
        await client.connect();

        console.log("Checking for 'role' column...");
        try {
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student'`);
            console.log("✅ Role column ensured.");
        } catch (e) {
            console.log("ℹ️ Role column check note:", e.message);
        }

        console.log("Generating Hash for 'admin123'...");
        const hash = await bcrypt.hash('admin123', 10);
        console.log("Hash generated successfully.");

        console.log("Seeding Admins...");

        // Upsert University Admin
        await client.query(`
            INSERT INTO users (id, full_name, email, password_hash, role)
            VALUES ('admin-uni', 'Uni Admin', 'uni@admin.com', $1, 'university_admin')
            ON CONFLICT (email) DO UPDATE 
            SET role = 'university_admin', password_hash = $1
        `, [hash]);

        // Upsert Super Admin
        await client.query(`
            INSERT INTO users (id, full_name, email, password_hash, role)
            VALUES ('admin-super', 'Super Admin', 'super@admin.com', $1, 'super_admin')
            ON CONFLICT (email) DO UPDATE 
            SET role = 'super_admin', password_hash = $1
        `, [hash]);

        console.log("✅ Admins Seeded Successfully!");

        await client.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Seeding Failed:", err);
        process.exit(1);
    }
}

seedAdmins();
