# AI Counsellor Prototype (UniPath)

A functional prototype for an AI-powered study abroad counselling platform.

## Features
- **Strict Flow**: Landing -> Auth -> Onboarding -> Dashboard.
- **AI Counsellor**: Chat interface for personalized guidance.
- **University Discovery**: Shortlist and Lock universities.
- **Application Guidance**: Roadmap unlocked after locking a university.

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS v4
- **Backend**: Node.js, Express
- **Database**: PostgreSQL (with In-Memory Mock fallback)

## Prerequisites
- Node.js (v18+)
- PostgreSQL (Optional, defaults to Mock DB)

## Setup & Run

### 1. Backend
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:5000`.

### 2. Frontend
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173` (or similar).

## Environment Variables
Create a `.env` in `server/` (Optional):
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your_secret_key
```
