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

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
