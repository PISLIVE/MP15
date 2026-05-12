const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authMiddleware"); // default export
const {
  addMonitor,
  removeMonitor,
  getMonitorList,
  checkNow,
} = require("../controllers/monitorController");


// All monitor routes require authentication
router.use(authenticate);

router.get("/", getMonitorList);   // GET  /api/monitor
router.post("/", addMonitor);       // POST /api/monitor
router.delete("/:id", removeMonitor);    // DELETE /api/monitor/:id
router.post("/:id/check", checkNow);       // POST /api/monitor/:id/check

module.exports = router;
