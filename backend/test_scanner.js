// Quick test script — run with: node test_scanner.js
require("dotenv").config();
const socialScanner = require("./services/socialScanner");

const username = process.argv[2] || "_princeboro_";

console.log(`\n🔍 Scanning username: "${username}"\n`);
console.log("────────────────────────────────────────────");

socialScanner(username).then((results) => {
  if (results.length === 0) {
    console.log("❌ No accounts found.");
  } else {
    console.log(`✅ Found ${results.length} account(s):\n`);
    results.forEach((r) => {
      console.log(`  🌐 ${r.platform}`);
      console.log(`     URL    : ${r.url}`);
      console.log(`     Source : ${r.source}`);
      console.log(`     Name   : ${r.profileData?.name || "—"}`);
      console.log(`     Score  : ${r.profileData?.visibilityScore || "—"}`);
      if (r.profileData?.note) console.log(`     Note   : ${r.profileData.note}`);
      console.log("");
    });
  }
  process.exit(0);
}).catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
