const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

async function list() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log("Listing models for your key...");

        // This is the command that lists all available models
        const request = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await request.json();

        if (data.models) {
            console.log("✅ Models found:");
            data.models.forEach(m => console.log(" - " + m.name));
        } else {
            console.error("❌ No models found! Error:", data);
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}
list();
