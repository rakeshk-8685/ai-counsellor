-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY, -- Firebase UID
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'student',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    academic_data JSONB DEFAULT '{}',
    study_goals JSONB DEFAULT '{}',
    budget JSONB DEFAULT '{}',
    exams JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'incomplete',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Shortlists Table
CREATE TABLE IF NOT EXISTS shortlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    university_name VARCHAR(255) NOT NULL,
    university_data JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'shortlisted',
    locked_at TIMESTAMP,
    unlock_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat History (Optional)
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    counsellor_completed BOOLEAN DEFAULT FALSE,
    shortlisting_completed BOOLEAN DEFAULT FALSE,
    application_locked BOOLEAN DEFAULT FALSE,
    current_stage INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Universities Table (Rich Data for Discovery)
CREATE TABLE IF NOT EXISTS universities (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(50), -- To map to provided IDs like "uni_006"
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(10),
    city VARCHAR(100),
    tuition_fee INTEGER, -- USD per year
    living_cost INTEGER, -- USD per year
    acceptance_rate INTEGER, -- Percentage (0-100)
    ranking INTEGER, -- Global/National Rank
    programs JSONB DEFAULT '[]', -- List of supported majors
    features JSONB DEFAULT '[]', -- Tags like "Research", "Urban", etc.
    website TEXT,
    image_url TEXT
);
