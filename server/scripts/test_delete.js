const db = require('../db');

async function test() {
    try {
        // Get all shortlist items
        const result = await db.query("SELECT id, university_name, status FROM shortlists WHERE status != 'locked' LIMIT 1");
        if (result.rows.length === 0) {
            console.log('No non-locked items found');
            return;
        }
        const item = result.rows[0];
        console.log('Test delete item:', item.id, item.university_name);

        // Try deleting it
        const deleteResult = await db.query('DELETE FROM shortlists WHERE id = $1 RETURNING id', [item.id]);
        console.log('Delete successful:', deleteResult.rows);
    } catch (e) {
        console.error('Error:', e.message);
    }
    process.exit(0);
}

test();
