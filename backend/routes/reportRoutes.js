const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware");
const { createShare, getShare } = require("../controllers/reportController");

// Public — anyone with the link can view
router.get("/:id", getShare);

// Protected — only logged-in users can create a shared report
router.post("/share", authenticate, createShare);

module.exports = router;
