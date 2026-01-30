const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const connectionString = process.env.DATABASE_URL;

let pool;
let mockDB = {
    users: [],
    profiles: {},
    shortlists: [],
    tasks: [],
    progress: {} // New: progress store
};

// If valid connection string exists, use Postgres
if (connectionString) {
    pool = new Pool({
        connectionString,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
    });
    console.log("🔌 Connected to PostgreSQL");
} else {
    console.log("⚠️ No DATABASE_URL found. Using In-Memory Mock Database.");
}

module.exports = {
    query: (text, params) => {
        if (pool) {
            return pool.query(text, params);
        }
        // Mock Implementation for Prototype without DB
        return mockQuery(text, params);
    },
    mockDB
};

// Simple Mock Query Handler for prototype functionality (Auth mainly)
async function mockQuery(text, params) {
    const cleanText = text.trim().toLowerCase();

    // MOCK: INSERT USER
    if (cleanText.startsWith('insert into users')) {
        const newUser = {
            id: 'mock-user-id-' + Date.now(),
            full_name: params[0],
            email: params[1],
            password_hash: params[2],
            role: params[3] || 'student' // Default role
        };
        mockDB.users.push(newUser);
        return { rows: [newUser] };
    }

    // MOCK: SELECT USER BY EMAIL
    if (cleanText.startsWith('select * from users where email')) {
        const user = mockDB.users.find(u => u.email === params[0]);
        return { rows: user ? [user] : [] };
    }

    // MOCK: GET PROFILE
    if (cleanText.startsWith('select * from profiles')) {
        const userId = params[0];
        const profile = mockDB.profiles[userId] || null;
        return { rows: profile ? [profile] : [] };
    }

    // MOCK: UPSERT PROFILE (INSERT)
    if (cleanText.startsWith('insert into profiles')) {
        const userId = params[0];
        mockDB.profiles[userId] = {
            user_id: userId,
            academic_data: params[1] || {},
            study_goals: params[2] || {},
            budget: params[3] || {},
            exams: params[4] || {},
            status: 'incomplete',
            updated_at: new Date()
        };
        return { rows: [mockDB.profiles[userId]] };
    }

    // MOCK: UPDATE PROFILE
    if (cleanText.startsWith('update profiles')) {
        const userId = params[1]; // In query: WHERE user_id = $1 (usually last param, check logic)
        // Wait, profile.js uses: SET ${col} = $2 ... WHERE user_id = $1. Params are [userId, data]
        // So params[0] is userId, params[1] is data.

        // Let's re-read profile.js call: 
        // query = `UPDATE... WHERE user_id = $1`; params = [userId, data];

        const pUserId = params[0];
        const data = params[1];

        if (mockDB.profiles[pUserId]) {
            // Identify column from text (hacky but sufficient for mock)
            if (text.includes('academic_data')) mockDB.profiles[pUserId].academic_data = data;
            if (text.includes('study_goals')) mockDB.profiles[pUserId].study_goals = data;
            if (text.includes('budget')) mockDB.profiles[pUserId].budget = data;
            if (text.includes('exams')) mockDB.profiles[pUserId].exams = data;
            if (text.includes('status')) mockDB.profiles[pUserId].status = 'complete'; // simplified

            mockDB.profiles[pUserId].updated_at = new Date();
            return { rows: [mockDB.profiles[pUserId]] };
        }
        return { rows: [] };
    }

    if (cleanText.startsWith('update user_progress')) {
        const userId = params[0]; // UPDATE ... WHERE user_id = $1 (usually checks params closely)
        // Query: "UPDATE user_progress SET onboarding_completed = TRUE, current_stage = ... WHERE user_id = $1"
        // Params for that query: [userId] NO, wait.
        // progress.js: "UPDATE ... SET ... WHERE user_id = $1", [userId]
        // This means regex or smart parsing needed for SET clause?
        // Mock simplification: assume it's "complete onboarding" if text contains onboarding

        if (!mockDB.progress[userId]) {
            // If checking "update" but no row, return empty to trigger INSERT
            return { rows: [] };
        }

        if (text.includes('onboarding_completed')) {
            mockDB.progress[userId].onboarding_completed = true;
            if (mockDB.progress[userId].current_stage < 2) mockDB.progress[userId].current_stage = 2;
        }
        if (text.includes('counsellor_completed')) {
            mockDB.progress[userId].counsellor_completed = true;
            if (mockDB.progress[userId].current_stage < 3) mockDB.progress[userId].current_stage = 3;
        }

        return { rows: [mockDB.progress[userId]] };
    }

    if (cleanText.startsWith('insert into user_progress')) {
        const userId = params[0];
        // Query: INSERT INTO user_progress (user_id, onboarding_completed, current_stage) VALUES ($1, TRUE, 2)
        mockDB.progress[userId] = {
            user_id: userId,
            onboarding_completed: true,
            current_stage: 2,
            updated_at: new Date()
        };
        return { rows: [mockDB.progress[userId]] };
    }

    if (cleanText.startsWith('select * from user_progress')) {
        const userId = params[0];
        return { rows: mockDB.progress[userId] ? [mockDB.progress[userId]] : [] };
    }

    // MOCK: ADMIN - GET STUDENTS (JOIN query emulation)
    if (cleanText.includes('select') && cleanText.includes('from users u') && cleanText.includes("role = 'student'")) {
        const students = mockDB.users.filter(u => u.role === 'student' || !u.role).map(u => {
            const prog = mockDB.progress[u.id] || { current_stage: 1, onboarding_completed: false };
            const prof = mockDB.profiles[u.id] || { status: 'incomplete' };
            return {
                id: u.id,
                full_name: u.full_name,
                email: u.email,
                role: u.role || 'student',
                current_stage: prog.current_stage,
                onboarding_completed: prog.onboarding_completed,
                profile_status: prof.status
            };
        });
        return { rows: students };
    }

    // MOCK: ADMIN - STATS
    if (cleanText.startsWith('select count(*)')) {
        let count = 0;
        if (text.includes('FROM users')) {
            if (text.includes("'student'")) count = mockDB.users.filter(u => u.role === 'student').length;
            else count = mockDB.users.length;
        }
        else if (text.includes('FROM shortlists') && text.includes('locked')) count = 0; // Mock: 0 applications
        else if (text.includes('FROM profiles') && text.includes('complete')) {
            count = Object.values(mockDB.profiles).filter(p => p.status === 'complete').length;
        }
        return { rows: [{ count }] };
    }

    // MOCK: ADMIN - DELETE USER
    if (cleanText.startsWith('delete from')) {
        const userId = params[0];
        if (text.includes('users WHERE')) {
            mockDB.users = mockDB.users.filter(u => u.id !== userId);
        }
        if (text.includes('profiles WHERE')) delete mockDB.profiles[userId];
        if (text.includes('user_progress WHERE')) delete mockDB.progress[userId];
        // ... tasks/shortlists ignored for simple mock
        return { rowCount: 1 };
    }

    return { rows: [] };
}

// Seed Mock Admins
mockDB.users.push({ id: 'admin-uni', email: 'uni@admin.com', full_name: 'Uni Admin', role: 'university_admin', password_hash: '$2b$10$Z5ercJN7X9qKi1/iesY/zOL4iqtGUO6Jp2LkzKKufoJowCycOf02mu' });
mockDB.users.push({ id: 'admin-super', email: 'super@admin.com', full_name: 'Super Admin', role: 'super_admin', password_hash: '$2b$10$Z5ercJN7X9qKi1/iesY/zOL4iqtGUO6Jp2LkzKKufoJowCycOf02mu' });
