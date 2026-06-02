const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: __dirname + "/.env" });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkHistory() {
  const { data, error } = await supabase
    .from("scan_history")
    .select("id, query, risk_score, created_at")
    .order("created_at", { ascending: false })
    .limit(10);
    
  if (error) console.error("Error:", error);
  console.log(JSON.stringify(data, null, 2));
}

checkHistory();
