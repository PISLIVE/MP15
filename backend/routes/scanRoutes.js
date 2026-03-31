const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { 
  scanProfile, 
  getScanHistory, 
  getScanById, 
  deleteScan 
} = require("../controllers/scanController");

// All routes are protected — user must have a valid Supabase session token
router.post("/scan", authMiddleware, scanProfile);
router.get("/history", authMiddleware, getScanHistory);
router.get("/history/:id", authMiddleware, getScanById);
router.delete("/history/:id", authMiddleware, deleteScan);

module.exports = router;