const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 5000;

const FRONTEND_URL = process.env.FRONTEND_URL || '*';
app.use(cors({ origin: FRONTEND_URL }));
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

const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: "Too many requests, please try again later." });

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/progress', progressRoutes);
const taskRoutes = require('./routes/tasks');
app.use('/api/tasks', taskRoutes);
const adminRoutes = require('./routes/admin');
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);
const debugRoutes = require('./routes/debug');
app.use('/api/debug', debugRoutes);

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

app.use(notFound);
app.use(errorHandler);

const fs = require('fs');
const path = require('path');
const db = require('./db');

const initDB = async () => {
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        console.log('🔄 Applying Database Schema...');
        await db.query(schemaSql);
        console.log('✅ Database Schema Applied Successfully');
    } catch (err) {
        console.error('❌ Failed to Initialize Database:', err);
        // We might not want to crash if it's just a connection blip, but schema failure is critical.
        // For Render, we want it to probably fail/restart or just log error.
        // Let's log heavily.
    }
};

// Start Server
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

module.exports = app;
