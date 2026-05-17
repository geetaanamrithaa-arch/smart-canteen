const express = require("express");
const router = express.Router();

const {
  createMealSlot,
  getMealSlots,
  getAllMealSlots,
  updateMealSlotStatus,
  updateMealSlotDetails,
  deleteMealSlot,
  bookMealSlot,
  getMySlotBooking,
  cancelMySlotBooking,
} = require("../controllers/slotController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, createMealSlot);
router.get("/", authMiddleware, getMealSlots);
router.get("/all", authMiddleware, getAllMealSlots);
router.put("/:id", authMiddleware, updateMealSlotStatus);
router.put("/details/:id", authMiddleware, updateMealSlotDetails);
router.delete("/:id", authMiddleware, deleteMealSlot);
router.post("/book", authMiddleware, bookMealSlot);
router.get("/my-booking", authMiddleware, getMySlotBooking);
router.put("/my-booking/cancel", authMiddleware, cancelMySlotBooking);

module.exports = router;