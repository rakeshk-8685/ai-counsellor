const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testAI() {
    try {
        console.log("Testing Gemini API...");
        const apiKey = process.env.GEMINI_API_KEY;
        console.log("Key Configured:", apiKey ? "YES (" + apiKey.substring(0, 5) + "...)" : "NO");

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent("Hello, say 'AI Connection Successful' if you can hear me.");
        console.log("Response:", result.response.text());
        process.exit(0);
    } catch (err) {
        console.error("❌ AI Connection Failed:");
        console.error("Error Name:", err.name);
        console.error("Error Message:", err.message);
        // console.error("Full Error:", JSON.stringify(err, null, 2));
        process.exit(1);
    }
}

testAI();
