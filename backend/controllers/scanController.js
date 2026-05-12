const { supabase } = require("../config/database");
const socialScanner = require("../services/socialScanner");
const breachService = require("../services/breachService");
const googleScanner = require("../services/googleScanner");
const mentionScanner = require("../services/mentionScanner");
const emailScanner = require("../services/emailScanner");
const calculateRiskScore = require("../utils/riskScore");
const aiService = require("../services/aiService");

// ─── SIMPLE IN-MEMORY CACHE ──────────────────────────────────────────────────
// Reduces redundant API calls for repeated identical searches.
// TTL: 15 minutes.
const scanCache = new Map();
const CACHE_TTL = 15 * 60 * 1000; 

function getCacheKey(data) {
  const { name, email, username } = data;
  return `n:${name || ""}|e:${email || ""}|u:${username || ""}`.toLowerCase();
}

function cleanCache() {
  const now = Date.now();
  for (const [key, value] of scanCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) scanCache.delete(key);
  }
}
setInterval(cleanCache, 5 * 60 * 1000); // Cleanup every 5 mins

const scanProfile = async (req, res) => {
  try {
    const { name, email, username } = req.body;

    if (!name && !email && !username) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field: name, email, or username"
      });
    }

    // ── Check Cache First ────────────────────────────────────────────────────
    const cacheKey = getCacheKey({ name, email, username });
    if (scanCache.has(cacheKey)) {
      const cached = scanCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Cache] Returning cached result for: ${cacheKey}`);
        return res.status(200).json({
          success: true,
          cached: true,
          data: cached.data
        });
      }
    }

    const whoisScanner = require("../services/whoisScanner");
    const scanErrors = [];

    // Run all scanners CONCURRENTLY for maximum speed
    const [
      whoisResult,
      socialResult,
      googleResult,
      mentionResult,
      breachResult,
      emailResult
    ] = await Promise.allSettled([
      // WHOIS: only if it looks like a domain
      username && username.includes(".") ? whoisScanner(username) : Promise.resolve(null),
      // Social scanner: by username
      username ? socialScanner(username) : Promise.resolve([]),
      // Google search: by name and/or username
      googleScanner(name, username),
      // Mention scanner: by name and/or username
      mentionScanner(name, username),
      // Breach: prefer email, fallback to username
      email ? breachService(email, "email") : (username ? breachService(username, "username") : Promise.resolve([])),
      // Email OSINT: only if email is provided
      email ? emailScanner(email) : Promise.resolve(null)
    ]);

    // Extract results or capture errors
    const whoisResults = whoisResult.status === "fulfilled" ? whoisResult.value : null;
    if (whoisResult.status === "rejected") scanErrors.push("WHOIS lookup failed.");

    const socialResults = socialResult.status === "fulfilled" ? (socialResult.value || []) : [];
    if (socialResult.status === "rejected") scanErrors.push("Social Scan Failed: " + socialResult.reason?.message);

    const googleResults = googleResult.status === "fulfilled" ? (googleResult.value || []) : [];
    if (googleResult.status === "rejected") {
      const reason = googleResult.reason;
      if (reason?.code === "GOOGLE_RATE_LIMIT") {
        scanErrors.push("Google Search: Temporary rate limit. Try scanning again in 1 minute.");
      } else if (reason?.code === "GOOGLE_QUOTA_EXHAUSTED") {
        scanErrors.push("Google Search: Daily quota reached. Results will resume tomorrow.");
      } else {
        scanErrors.push("Google Search Error: " + (reason?.message || "Internal Error"));
      }
    }

    const mentionResults = mentionResult.status === "fulfilled" ? (mentionResult.value || []) : [];
    if (mentionResult.status === "rejected") scanErrors.push("Mention Scan Failed: " + mentionResult.reason?.message);

    // --- HEURISTIC DISCOVERY: Move social profile links from search to socialResults ---
    const discoveredSocial = [];
    const socialPlatforms = ["instagram.com", "facebook.com", "twitter.com", "x.com", "linkedin.com", "github.com", "threads.net", "reddit.com", "youtube.com"];
    
    [...googleResults, ...mentionResults].forEach(item => {
      const link = (item.link || "").toLowerCase();
      const platformDomain = socialPlatforms.find(domain => link.includes(domain));
      if (platformDomain) {
        // Only add if not already in socialResults
        const alreadyExists = socialResults.some(s => s.url?.toLowerCase().includes(link) || link.includes(s.url?.toLowerCase()));
        if (!alreadyExists) {
          discoveredSocial.push({
            platform: platformDomain.split('.')[0].charAt(0).toUpperCase() + platformDomain.split('.')[0].slice(1),
            url: item.link,
            found: true,
            source: "discovery",
            profileData: { name: item.title, bio: item.snippet }
          });
        }
      }
    });
    socialResults.push(...discoveredSocial);

    const breachResults = breachResult.status === "fulfilled" ? (breachResult.value || []) : [];
    if (breachResult.status === "rejected") scanErrors.push("Breach API Limit reached or Error.");

    const emailResults = emailResult?.status === "fulfilled" ? emailResult.value : null;
    if (emailResult?.status === "rejected") scanErrors.push("Email OSINT Scan Failed.");

    const riskScore = calculateRiskScore({
      socialResults,
      breachResults,
      googleResults
    });

    // Generate AI Security Insight
    const aiSummary = await aiService.generateSecuritySummary({
      socialResults,
      breachResults,
      googleResults,
      riskScore
    });

    // Save to database (non-blocking — don't fail the API if this fails)
    supabase
      .from("scan_history")
      .insert({
        query: name || username || email,
        social_results: socialResults,
        breach_results: breachResults,
        google_results: googleResults,
        mention_results: mentionResults,
        risk_score: riskScore.score,
        ai_summary: aiSummary
      })
      .then(({ error: insertError }) => {
        if (insertError) {
          console.error("Supabase insert error:", insertError.message);
        }
      });

    const responseData = {
      input: { name, email, username },
      whoisResults,
      socialResults,
      breachResults,
      googleResults,
      mentionResults,
      emailResults,
      riskScore,
      aiSummary
    };

    // Store in Cache
    scanCache.set(cacheKey, {
      timestamp: Date.now(),
      data: responseData
    });

    res.status(200).json({
      success: true,
      errors: scanErrors.length > 0 ? scanErrors : undefined,
      data: responseData
    });
  } catch (error) {
    console.error("Scan error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while scanning profile"
    });
  }
};

const getScanHistory = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("scan_history")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch scan history"
    });
  }
};

const getScanById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("scan_history")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: "Scan record not found"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch scan details"
    });
  }
};

const deleteScan = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("scan_history")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete scan record"
      });
    }

    res.status(200).json({
      success: true,
      message: "Scan record deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during deletion"
    });
  }
};

module.exports = { scanProfile, getScanHistory, getScanById, deleteScan };