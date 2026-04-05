const { supabase } = require("../config/database");
const { checkOneEmail } = require("../services/monitorService");

// ─── Add email to watchlist ───────────────────────────────────────────────────
const addMonitor = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user?.id;

    if (!email || !userId) {
      return res.status(400).json({ success: false, message: "Email and auth required" });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address" });
    }

    const { data, error } = await supabase
      .from("monitored_emails")
      .insert({ user_id: userId, email: email.toLowerCase().trim() })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ success: false, message: "This email is already being monitored." });
      }
      throw error;
    }

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("addMonitor error:", error.message);
    res.status(500).json({ success: false, message: "Failed to add email to watchlist" });
  }
};

// ─── Remove email from watchlist ──────────────────────────────────────────────
const removeMonitor = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { error } = await supabase
      .from("monitored_emails")
      .delete()
      .eq("id", id)
      .eq("user_id", userId); // Ensures users can only delete their own

    if (error) throw error;

    res.status(200).json({ success: true, message: "Removed from watchlist" });
  } catch (error) {
    console.error("removeMonitor error:", error.message);
    res.status(500).json({ success: false, message: "Failed to remove email" });
  }
};

// ─── Get watchlist for current user ───────────────────────────────────────────
const getMonitorList = async (req, res) => {
  try {
    const userId = req.user?.id;

    const { data, error } = await supabase
      .from("monitored_emails")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    console.error("getMonitorList error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch watchlist" });
  }
};

// ─── Manually trigger check for one email ─────────────────────────────────────
const checkNow = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: record, error } = await supabase
      .from("monitored_emails")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !record) {
      return res.status(404).json({ success: false, message: "Monitor record not found" });
    }

    // Get the user's own email for the alert
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    record.user_email = userData?.user?.email || null;

    // Run the check (async, non-blocking for UX)
    checkOneEmail(record).catch(console.error);

    res.status(200).json({ success: true, message: "Check started — results will update shortly." });
  } catch (error) {
    console.error("checkNow error:", error.message);
    res.status(500).json({ success: false, message: "Failed to trigger check" });
  }
};

module.exports = { addMonitor, removeMonitor, getMonitorList, checkNow };
