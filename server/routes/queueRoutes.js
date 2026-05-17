const express = require("express");
const router = express.Router();

const {
  joinQueue,
  getQueue,
  updateQueueStatus,
} = require("../controllers/queueController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/join", authMiddleware, joinQueue);
router.get("/", authMiddleware, getQueue);
router.put("/:id", authMiddleware, updateQueueStatus);

module.exports = router;