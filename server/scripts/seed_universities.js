const pool = require('./db');

const universities = [
    {
        name: "Harvard University",
        country: "USA",
        tuition_fee: 55000,
        living_cost: 25000,
        acceptance_rate: 4,
        ranking: 3,
        programs: ["Computer Science", "Business", "Law", "Medicine"],
        features: ["Ivy League", "Research Heavy", "Urban"],
        image_url: "https://images.unsplash.com/photo-1622397333309-3056849bc70b?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Stanford University",
        country: "USA",
        tuition_fee: 58000,
        living_cost: 28000,
        acceptance_rate: 5,
        ranking: 2,
        programs: ["Computer Science", "Engineering", "Business"],
        features: ["Innovation", "Silicon Valley", "Campus"],
        image_url: "https://images.unsplash.com/photo-1627556704302-624286467c65?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Massachusetts Institute of Technology (MIT)",
        country: "USA",
        tuition_fee: 57000,
        living_cost: 22000,
        acceptance_rate: 4,
        ranking: 1,
        programs: ["Computer Science", "Engineering", "Physics"],
        features: ["Tech Focus", "Research", "Urban"],
        image_url: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "University of Toronto",
        country: "Canada",
        tuition_fee: 45000,
        living_cost: 18000,
        acceptance_rate: 43,
        ranking: 21,
        programs: ["Computer Science", "Engineering", "Arts"],
        features: ["Public", "Urban", "Large Campus"],
        image_url: "https://images.unsplash.com/photo-1639413665566-2f75adf7b7ca?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "University of Melbourne",
        country: "Australia",
        tuition_fee: 32000,
        living_cost: 20000,
        acceptance_rate: 70, // Estimated international
        ranking: 34,
        programs: ["Business", "Arts", "Engineering"],
        features: ["Urban", "Culture", "Global"],
        image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Arizona State University",
        country: "USA",
        tuition_fee: 30000,
        living_cost: 15000,
        acceptance_rate: 88,
        ranking: 150,
        programs: ["Computer Science", "Management", "Engineering"],
        features: ["Large Campus", "Innovation", "Party Life"],
        image_url: "https://images.unsplash.com/photo-1590579491624-f98f36d4c763?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Technical University of Munich",
        country: "Germany",
        tuition_fee: 0, // Public Unis in Germany often low/free
        living_cost: 12000,
        acceptance_rate: 20, // Competitive
        ranking: 50,
        programs: ["Engineering", "Computer Science", "Physics"],
        features: ["No Tuition", "Tech Focus", "Urban"],
        image_url: "https://images.unsplash.com/photo-1590959651373-a3db0f38a9da?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Imperial College London",
        country: "UK",
        tuition_fee: 40000, // GBP converted approx
        living_cost: 25000,
        acceptance_rate: 15,
        ranking: 6,
        programs: ["Medicine", "Engineering", "Science"],
        features: ["Prestige", "London", "Research"],
        image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "University of Waterloo",
        country: "Canada",
        tuition_fee: 35000,
        living_cost: 16000,
        acceptance_rate: 53,
        ranking: 110,
        programs: ["Computer Science", "Engineering", "Math"],
        features: ["Co-op", "Tech Hub", "Suburban"],
        image_url: "https://images.unsplash.com/photo-1623625434462-e5e42318ae49?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Georgia Institute of Technology",
        country: "USA",
        tuition_fee: 33000,
        living_cost: 16000,
        acceptance_rate: 21,
        ranking: 45,
        programs: ["Computer Science", "Engineering"],
        features: ["Tech Focus", "Urban", "Southern"],
        image_url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1000&auto=format&fit=crop"
    }
];

const seed = async () => {
    try {
        console.log("Seeding universities...");

        // DROP Table to ensure schema update
        await pool.query('DROP TABLE IF EXISTS universities');

        await pool.query(`
            CREATE TABLE universities (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                country VARCHAR(100) NOT NULL,
                tuition_fee INTEGER,
                living_cost INTEGER,
                acceptance_rate INTEGER,
                ranking INTEGER,
                programs JSONB DEFAULT '[]',
                features JSONB DEFAULT '[]',
                image_url TEXT
            );
        `);

        // Force Clear for Dev
        await pool.query('DELETE FROM universities');

        for (const uni of universities) {
            await pool.query(
                `INSERT INTO universities (name, country, tuition_fee, living_cost, acceptance_rate, ranking, programs, features, image_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [uni.name, uni.country, uni.tuition_fee, uni.living_cost, uni.acceptance_rate, uni.ranking, JSON.stringify(uni.programs), JSON.stringify(uni.features), uni.image_url]
            );
        }
        console.log("Seeding complete!");
        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seed();
