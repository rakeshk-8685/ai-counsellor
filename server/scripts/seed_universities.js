const pool = require('../db');

const universities = [
    // Existing data with mapped/default values for new columns
    {
        name: "Harvard University",
        country: "USA",
        country_code: "US",
        city: "Cambridge",
        tuition_fee: 55000,
        living_cost: 25000,
        acceptance_rate: 4,
        ranking: 3,
        programs: ["Computer Science", "Business", "Law", "Medicine"],
        features: ["Ivy League", "Research Heavy", "Urban"],
        website: "https://www.harvard.edu",
        image_url: "https://images.unsplash.com/photo-1622397333309-3056849bc70b?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Stanford University",
        country: "USA",
        country_code: "US",
        city: "Stanford",
        tuition_fee: 58000,
        living_cost: 28000,
        acceptance_rate: 5,
        ranking: 2,
        programs: ["Computer Science", "Engineering", "Business"],
        features: ["Innovation", "Silicon Valley", "Campus"],
        website: "https://www.stanford.edu",
        image_url: "https://images.unsplash.com/photo-1627556704302-624286467c65?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Massachusetts Institute of Technology (MIT)",
        country: "USA",
        country_code: "US",
        city: "Cambridge",
        tuition_fee: 57000,
        living_cost: 22000,
        acceptance_rate: 4,
        ranking: 1,
        programs: ["Computer Science", "Engineering", "Physics"],
        features: ["Tech Focus", "Research", "Urban"],
        website: "https://www.mit.edu",
        image_url: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "University of Toronto",
        country: "Canada",
        country_code: "CA",
        city: "Toronto",
        tuition_fee: 45000,
        living_cost: 18000,
        acceptance_rate: 43,
        ranking: 21,
        programs: ["Computer Science", "Engineering", "Arts"],
        features: ["Public", "Urban", "Large Campus"],
        website: "https://www.utoronto.ca",
        image_url: "https://images.unsplash.com/photo-1639413665566-2f75adf7b7ca?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "University of Melbourne",
        country: "Australia",
        country_code: "AU",
        city: "Melbourne",
        tuition_fee: 32000,
        living_cost: 20000,
        acceptance_rate: 70, // Estimated international
        ranking: 34,
        programs: ["Business", "Arts", "Engineering"],
        features: ["Urban", "Culture", "Global"],
        website: "https://www.unimelb.edu.au",
        image_url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Arizona State University",
        country: "USA",
        country_code: "US",
        city: "Tempe",
        tuition_fee: 30000,
        living_cost: 15000,
        acceptance_rate: 88,
        ranking: 150,
        programs: ["Computer Science", "Management", "Engineering"],
        features: ["Large Campus", "Innovation", "Party Life"],
        website: "https://www.asu.edu",
        image_url: "https://images.unsplash.com/photo-1590579491624-f98f36d4c763?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Technical University of Munich",
        country: "Germany",
        country_code: "DE",
        city: "Munich",
        tuition_fee: 0, // Public Unis in Germany often low/free
        living_cost: 12000,
        acceptance_rate: 20, // Competitive
        ranking: 50,
        programs: ["Engineering", "Computer Science", "Physics"],
        features: ["No Tuition", "Tech Focus", "Urban"],
        website: "https://www.tum.de",
        image_url: "https://images.unsplash.com/photo-1590959651373-a3db0f38a9da?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Imperial College London",
        country: "UK",
        country_code: "GB",
        city: "London",
        tuition_fee: 40000, // GBP converted approx
        living_cost: 25000,
        acceptance_rate: 15,
        ranking: 6,
        programs: ["Medicine", "Engineering", "Science"],
        features: ["Prestige", "London", "Research"],
        website: "https://www.imperial.ac.uk",
        image_url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "University of Waterloo",
        country: "Canada",
        country_code: "CA",
        city: "Waterloo",
        tuition_fee: 35000,
        living_cost: 16000,
        acceptance_rate: 53,
        ranking: 110,
        programs: ["Computer Science", "Engineering", "Math"],
        features: ["Co-op", "Tech Hub", "Suburban"],
        website: "https://uwaterloo.ca",
        image_url: "https://images.unsplash.com/photo-1623625434462-e5e42318ae49?q=80&w=1000&auto=format&fit=crop"
    },
    {
        name: "Georgia Institute of Technology",
        country: "USA",
        country_code: "US",
        city: "Atlanta",
        tuition_fee: 33000,
        living_cost: 16000,
        acceptance_rate: 21,
        ranking: 45,
        programs: ["Computer Science", "Engineering"],
        features: ["Tech Focus", "Urban", "Southern"],
        website: "https://www.gatech.edu",
        image_url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1000&auto=format&fit=crop"
    },
    // New Data Provided by User
    {
        external_id: "uni_006",
        name: "University of Dublin Trinity College",
        country: "Ireland",
        country_code: "IE",
        city: "Dublin",
        tuition_fee: 21000,
        living_cost: 15000, // Estimated based on location if not provided, or leave undefined
        acceptance_rate: 50, // 0.50 -> 50 used
        ranking: 55,
        programs: ["Computer Science", "Law", "Finance"],
        features: ["Historic", "Research", "Urban"],
        website: "https://www.tcd.ie",
        image_url: "https://images.unsplash.com/photo-1590059173428-2e0616b2e3e1?q=80&w=1000&auto=format&fit=crop" // Placeholder
    },
    {
        external_id: "uni_007",
        name: "University of California Riverside",
        country: "United States",
        country_code: "US",
        city: "Riverside",
        tuition_fee: 26000,
        living_cost: 16000, // Estimated
        acceptance_rate: 58,
        ranking: 70,
        programs: ["Data Analytics", "Business Economics", "Biotechnology"],
        features: ["Research", "Diverse", "Sunny"],
        website: "https://www.ucr.edu",
        image_url: "https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=1000&auto=format&fit=crop" // Placeholder
    },
    {
        external_id: "uni_008",
        name: "National University of Singapore",
        country: "Singapore",
        country_code: "SG",
        city: "Singapore",
        tuition_fee: 24000,
        living_cost: 12000, // Estimated
        acceptance_rate: 25,
        ranking: 11,
        programs: ["Computer Engineering", "Artificial Intelligence", "Management"],
        features: ["Top Ranked", "Asian Hub", "Technology"],
        website: "https://www.nus.edu.sg",
        image_url: "https://images.unsplash.com/photo-1564981797816-1043664bf78d?q=80&w=1000&auto=format&fit=crop" // Placeholder (MIT reused or similar tech vibe)
    },
    {
        external_id: "uni_009",
        name: "Seoul National University",
        country: "South Korea",
        country_code: "KR",
        city: "Seoul",
        tuition_fee: 9000,
        living_cost: 10000, // Estimated
        acceptance_rate: 32,
        ranking: 35,
        programs: ["Electronics", "International Studies", "Computer Science"],
        features: ["Prestigious", "Urban", "Research"],
        website: "https://www.snu.ac.kr",
        image_url: "https://images.unsplash.com/photo-1535139262971-c51845709a48?q=80&w=1000&auto=format&fit=crop" // Placeholder
    },
    {
        external_id: "uni_010",
        name: "University of Amsterdam",
        country: "Netherlands",
        country_code: "NL",
        city: "Amsterdam",
        tuition_fee: 16000,
        living_cost: 14000, // Estimated
        acceptance_rate: 45,
        ranking: 42,
        programs: ["Data Science", "Economics", "Psychology"],
        features: ["European Hub", "Historic", "Research"],
        website: "https://www.uva.nl",
        image_url: "https://images.unsplash.com/photo-1467226632440-65f0b4957563?q=80&w=1000&auto=format&fit=crop" // Placeholder
    },
    {
        external_id: "uni_011",
        name: "ETH Zurich",
        country: "Switzerland",
        country_code: "CH",
        city: "Zurich",
        tuition_fee: 1800,
        living_cost: 20000, // High living cost
        acceptance_rate: 27,
        ranking: 9,
        programs: ["Computer Science", "Robotics", "Civil Engineering"],
        features: ["Top Tech", "Research", "European"],
        website: "https://ethz.ch",
        image_url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000&auto=format&fit=crop" // Placeholder
    },
    {
        external_id: "uni_012",
        name: "University of Auckland",
        country: "New Zealand",
        country_code: "NZ",
        city: "Auckland",
        tuition_fee: 23000,
        living_cost: 15000, // Estimated
        acceptance_rate: 60,
        ranking: 85,
        programs: ["Information Technology", "Marine Science", "Business"],
        features: ["Pacific Hub", "Research", "Urban"],
        website: "https://www.auckland.ac.nz",
        image_url: "https://images.unsplash.com/photo-1589808820465-27db4d2843ef?q=80&w=1000&auto=format&fit=crop" // Placeholder
    }
];

const seed = async () => {
    try {
        console.log("Seeding universities...");

        // DROP Table to ensure schema update
        await pool.query('DROP TABLE IF EXISTS universities');

        // Create Table with new schema
        await pool.query(`
            CREATE TABLE universities (
                id SERIAL PRIMARY KEY,
                external_id VARCHAR(50), 
                name VARCHAR(255) NOT NULL,
                country VARCHAR(100) NOT NULL,
                country_code VARCHAR(10),
                city VARCHAR(100),
                tuition_fee INTEGER, 
                living_cost INTEGER, 
                acceptance_rate INTEGER, 
                ranking INTEGER, 
                programs JSONB DEFAULT '[]', 
                features JSONB DEFAULT '[]', 
                website TEXT,
                image_url TEXT
            );
        `);

        // Force Clear for Dev (Redundant with DROP but kept for clarity if DROP is removed later)
        await pool.query('DELETE FROM universities');

        for (const uni of universities) {
            await pool.query(
                `INSERT INTO universities (
                    external_id, name, country, country_code, city, 
                    tuition_fee, living_cost, acceptance_rate, ranking, 
                    programs, features, website, image_url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                [
                    uni.external_id || null,
                    uni.name,
                    uni.country,
                    uni.country_code || null,
                    uni.city || null,
                    uni.tuition_fee,
                    uni.living_cost || 15000,
                    uni.acceptance_rate,
                    uni.ranking,
                    JSON.stringify(uni.programs),
                    JSON.stringify(uni.features),
                    uni.website || null,
                    uni.image_url
                ]
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
