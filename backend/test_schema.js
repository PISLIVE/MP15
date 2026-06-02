const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: __dirname + "/.env" });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data, error } = await supabase
    .from("scan_history")
    .select("*")
    .limit(1);
    
  if (error) console.error("Error:", error);
  console.log("Columns:", Object.keys(data[0] || {}));
}

checkSchema();
