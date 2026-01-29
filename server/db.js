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
            password_hash: params[2]
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

    return { rows: [] };
}
