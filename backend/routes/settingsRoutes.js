const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getSettings, updateSettings } = require("../controllers/settingsController");

/**
 * Route to fetch user settings
 */
router.get("/", authMiddleware, getSettings);

/**
 * Route to update user settings (upsert)
 */
router.post("/", authMiddleware, updateSettings);

module.exports = router;
