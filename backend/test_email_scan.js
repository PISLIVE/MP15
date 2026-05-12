const emailScanner = require("./services/emailScanner");

async function testEmailScanner() {
  const email = "boroprince9@gmail.com";
  console.log(`Testing emailScanner with: ${email}`);
  
  const result = await emailScanner(email);
  console.log(JSON.stringify(result, null, 2));
}

testEmailScanner();
