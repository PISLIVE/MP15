const express = require("express");
const multer = require("multer");
const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const authMiddleware = require("../middleware/authMiddleware");

const { 
  scanProfile, 
  getScanHistory, 
  getScanById, 
  deleteScan,
  generatePhishingEmail,
  scanDomains,
  scanImage
} = require("../controllers/scanController");

// All routes are protected — user must have a valid Supabase session token
router.post("/scan", authMiddleware, scanProfile);
router.post("/scan-image", authMiddleware, upload.single('image'), scanImage);
router.get("/history", authMiddleware, getScanHistory);
router.get("/history/:id", authMiddleware, getScanById);
router.delete("/history/:id", authMiddleware, deleteScan);
router.post("/phishing-simulation", authMiddleware, generatePhishingEmail);
router.post("/scan-domains", authMiddleware, scanDomains);

module.exports = router;