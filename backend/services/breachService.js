const axios = require("axios");
const crypto = require("crypto");

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function computeSeverity(fields = [], passwordRisk = "") {
  const f = fields.map((x) => x.toLowerCase()).join(" ");
  const risk = (passwordRisk || "").toLowerCase();

  if (
    f.includes("password") ||
    f.includes("credit") ||
    f.includes("ssn") ||
    f.includes("cvv") ||
    f.includes("pin") ||
    risk === "plaintext"
  )
    return "high";

  if (
    f.includes("phone") ||
    f.includes("address") ||
    f.includes("birth") ||
    f.includes("passport") ||
    f.includes("national")
  )
    return "medium";

  return "low";
}

function mapPasswordRisk(risk = "") {
  const r = (risk || "").toLowerCase();
  if (r === "plaintext") return "plaintext";
  if (r === "easytocrack") return "weak hash";
  if (r === "hardtocrack") return "strong hash";
  if (r === "stronghash") return "strong hash";
  return null;
}

function friendlyField(field = "") {
  const f = field.toLowerCase().trim();
  const map = {
    "email addresses": "Email Address",
    "email address": "Email Address",
    emails: "Email Address",
    passwords: "Password",
    password: "Password",
    usernames: "Username",
    username: "Username",
    "phone numbers": "Phone Number",
    "phone number": "Phone Number",
    names: "Full Name",
    name: "Full Name",
    "dates of birth": "Date of Birth",
    "date of birth": "Date of Birth",
    dob: "Date of Birth",
    "ip addresses": "IP Address",
    "ip address": "IP Address",
    "geographic locations": "Location",
    location: "Location",
    "credit card": "Credit Card",
    "profile photos": "Profile Photo",
    "social media profiles": "Social Media Profile",
    genders: "Gender",
    gender: "Gender",
    "physical addresses": "Home Address",
    address: "Home Address",
  };
  return map[f] || field.charAt(0).toUpperCase() + field.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE 1: XposedOrNot (100% free, no API key, comprehensive)
// Endpoint: https://api.xposedornot.com/v1/breach-analytics?email=<email>
// ─────────────────────────────────────────────────────────────────────────────

async function checkXposedOrNot(email) {
  try {
    const response = await axios.get(
      `https://api.xposedornot.com/v1/breach-analytics`,
      {
        params: { email },
        headers: {
          Accept: "application/json",
          "User-Agent": "DigitalFootprintAnalyzer/1.0",
        },
        timeout: 12000,
      }
    );

    const data = response.data;

    // "Not found" response = clean email
    if (data?.Error === "Not found" || !data?.ExposedBreaches) {
      return [];
    }

    const breachDetails = data.ExposedBreaches?.breaches_details || [];

    return breachDetails.map((item, index) => {
      const rawFields = (item.xposed_data || "")
        .split(";")
        .map((f) => f.trim())
        .filter(Boolean);

      const friendlyFields = rawFields.map(friendlyField);
      const passwordRisk = item.password_risk || "";

      return {
        id: String(index + 1),
        platform: item.breach || "Unknown",
        date: item.xposed_date ? String(item.xposed_date) : null,
        severity: computeSeverity(rawFields, passwordRisk),
        dataExposed: friendlyFields,
        recordCount:
          typeof item.xposed_records === "number" ? item.xposed_records : null,
        passwordType: mapPasswordRisk(passwordRisk),
        description: item.details || null,
        domain: item.domain || null,
        verified: item.verified === "Yes" || item.verified === true,
        source: "xposedornot",
      };
    });
  } catch (error) {
    if (error?.response?.status === 404) {
      // 404 = email not found in any breach (clean)
      return [];
    }
    console.error(
      "XposedOrNot error:",
      error?.response?.status,
      error?.message
    );
    throw error; // propagate so fallback can run
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE 2: LeakCheck (free tier — 50 queries/day, existing key)
// Endpoint: https://leakcheck.io/api/v2/query/<query>?type=<type>
// ─────────────────────────────────────────────────────────────────────────────

async function checkLeakCheck(query, type = "email") {
  const key = process.env.LEAKCHECK_API_KEY;
  if (!key) return [];

  try {
    const response = await axios.get(
      `https://leakcheck.io/api/v2/query/${encodeURIComponent(query)}?type=${type}`,
      {
        headers: {
          Accept: "application/json",
          "X-API-Key": key,
        },
        timeout: 10000,
      }
    );

    const results = response.data?.result || [];

    return results.map((item, index) => {
      const rawFields = item.fields || [];
      const friendlyFields = rawFields.map((f) => friendlyField(f));

      return {
        id: String(index + 1),
        platform: item.source?.name || "Unknown Source",
        date: item.source?.breach_date || null,
        severity: computeSeverity(rawFields),
        dataExposed: friendlyFields,
        recordCount: item.source?.pwned_count || null,
        passwordType: rawFields.includes("plaintext")
          ? "plaintext"
          : rawFields.includes("hash")
          ? "hash"
          : null,
        source: "leakcheck",
      };
    });
  } catch (error) {
    const status = error?.response?.status;
    if (status === 403 || status === 401) {
      // Key expired or plan ended — silently skip, XposedOrNot is primary
      console.warn("[Breach] LeakCheck key inactive (403). Skipping.");
    } else {
      console.error("LeakCheck error:", status, error?.message);
    }
    return [];
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// MERGE: deduplicate by platform name across both sources
// ─────────────────────────────────────────────────────────────────────────────

function mergeBreaches(primary, fallback) {
  const seen = new Set(primary.map((b) => b.platform?.toLowerCase()));
  const unique = fallback.filter(
    (b) => !seen.has(b.platform?.toLowerCase())
  );
  return [
    ...primary,
    ...unique.map((b, i) => ({ ...b, id: String(primary.length + i + 1) })),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT: Multi-source breach service
// ─────────────────────────────────────────────────────────────────────────────

const breachService = async (query, type = "email") => {
  if (!query) return [];

  const isEmail = type === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);

  let xonResults = [];
  let lcResults = [];

  // XposedOrNot works only for email addresses
  if (isEmail) {
    try {
      xonResults = await checkXposedOrNot(query);
      console.log(
        `[Breach] XposedOrNot: ${xonResults.length} results for ${query}`
      );
    } catch (_err) {
      console.warn("[Breach] XposedOrNot failed, trying LeakCheck fallback…");
    }
  }

  // Always try LeakCheck as secondary/fallback for any query type
  lcResults = await checkLeakCheck(query, type);
  console.log(
    `[Breach] LeakCheck: ${lcResults.length} results for ${query}`
  );

  const merged = mergeBreaches(xonResults, lcResults);
  console.log(`[Breach] Total after merge: ${merged.length}`);
  return merged;
};

module.exports = breachService;