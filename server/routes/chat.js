const express = require('express');
const db = require('../db');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const { verifyToken } = require('../firebaseAdmin');

// POST /api/chat
router.post('/', verifyToken, async (req, res) => {
    const userId = req.userId; // Trusted
    const { message } = req.body;

    try {
        // Fetch Context
        const profileRes = await db.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        const profile = profileRes.rows[0] || {};
        const { calculateProfileStrength } = require('../utils/analysis');
        const strength = calculateProfileStrength(profile); // Inject Analysis

        const shortlistsRes = await db.query('SELECT university_name FROM shortlists WHERE user_id = $1', [userId]);
        const shortlists = shortlistsRes.rows.map(r => r.university_name).join(', ') || "None";

        // Logic: Calculate Stage (Simplified for Context)
        let currentStage = "Discovery";
        if (profile.status === 'incomplete') currentStage = "Building Profile";
        else if (shortlistsRes.rows.length > 0) currentStage = "Finalizing Universities";

        // --- REAL GEMINI AI INTEGRATION ---
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Construct Context
        const userContext = `
            User Profile:
            - Name: ${profile.full_name || 'Student'}
            - Analysis: ${strength.label} (Score: ${strength.score}/100)
            - Missing/Weak Areas: ${strength.missing.join(', ') || 'None'}
            - Current Stage: ${currentStage}
            - Current Shortlist: ${shortlists}
            - Current Education: ${profile.academic_data?.currentDegree || 'Not specified'} in ${profile.academic_data?.major || 'General'} (GPA: ${profile.academic_data?.gpa || 'N/A'})
            - Target: ${profile.study_goals?.targetDegree || 'Undecided'} in ${profile.study_goals?.targetField || 'Any'}
            - Intake: ${profile.study_goals?.intake || 'Flexible'}
            - Budget: ${profile.budget?.budgetRange || 'Not set'} (${profile.budget?.fundingSource || 'Unknown'})
            - Test Scores: IELTS (${profile.exams?.ieltsScore || 'No'}), GRE (${profile.exams?.greScore || 'No'})
            - SOP Status: ${profile.exams?.sopStatus || 'Not started'}
        `;

        const prompt = `
            You are an expert Overseas Education Counsellor. 
            Context: ${userContext}
            
            User's Message: "${message}"
            
            Task: Provide a helpful, concise, and encouraging response.
            
            GUIDELINES:
            1. If recommending universities, ALWAYS categorize them as **Dream**, **Target**, or **Safe**.
            2. Explain **Why it fits** (match with their profile).
            3. Highlight any **Risks** (e.g. low GPA, budget constraints).
            4. Suggest **Next Steps** based on their 'Current Stage'.
            
            --- ACTION PROTOCOL ---
            You can trigger actions in the system. Use the following JSON formats at the end of your response:
            
            1. SHORTLIST a university:
            \`\`\`json
            { "action": "SHORTLIST", "payload": { "name": "University Name", "country": "Country", "chance": "High/Medium/Low" } }
            \`\`\`
            
            2. ADD a Task:
            \`\`\`json
            { "action": "ADD_TASK", "payload": { "title": "Task Title" } }
            \`\`\`

            3. LOCK a Final Choice (Only if user explicitly confirms):
            \`\`\`json
            { "action": "LOCK_UNIVERSITY", "payload": { "name": "University Name" } }
            \`\`\`

            4. REMOVE from Shortlist:
            \`\`\`json
            { "action": "REMOVE_SHORTLIST", "payload": { "name": "University Name" } }
            \`\`\`
            
            Only use ONE action per message. If no action is needed, do not output JSON.
        `;

        const result = await model.generateContent(prompt);
        let reply = result.response.text();
        let actionLog = "";

        // Parse Action
        const jsonMatch = reply.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            try {
                const actionData = JSON.parse(jsonMatch[1]);
                reply = reply.replace(jsonMatch[0], "").trim(); // Remove JSON from chat text

                if (actionData.action === 'SHORTLIST') {
                    const { name, country, chance } = actionData.payload;
                    await db.query(
                        'INSERT INTO shortlists (user_id, university_name, university_data) VALUES ($1, $2, $3)',
                        [userId, name, { country, chance }]
                    );
                    actionLog = `\n\n*[System: Shortlisted ${name}]*`;
                }

                if (actionData.action === 'REMOVE_SHORTLIST') {
                    const { name } = actionData.payload;
                    await db.query(
                        'DELETE FROM shortlists WHERE user_id = $1 AND university_name = $2',
                        [userId, name]
                    );
                    actionLog = `\n\n*[System: Removed ${name} from shortlist]*`;
                }

                if (actionData.action === 'LOCK_UNIVERSITY') {
                    const { name } = actionData.payload;
                    // Lock this one
                    await db.query(
                        "UPDATE shortlists SET status = 'locked' WHERE user_id = $1 AND university_name = $2",
                        [userId, name]
                    );
                    // Update Progress to Stage 4
                    await db.query(
                        "UPDATE user_progress SET application_locked = TRUE, current_stage = 4 WHERE user_id = $1",
                        [userId]
                    );
                    actionLog = `\n\n*[System: LOCKED ${name}. Moving to Application Stage...]*`;
                }

                if (actionData.action === 'ADD_TASK') {
                    const { title } = actionData.payload;
                    // Append to custom_tasks using JSONB concat
                    await db.query(
                        `UPDATE profiles 
                         SET custom_tasks = COALESCE(custom_tasks, '[]'::jsonb) || $2::jsonb 
                         WHERE user_id = $1`,
                        [userId, JSON.stringify([{ id: Date.now(), title, done: false, type: 'custom' }])]
                    );
                    actionLog = `\n\n*[System: Added task "${title}"]*`;
                }

            } catch (aErr) {
                console.error("Action Execution Failed:", aErr);
            }
        }

        reply += actionLog;
        // ----------------------------------

        res.json({ reply });

    } catch (err) {
        console.error("AI Error (Fallback Rules Active):", err.message);

        // --- FALLBACK: RULE-BASED AGENT ---
        let fallbackReply = "I'm having trouble connecting to my brain (Gemini is blocked), but I can still help!";
        let actionLog = "";

        const lowerMsg = message.toLowerCase();

        // Rule 1: Shortlist
        if (lowerMsg.includes('shortlist') || lowerMsg.includes('save university')) {
            const uniName = "Harvard University"; // Mock extraction
            await db.query(
                'INSERT INTO shortlists (user_id, university_name, university_data) VALUES ($1, $2, $3)',
                [userId, uniName, { country: "USA", chance: "Dream" }]
            );
            actionLog = `\n\n*[System: Shortlisted ${uniName} (Fallback)]*`;
            fallbackReply = "I've shortlisted that university for you (Simulation). Check your dashboard for updates.";
        }

        // Rule 2: Add Task
        else if (lowerMsg.includes('task') || lowerMsg.includes('remind')) {
            const title = "Check Scholarship Deadlines"; // Mock extraction
            await db.query(
                `UPDATE profiles 
                 SET custom_tasks = COALESCE(custom_tasks, '[]'::jsonb) || $2::jsonb 
                 WHERE user_id = $1`,
                [userId, JSON.stringify([{ id: Date.now(), title, done: false, type: 'custom' }])]
            );
            actionLog = `\n\n*[System: Added task "${title}" (Fallback)]*`;
            fallbackReply = "I've added that to your To-Do list (Simulation). Keeping you on track!";
        }

        // Rule 3: University Recommendations (Simulation)
        else if (lowerMsg.includes('university') || lowerMsg.includes('college') || lowerMsg.includes('recommend')) {
            fallbackReply = `**Simulation Mode (AI unavailable):**\n\nBased on your profile, here are 3 mock recommendations:\n\n1. **Stanford University** (Dream) - Great match for your ambition.\n2. **University of Toronto** (Target) - Fits your budget well.\n3. **Arizona State University** (Safe) - High acceptance chance.\n\nType *"Shortlist these"* (or similar) to test the shortlist feature!`;
        }

        // Rule 4: General Help
        else {
            fallbackReply = "I can't connect to Gemini right now (Region/Quota Block), but I can still **Act**. \n\nTry asking me to:\n- *Shortlist a university*\n- *Add a task to my list*\n- *Recommend universities*";
        }

        res.json({ reply: fallbackReply + actionLog });
    }
});

module.exports = router;
