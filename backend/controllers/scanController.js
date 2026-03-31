const { supabase } = require("../config/database");
const socialScanner = require("../services/socialScanner");
const breachService = require("../services/breachService");
const googleScanner = require("../services/googleScanner");
const mentionScanner = require("../services/mentionScanner");
const calculateRiskScore = require("../utils/riskScore");

const scanProfile = async (req, res) => {
  try {
    const { name, email, username } = req.body;

    if (!name && !email && !username) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field: name, email, or username"
      });
    }

    const whoisScanner = require("../services/whoisScanner");
    const scanErrors = [];

    // Run all scanners CONCURRENTLY for maximum speed
    const [
      whoisResult,
      socialResult,
      googleResult,
      mentionResult,
      breachResult
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
      email ? breachService(email, "email") : (username ? breachService(username, "username") : Promise.resolve([]))
    ]);

    // Extract results or capture errors
    const whoisResults = whoisResult.status === "fulfilled" ? whoisResult.value : null;
    if (whoisResult.status === "rejected") scanErrors.push("WHOIS lookup failed.");

    const socialResults = socialResult.status === "fulfilled" ? (socialResult.value || []) : [];
    if (socialResult.status === "rejected") scanErrors.push("Social Scan Failed: " + socialResult.reason?.message);

    const googleResults = googleResult.status === "fulfilled" ? (googleResult.value || []) : [];
    if (googleResult.status === "rejected") scanErrors.push("Google Search Quota limit reached or API Error.");

    const mentionResults = mentionResult.status === "fulfilled" ? (mentionResult.value || []) : [];
    if (mentionResult.status === "rejected") scanErrors.push("Mention Scan Failed: " + mentionResult.reason?.message);

    const breachResults = breachResult.status === "fulfilled" ? (breachResult.value || []) : [];
    if (breachResult.status === "rejected") scanErrors.push("Breach API Limit reached or Error.");

    const riskScore = calculateRiskScore({
      socialResults,
      breachResults,
      googleResults
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
        risk_score: riskScore.score
      })
      .then(({ error: insertError }) => {
        if (insertError) {
          console.error("Supabase insert error:", insertError.message);
        }
      });

    res.status(200).json({
      success: true,
      errors: scanErrors.length > 0 ? scanErrors : undefined,
      data: {
        input: { name, email, username },
        whoisResults,
        socialResults,
        breachResults,
        googleResults,
        mentionResults,
        riskScore
      }
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