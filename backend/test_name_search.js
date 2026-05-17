/**
 * Test script for name-based social search
 * Run: node test_name_search.js
 */
require("dotenv").config();

const nameToSocialSearch = require("./services/nameSearchService");

async function test() {
  const name = "Debanjani Saikia";
  console.log(`\n=== Testing name-based social search for: "${name}" ===\n`);
  
  console.log("GOOGLE_API_KEY:", process.env.GOOGLE_API_KEY ? "✅ Set" : "❌ Missing");
  console.log("GOOGLE_SEARCH_ENGINE_ID:", process.env.GOOGLE_SEARCH_ENGINE_ID ? "✅ Set" : "❌ Missing");
  console.log("");

  try {
    const results = await nameToSocialSearch(name);
    console.log(`\n=== Results: ${results.length} profile(s) found ===\n`);
    if (results.length > 0) {
      results.forEach((r, i) => {
        console.log(`${i + 1}. [${r.platform}] ${r.url}`);
        console.log(`   Name: ${r.profileData?.name}`);
        console.log(`   Bio: ${r.profileData?.bio?.substring(0, 100) || "N/A"}`);
        console.log(`   Source: ${r.source}`);
        console.log("");
      });
    } else {
      console.log("No profiles found. This could mean:");
      console.log("  - Google CSE quota exhausted (check 403/429 errors above)");
      console.log("  - The CSE is configured to search specific sites only");
      console.log("  - The name doesn't appear on indexed social profiles");
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("HTTP Status:", error.response.status);
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

test();
