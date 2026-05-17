const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getHourlyTrends,
  getDailyTrends,
  getCrowdDistribution,
  getSummary,
} = require("../controllers/analyticsController");

// All analytics routes are protected — admin only in practice,
// but authMiddleware just checks JWT validity.
router.get("/hourly",             authMiddleware, getHourlyTrends);
router.get("/daily",              authMiddleware, getDailyTrends);
router.get("/crowd-distribution", authMiddleware, getCrowdDistribution);
router.get("/summary",            authMiddleware, getSummary);

module.exports = router;