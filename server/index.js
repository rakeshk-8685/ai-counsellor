const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[Request] ${req.method} ${req.url}`);
    next();
});

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const chatRoutes = require('./routes/chat');
const universityRoutes = require('./routes/university');
const progressRoutes = require('./routes/progress');

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/progress', progressRoutes);
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);


// Mock Data / Cache
let universitiesCache = [];

// API: Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'University Counsellor API is running' });
});

// API: Get Universities (Proxy to HipoLabs)
app.get('/api/universities', async (req, res) => {
    const { country } = req.query;
    try {
        let url = 'http://universities.hipolabs.com/search';
        if (country) {
            url += `?country=${encodeURIComponent(country)}`;
        }

        // Simple in-memory cache strategy could be added here
        const response = await axios.get(url);
        const data = response.data.slice(0, 100); // Limit to 100 for prototype speed
        res.json(data);
    } catch (error) {
        console.error('Error fetching universities:', error.message);
        res.status(500).json({ error: 'Failed to fetch university data' });
    }
});

// API: AI Recommendation (Mock for now, ready for Gemini integration)
app.post('/api/recommend', async (req, res) => {
    const userProfile = req.body;

    // TODO: Integrate Gemini here. 
    // For now, return a mocked "AI" response based on simple rules.

    const recommendations = [
        {
            name: "University of Example",
            country: "USA",
            matchScore: 95,
            reason: "Strong match for your GPA and Computer Science major preference."
        },
        {
            name: "Tech Institute of World",
            country: "Germany",
            matchScore: 88,
            reason: "Fits your budget perfectly and has a great engineering program."
        }
    ];

    // Simulate AI delay
    setTimeout(() => {
        res.json({ recommendations, analysis: "Based on your academic profile, you have a strong chance at top tier research universities." });
    }, 1500);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
