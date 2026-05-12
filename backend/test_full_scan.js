const dotenv = require("dotenv");
const path = require("path");

// Load env from the same directory
dotenv.config({ path: path.join(__dirname, ".env") });

const socialScanner = require("./services/socialScanner");
const googleScanner = require("./services/googleScanner");
const breachService = require("./services/breachService");
const aiService = require("./services/aiService");
const emailScanner = require("./services/emailScanner");
const calculateRiskScore = require("./utils/riskScore");

async function runTestScan() {
  const testUsername = "_princeboro_";
  const testName = "Prince Boro";
  const testEmail = "boroprince9@gmail.com";

  console.log(`\n🚀 STARTING FULL TEST SCAN FOR: ${testUsername} / ${testName}\n`);
  console.log("─────────────────────────────────────────────────────────────────");

  try {
    // 1. Social Scan
    console.log("🔍 Scanning Social Media...");
    const socialResults = await socialScanner(testUsername);
    console.log(`✅ Found ${socialResults.length} profiles.`);

    // 2. Google Search Scan
    console.log("🔍 Scanning Google mentions...");
    let googleResults = [];
    try {
      googleResults = await googleScanner(testName, testUsername);
      console.log(`✅ Found ${googleResults.length} web mentions.`);
    } catch (e) {
      console.warn(`⚠️ Google Search Skill: ${e.message}`);
    }

    // 3. Breach Scan
    console.log("🔍 Checking for Data Breaches...");
    const breachResults = await breachService(testEmail, "email");
    console.log(`✅ Found ${breachResults.length} breaches.`);

    // 4. Risk Score
    const riskScore = calculateRiskScore({
      socialResults,
      breachResults,
      googleResults
    });
    console.log(`📊 Risk Score: ${riskScore.score}/100 (${riskScore.level})`);

    // 4.5 Email OSINT Scan
    console.log("🔍 Scanning Email Intelligence...");
    const emailResults = await emailScanner(testEmail);
    console.log(`✅ Found Email info for ${testEmail} (Deliverability: ${emailResults?.deliverability?.canReceive ? 'Yes' : 'No'})`);

    // 5. AI Insight
    console.log("🤖 Generating AI Security Insight...");
    const aiSummary = await aiService.generateSecuritySummary({
      socialResults,
      breachResults,
      googleResults,
      riskScore
    });

    console.log("\n─────────────────────────────────────────────────────────────────");
    console.log("\n✨ AI SECURITY INSIGHT:\n");
    console.log(aiSummary);
    console.log("\n─────────────────────────────────────────────────────────────────");
    
    console.log("\n✅ SCAN COMPLETED SUCCESSFULLY.");

  } catch (error) {
    console.error("\n❌ TEST FAILED:", error);
  }
}

runTestScan();
