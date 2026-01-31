export const API_BASE = import.meta.env.MODE === 'development'
    ? 'http://localhost:5000'
    : 'https://ai-counsellor-api.onrender.com';
