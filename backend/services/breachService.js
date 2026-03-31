const axios = require("axios");

// Determine severity from the list of exposed field names
function computeSeverity(fields = []) {
  const f = fields.map((x) => x.toLowerCase());
  const critical = ["password", "plaintext", "hash", "credit_card", "ssn", "cvv", "pin"];
  const high = ["phone", "address", "dob", "date_of_birth", "passport", "national_id"];
  if (f.some((x) => critical.includes(x))) return "high";
  if (f.some((x) => high.includes(x))) return "medium";
  return "low";
}

// Detect password type from exposed fields
function detectPasswordType(fields = []) {
  const f = fields.map((x) => x.toLowerCase());
  if (f.includes("plaintext")) return "plaintext";
  if (f.includes("hash")) {
    // Try to read hash type hint from source if available, default to "hash"
    return "hash";
  }
  if (f.includes("password")) return "unknown";
  return null;
}

// Map raw field names to friendlier labels
function friendlyFieldLabel(field) {
  const map = {
    password: "Password",
    plaintext: "Password (Plaintext)",
    hash: "Password Hash",
    email: "Email Address",
    phone: "Phone Number",
    username: "Username",
    name: "Full Name",
    address: "Home Address",
    dob: "Date of Birth",
    date_of_birth: "Date of Birth",
    ip: "IP Address",
    credit_card: "Credit Card",
    ssn: "Social Security Number",
    cvv: "CVV",
    pin: "PIN",
    national_id: "National ID",
    passport: "Passport Number",
    geolocation: "Geolocation",
    gender: "Gender",
    employer: "Employer",
    education: "Education",
    social: "Social Media",
  };
  return map[field.toLowerCase()] || field.charAt(0).toUpperCase() + field.slice(1);
}

const breachService = async (query, type = "email") => {
  if (!query) return [];

  try {
    const response = await axios.get(
      `https://leakcheck.io/api/v2/query/${encodeURIComponent(query)}?type=${type}`,
      {
        headers: {
          Accept: "application/json",
          "X-API-Key": process.env.LEAKCHECK_API_KEY,
        },
        timeout: 10000,
      }
    );

    const results = response.data?.result || [];

    return results.map((item, index) => {
      const rawFields = item.fields || [];
      const friendlyFields = rawFields.map(friendlyFieldLabel);

      return {
        id: String(index + 1),
        platform: item.source?.name || "Unknown Source",
        date: item.source?.breach_date || null,
        severity: computeSeverity(rawFields),
        dataExposed: friendlyFields,
        recordCount: item.source?.pwned_count || null,
        passwordType: detectPasswordType(rawFields),
      };
    });
  } catch (error) {
    if (error.response) {
      console.error("LeakCheck API error:", error.response.status, error.response.data);
    } else {
      console.error("LeakCheck request error:", error.message);
    }
    return [];
  }
};

module.exports = breachService;