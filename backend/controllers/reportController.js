const { supabase } = require("../config/database");

// ─── POST /api/report/share  (authenticated) ─────────────────────────────────
const createShare = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { scanData, query } = req.body;

    if (!scanData || !userId) {
      return res.status(400).json({ success: false, message: "Scan data and auth required" });
    }

    const { data, error } = await supabase
      .from("shared_reports")
      .insert({
        user_id: userId,
        scan_data: scanData,
        query: query || null,
      })
      .select("id, created_at, expires_at")
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      id: data.id,
      expiresAt: data.expires_at,
    });
  } catch (error) {
    console.error("createShare error:", error.message);
    res.status(500).json({ success: false, message: "Failed to create shared report" });
  }
};

// ─── GET /api/report/:id  (public — no auth) ─────────────────────────────────
const getShare = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("shared_reports")
      .select("id, scan_data, query, created_at, expires_at")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: "Report not found or expired" });
    }

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.status(410).json({ success: false, message: "This report has expired" });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getShare error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch shared report" });
  }
};

module.exports = { createShare, getShare };
