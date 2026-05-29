const { supabase } = require("../config/database");
const socialScanner = require("../services/socialScanner");
const breachService = require("../services/breachService");
const googleScanner = require("../services/googleScanner");
const mentionScanner = require("../services/mentionScanner");
const emailScanner = require("../services/emailScanner");
const calculateRiskScore = require("../utils/riskScore");
const aiService = require("../services/aiService");
const nameToSocialSearch = require("../services/nameSearchService");

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
    const { name, email, username, strictMode } = req.body;

    console.log(`\n╔═══════════════════════════════════════════════════╗`);
    console.log(`║  SCAN REQUEST RECEIVED                            ║`);
    console.log(`╠═══════════════════════════════════════════════════╣`);
    console.log(`║  Name:     ${(name || "—").padEnd(38)}║`);
    console.log(`║  Email:    ${(email || "—").padEnd(38)}║`);
    console.log(`║  Username: ${(username || "—").padEnd(38)}║`);
    console.log(`╚═══════════════════════════════════════════════════╝`);

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

    // ── Derive useful identifiers from email when name/username are missing ──
    // e.g. "john.doe@gmail.com" → emailPrefix = "john.doe"
    const emailPrefix = email ? email.split("@")[0].toLowerCase() : null;

    // Build a search-friendly name from email prefix if no name was given
    // e.g. "john.doe" → "john doe", "john_doe123" → "john doe"
    const nameFromEmail = (!name && emailPrefix)
      ? emailPrefix.replace(/[._\-]/g, " ").replace(/[0-9]+/g, "").trim()
      : null;

    // The effective name/username for scanners that need them
    const effectiveName = name || nameFromEmail || null;
    const effectiveUsername = username || emailPrefix || null;

    // When only a name is provided (or derived from email), generate username variants
    // e.g. "Debanjani Saikia" → ["debanjanisaikia", "debanjani.saikia", "debanjani_saikia"]
    const usernameForSocial = username || null;
    let nameVariants = [];
    if (!username && effectiveName) {
      const parts = effectiveName.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        nameVariants = [
          parts.join(""),        // debanjanisaikia
          parts.join("."),      // debanjani.saikia
          parts.join("_"),      // debanjani_saikia
        ];
      } else if (parts.length === 1) {
        nameVariants = [parts[0]];
      }
      // Also add the raw email prefix as a variant if it came from email
      if (emailPrefix && !username && !name) {
        if (!nameVariants.includes(emailPrefix)) {
          nameVariants.push(emailPrefix);
        }
      }
    }

    // Run all scanners CONCURRENTLY for maximum speed
    const [
      whoisResult,
      socialResult,
      googleResult,
      mentionResult,
      breachResult,
      emailResult,
      nameSearchResult
    ] = await Promise.allSettled([
      // WHOIS: only if it looks like a domain
      username && username.includes(".") ? whoisScanner(username) : Promise.resolve(null),
      // Social scanner: by username, OR by name-derived variants
      usernameForSocial
        ? socialScanner(usernameForSocial, strictMode ? effectiveName : null)
        : (nameVariants.length > 0
          ? Promise.all(nameVariants.map(v => socialScanner(v, strictMode ? effectiveName : null))).then(results => results.flat())
          : Promise.resolve([])),
      // Google search: by name/username, or by email-derived identifiers
      googleScanner(effectiveName, effectiveUsername),
      // Mention scanner: by name/username, or by email-derived identifiers
      mentionScanner(effectiveName, effectiveUsername),
      // Breach: prefer email, fallback to username
      email ? breachService(email, "email") : (username ? breachService(username, "username") : Promise.resolve([])),
      // Email OSINT: only if email is provided
      email ? emailScanner(email) : Promise.resolve(null),
      // Name-based social search: search Google for name on social platforms
      effectiveName ? nameToSocialSearch(effectiveName) : Promise.resolve([])
    ]);

    // Extract results or capture errors
    const whoisResults = whoisResult.status === "fulfilled" ? whoisResult.value : null;
    if (whoisResult.status === "rejected") scanErrors.push("WHOIS lookup failed.");

    let socialResults = socialResult.status === "fulfilled" ? (socialResult.value || []) : [];
    if (socialResult.status === "rejected") scanErrors.push("Social Scan Failed: " + socialResult.reason?.message);

    // Merge name-based social discovery results
    const nameSearchResults = nameSearchResult?.status === "fulfilled" ? (nameSearchResult.value || []) : [];
    if (nameSearchResult?.status === "rejected") {
      console.warn("Name-based social search failed:", nameSearchResult.reason?.message);
    }
    if (nameSearchResults.length > 0) {
      // Deduplicate: only add if URL not already in socialResults
      for (const nr of nameSearchResults) {
        const nrUrl = (nr.url || "").toLowerCase();
        const alreadyExists = socialResults.some(s => {
          const sUrl = (s.url || "").toLowerCase();
          return sUrl === nrUrl || sUrl.includes(nrUrl) || nrUrl.includes(sUrl);
        });
        if (!alreadyExists) {
          socialResults.push(nr);
        }
      }
    }

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
      googleResults,
      emailResults
    });

    console.log(`\n┌─── SCAN RESULTS SUMMARY ──────────────────────────┐`);
    console.log(`│  Social Profiles:  ${String(socialResults.length).padEnd(30)}│`);
    socialResults.forEach(s => console.log(`│    • [${s.platform}] ${s.url?.substring(0, 38).padEnd(38)}│`));
    console.log(`│  Google Results:   ${String(googleResults.length).padEnd(30)}│`);
    console.log(`│  Mention Results:  ${String(mentionResults.length).padEnd(30)}│`);
    console.log(`│  Breach Results:   ${String(breachResults.length).padEnd(30)}│`);
    console.log(`│  Name Search:      ${String(nameSearchResults.length).padEnd(30)}│`);
    if (scanErrors.length > 0) {
      console.log(`│  ⚠️  Errors: ${String(scanErrors.length).padEnd(35)}│`);
      scanErrors.forEach(e => console.log(`│    ! ${e.substring(0, 42).padEnd(42)}│`));
    }
    console.log(`└───────────────────────────────────────────────────┘\n`);

    // Generate AI Security Insight
    const aiSummary = await aiService.generateSecuritySummary({
      socialResults,
      breachResults,
      googleResults,
      riskScore
    });

    // Save to database
    await supabase
      .from("scan_history")
      .insert({
        user_id: req.user?.id,
        query: name || username || email,
        social_results: socialResults,
        breach_results: breachResults,
        google_results: googleResults,
        mention_results: mentionResults,
        email_results: emailResults,
        whois_results: whoisResults,
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

const generatePhishingEmail = async (req, res) => {
  try {
    const { targetData } = req.body;
    const emailContent = await aiService.generatePhishingSimulation(targetData);
    res.status(200).json({ success: true, data: emailContent });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to generate simulation" });
  }
};

module.exports = { 
  scanProfile, 
  getScanHistory, 
  getScanById, 
  deleteScan,
  generatePhishingEmail
};