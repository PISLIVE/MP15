const { GoogleGenerativeAI } = require("@google/generative-ai");
// Environment variables are typically loaded in server.js, so we don't need a redundant call here.

/**
 * Generates a professional AI security summary based on scan results.
 * @param {Object} scanData - The results from social, breach, and web mention scanners.
 * @returns {Promise<string>} - The AI generated advice.
 */
async function generateSecuritySummary(scanData) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      console.warn("⚠️ Gemini API key not configured. Skipping AI summary.");
      return "AI Security Insight: Key Missing. Please check your .env file.";
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We try multiple model identifiers to ensure compatibility
    // --- Fallback Model Registry ---
    const modelNames = [
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
      "gemini-2.5-flash-preview-05-20",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro"
    ];
    let lastError;

    for (const modelName of modelNames) {
      try {
        console.log(`[AI Service] Attempting to use model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `
          You are a world-class Cybersecurity and Privacy expert. 
          Analyze the following digital footprint scan results for a user and provide a professional, concise, and actionable security advice paragraph (max 150 words).
          
          Scan Results:
          - Social Media Profiles Found: ${JSON.stringify(scanData.socialResults)}
          - Data Breaches Found: ${JSON.stringify(scanData.breachResults)}
          - Google Search Mentions: ${JSON.stringify(scanData.googleResults)}
          - Risk Score: ${scanData.riskScore?.score || "N/A"}
          
          Your advice should:
          1. Highlight the most critical risk if any (e.g., leaked passwords in breaches).
          2. Suggest 1-2 immediate steps they can take (e.g., enable 2FA, adjust privacy settings).
          3. Sound professional, helpful, and not overly alarmist.
          4. Use Markdown for highlighting key terms.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (text) {
          console.log(`✅ AI Insight generated successfully using ${modelName}`);
          return text;
        }
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} failed:`, err.message);
        lastError = err;
        // Continue to next model
      }
    }

    // If we reach here, all models failed
    console.error("❌ All Gemini AI models failed. Last error:", lastError?.message);
    
    const errorMsg = lastError?.message?.toLowerCase() || "";
    
    if (errorMsg.includes("limit: 0") || errorMsg.includes("quota")) {
      return "AI Security Insight: You have reached the daily limit for the AI analyzer. Personal insights will resume tomorrow.";
    }

    if (lastError?.status === 429 || errorMsg.includes("429")) {
      return "AI Security Insight: The AI is currently busy (Rate Limit). Please wait 1 minute and try again.";
    }

    if (lastError?.status === 404 || errorMsg.includes("not found")) {
      return "AI Security Insight: Model configuration issue. Please verify your API Key permissions and enabled models in Google AI Studio.";
    }

    if (errorMsg.includes("api_key_invalid")) {
      return "AI Security Insight: Error (Invalid API Key). Please check your .env file settings.";
    }

    return "AI Security Insight: The AI is temporarily unavailable. Please verify your API key permissions in Google AI Studio.";
  } catch (error) {
    console.error("❌ Gemini AI Critical Error:", error);
    return "AI Security Insight: The AI is temporarily unavailable. Please try again later.";
  }
}

module.exports = { generateSecuritySummary };
