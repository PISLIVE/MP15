const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: __dirname + "/.env" });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  const { data, error } = await supabase
    .from("scan_history")
    .insert({
      user_id: null,
      query: "Test Insert",
      social_results: [],
      breach_results: [],
      google_results: [],
      mention_results: [],
      risk_score: 50,
      ai_summary: "Test"
    });
    
  if (error) {
    console.error("Insert Error:", JSON.stringify(error, null, 2));
  } else {
    console.log("Insert Success:", data);
  }
}

testInsert();
