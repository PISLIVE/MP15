const socialScanner = require("./services/socialScanner");

async function test() {
  process.env.DEBUG_SCANNER = "true";
  const username = "_princeboro_";
  console.log(`Testing social scanner for: ${username}...`);
  try {
    const results = await socialScanner(username);
    console.log("Results found:", results.length);
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("Scanner crashed:", error);
  }
}

test();
