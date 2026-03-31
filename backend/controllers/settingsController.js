const { supabase } = require("../config/database");

/**
 * Fetch current user settings
 */
const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") { // Skip "no rows found" error
      console.error("Supabase fetch error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch user settings"
      });
    }

    // Return default settings if none found
    if (!data) {
      return res.status(200).json({
        success: true,
        data: {
          notifications_enabled: true,
          theme: "system"
        }
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Settings controller error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching settings"
    });
  }
};

/**
 * Update (upsert) user settings
 */
const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notifications_enabled, theme } = req.body;

    const { data, error } = await supabase
      .from("user_settings")
      .upsert({
        user_id: userId,
        notifications_enabled,
        theme,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error("Supabase upsert error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to update user settings"
      });
    }

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error("Update settings error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating settings"
    });
  }
};

module.exports = { getSettings, updateSettings };
