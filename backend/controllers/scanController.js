const { supabase } = require("../config/database");
const dns = require('dns').promises;
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
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

    // Basic Input Validation (Length & Type) to prevent ReDoS and memory crashes
    const isValidString = (val) => typeof val === "string" && val.length <= 100;
    if ((name && !isValidString(name)) || (email && !isValidString(email)) || (username && !isValidString(username))) {
      return res.status(400).json({
        success: false,
        message: "Input fields must be strings and under 100 characters."
      });
    }

    // ── Check Cache First ────────────────────────────────────────────────────
    const cacheKey = getCacheKey({ name, email, username });
    if (scanCache.has(cacheKey)) {
      const cached = scanCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`[Cache] Returning cached result for: ${cacheKey}`);
        
        // We still need to save this to the user's history even if it was a cache hit!
        await supabase.from("scan_history").insert({
          user_id: req.user?.id,
          query: name || username || email,
          social_results: cached.data.socialResults,
          breach_results: cached.data.breachResults,
          google_results: cached.data.googleResults,
          mention_results: cached.data.mentionResults,
          email_results: cached.data.emailResults,
          whois_results: cached.data.whoisResults,
          risk_score: cached.data.riskScore?.score || 0,
          ai_summary: cached.data.aiSummary
        });

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

    const nameFromUsername = (!name && username)
      ? username.replace(/[._\-0-9]/g, " ").trim()
      : null;

    // The effective name/username for scanners that need them
    const effectiveName = name || nameFromEmail || nameFromUsername || null;
    const effectiveUsername = username || emailPrefix || null;

    // ── PRECISION SCAN TARGETS ───────────────────────────────────────────────
    // socialScanTargets = usernames to check via direct HTTP/platform-specific calls.
    // We do NOT generate speculative variants here — that was causing false positives
    // (e.g. scanning 'bsaikia' and finding a completely different person's profile).
    //
    // Rule:
    //   - If username is explicitly provided → scan ONLY that exact username.
    //   - If only a name is given (no username) → try the 3 most likely canonical
    //     forms (no-separator, dot, underscore) as a best-effort.
    //   - If only email → use the email prefix as the username.

    let socialScanTargets = [];
    if (effectiveUsername) {
      // Exact match only — no speculation
      socialScanTargets = [effectiveUsername];
    } else if (effectiveName) {
      const parts = effectiveName.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        // Three canonical forms: firstlast, first.last, first_last
        socialScanTargets = [
          parts.join(""),    // bhaskarsaikia
          parts.join("."),   // bhaskar.saikia
          parts.join("_"),   // bhaskar_saikia
        ];
      } else {
        socialScanTargets = [parts[0]].filter(Boolean);
      }
    }
    socialScanTargets = [...new Set(socialScanTargets)]; // deduplicate

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
      // Social scanner: scan only exact/canonical targets via direct HTTP checks.
      // No variant explosion — we check only what the user explicitly gave us,
      // or the 3 top canonical forms if only a name was supplied.
      socialScanTargets.length > 0
        ? Promise.all(socialScanTargets.map(v => socialScanner(v, strictMode ? effectiveName : null))).then(results => results.flat())
        : Promise.resolve([]),
      // Google search: by name/username, or by email-derived identifiers
      googleScanner(effectiveName, effectiveUsername),
      // Mention scanner: by name/username, or by email-derived identifiers
      mentionScanner(effectiveName, effectiveUsername),
      // Breach: prefer email, fallback to username
      email ? breachService(email, "email") : (username ? breachService(username, "username") : Promise.resolve([])),
      // Email OSINT: only if email is provided
      email ? emailScanner(email) : Promise.resolve(null),
      // Name-based social search via Google/SerpAPI.
      // Search by name AND by exact username separately to maximise recall.
      (() => {
        const terms = new Set();
        if (effectiveName) terms.add(effectiveName);
        if (effectiveUsername) terms.add(effectiveUsername);
        // Also try the raw username string (e.g. "bhaskar_saikia1") as a search term
        // in addition to the derived name ("bhaskar saikia")
        if (username) terms.add(username);
        return Promise.all([...terms].map(t => nameToSocialSearch(t)))
          .then(results => results.flat());
      })()
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

    // ── PRECISION DEDUPLICATION ────────────────────────────────────────────────
    // Merge all social results (from direct scan + name-based search + heuristic
    // discovery) and keep the highest-confidence result per platform.
    // Source priority: direct/API > search > name-search > discovery
    const SOURCE_PRIORITY = {
      "instagram-api": 100, "direct": 90, "instagram-oembed": 85,
      "instagram-html": 80, "instagram-serpapi": 75, "instagram-redirect": 70,
      "facebook-redirect": 65, "tiktok": 60, "direct-login-wall": 55,
      "search": 40, "instagram-search": 35, "name-search": 30, "discovery": 20,
    };
    const getSourcePriority = (src) => SOURCE_PRIORITY[src] || 25;
    const normalizeUrlForDedup = (u) =>
      String(u || "").toLowerCase()
        .replace(/^https?:\/\/(www\.)?/, "")
        .replace(/\/+$/, "")
        .trim();

    function deduplicateSocialResults(results) {
      // Key by platform + normalized URL
      const byKey = new Map();
      for (const r of results) {
        const platform = (r.platform || "").toLowerCase();
        const normUrl = normalizeUrlForDedup(r.url);
        const key = `${platform}|${normUrl}`;
        const existing = byKey.get(key);
        if (!existing || getSourcePriority(r.source) > getSourcePriority(existing.source)) {
          byKey.set(key, r);
        }
      }
      // Secondary: if same platform, same domain path, keep best source
      // (handles cases where URL has/lacks trailing slash or www)
      const platformBest = new Map();
      for (const r of byKey.values()) {
        const platform = (r.platform || "").toLowerCase();
        const existing = platformBest.get(platform);
        // Only collapse same-platform results if URLs are on the same domain (not two diff accounts)
        if (!existing) {
          platformBest.set(platform, r);
        } else {
          const existUrl = normalizeUrlForDedup(existing.url);
          const newUrl = normalizeUrlForDedup(r.url);
          // If URLs share >80% of their path, they're the same account — keep best source
          const commonLen = Math.min(existUrl.length, newUrl.length);
          const overlap = commonLen > 0 && (existUrl.includes(newUrl.split("/").pop() || "") ||
            newUrl.includes(existUrl.split("/").pop() || ""));
          if (overlap && getSourcePriority(r.source) > getSourcePriority(existing.source)) {
            platformBest.set(platform, r);
          } else if (!overlap) {
            // Different account for same platform — keep both (use key-based map)
            platformBest.set(`${platform}|${newUrl}`, r);
          }
        }
      }
      return Array.from(platformBest.values());
    }

    // Merge nameSearch + heuristic discovery into social results
    // Heuristic discovery: social profile links surfaced by googleScanner/mentionScanner
    const SOCIAL_DOMAINS = {
      "instagram.com": "Instagram", "facebook.com": "Facebook",
      "twitter.com": "X", "x.com": "X", "linkedin.com": "LinkedIn",
      "github.com": "GitHub", "threads.net": "Threads",
      "reddit.com": "Reddit", "youtube.com": "YouTube",
      "tiktok.com": "TikTok", "pinterest.com": "Pinterest",
    };

    const allSocialResults = [...socialResults, ...nameSearchResults];
    // Add heuristic results from Google/mention search
    [...googleResults, ...mentionResults].forEach(item => {
      const link = (item.link || "").toLowerCase();
      const domain = Object.keys(SOCIAL_DOMAINS).find(d => link.includes(d));
      if (domain) {
        allSocialResults.push({
          platform: SOCIAL_DOMAINS[domain],
          url: item.link,
          found: true,
          source: "discovery",
          profileData: { name: item.title, bio: item.snippet }
        });
      }
    });

    socialResults = deduplicateSocialResults(allSocialResults);

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

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    
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

const scanDomains = async (req, res) => {
  try {
    const { baseName } = req.body;
    if (!baseName) return res.status(400).json({ success: false, message: "Base name required" });

    const base = baseName.toLowerCase().replace(/[^a-z0-9]/gi, '');
    const domainsToCheck = [
      { domain: `${base}-security.com`, desc: "Common IT support phishing pattern." },
      { domain: `${base}login.net`, desc: "Credential harvesting pattern." },
      { domain: `${base.replace(/o/g, '0').replace(/e/g, '3')}.com`, desc: "Homoglyph substitution." },
      { domain: `${base}-support.org`, desc: "Customer service impersonation." },
      { domain: `${base}app.io`, desc: "Common SaaS application pattern." }
    ];

    const results = await Promise.all(domainsToCheck.map(async (d) => {
      try {
        await dns.resolve(d.domain);
        return { ...d, status: "registered", risk: "high" };
      } catch (err) {
        return { ...d, status: "available", risk: "low" };
      }
    }));

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: "Domain scan failed" });
  }
};

const scanImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });

    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(200).json({
        success: true,
        mockFallback: true,
        data: [
          { platform: "API Key Missing", match: "0%", status: "safe", description: "Please add SERPAPI_KEY to your .env file to see real results. For now, this is a placeholder.", date: "Now" }
        ]
      });
    }

    // Call SerpApi Google Lens
    // Note: SerpApi doesn't natively accept binary uploads. 
    // Wait, let's use a workaround or Google Reverse Image search endpoint of Serpapi if it supports image_url.
    // If the image is local, we would need to upload it somewhere public first (like ImgBB) or use an API that supports direct file upload.
    // However, since we don't have ImgBB key, we'll inform the user.
    fs.unlinkSync(req.file.path);
    return res.status(200).json({
      success: true,
      mockFallback: true,
      data: [
        { platform: "Local Image Upload Not Supported", match: "0%", status: "medium_risk", description: "To scan a local image via SerpApi, it must first be hosted on a public URL. Please configure an image hosting service (like ImgBB) in your backend.", date: "Now" }
      ]
    });

  } catch (error) {
    console.error("Image scan failed:", error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: "Image scan failed" });
  }
};

module.exports = { 
  scanProfile, 
  getScanHistory, 
  getScanById, 
  deleteScan,
  generatePhishingEmail,
  scanDomains,
  scanImage
};