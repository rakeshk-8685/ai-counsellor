const axios = require('axios');

const API_URL = 'https://ai-counsellor-3ei0.onrender.com/api';

async function testFlow() {
    try {
        console.log("1. Testing Signup...");
        const userEmail = `test${Date.now()}@example.com`;
        const signupRes = await axios.post(`${API_URL}/auth/signup`, {
            fullName: 'Test User',
            email: userEmail,
            password: 'password123'
        });

        const { user, token } = signupRes.data;
        const headers = { Authorization: `Bearer ${token}` };
        console.log("✅ Signup Successful");

        console.log("\n2. Testing Smart Dashboard Data (Initial)...");
        const profileRes = await axios.get(`${API_URL}/profile/${user.id}`, { headers });
        const p = profileRes.data;

        console.log(`- Stage: ${p.stage?.name} (Progress: ${p.stage?.progress}%)`);
        console.log(`- Strength: ${p.strength?.label} (Score: ${p.strength?.score})`);
        console.log(`- Tasks: ${p.tasks?.length}`);

        if (p.stage && p.strength && p.tasks) {
            console.log("✅ Smart Fields Present");
        } else {
            console.error("❌ Smart Fields MISSING - Update Failed");
        }

        console.log("\n3. Testing Profile Update (Triggering Smart Logic)...");
        await axios.post(`${API_URL}/profile/update`, {
            userId: user.id,
            section: 'academic',
            data: { degree: 'Bachelors', major: 'CS', gpa: '3.8' } // High GPA
        }, { headers });
        console.log("✅ Academic data saved (High GPA)");

        console.log("\n4. Testing Smart Dashboard Data (After Update)...");
        const profileRes2 = await axios.get(`${API_URL}/profile/${user.id}`, { headers });
        const p2 = profileRes2.data;

        console.log(`- New Stage: ${p2.stage?.name}`);
        console.log(`- New Strength: ${p2.strength?.label} (Score: ${p2.strength?.score})`);

        if (p2.strength.score > p.strength.score) {
            console.log("✅ Strength Score Increased (Smart Logic Working)");
        } else {
            console.log("⚠️ Strength Score did not increase");
        }

        console.log("\n✅ VERIFICATION COMPLETE");

    } catch (err) {
        console.error("❌ Test Failed:", err.message);
        if (err.response) console.error("Response:", err.response.data);
    }
}

testFlow();
