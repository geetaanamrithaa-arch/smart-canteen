const MealSlot = require("../models/MealSlot");
const SlotBooking = require("../models/SlotBooking");

const createMealSlot = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can create meal slots",
      });
    }

    const { slotLabel, startTime, endTime, maxCapacity } = req.body;

    if (!slotLabel || !startTime || !endTime || !maxCapacity) {
      return res.status(400).json({
        message: "All slot fields are required",
      });
    }

    const newSlot = await MealSlot.create({
      slotLabel,
      startTime,
      endTime,
      maxCapacity,
    });

    res.status(201).json({
      message: "Meal slot created successfully",
      slot: newSlot,
    });
  } catch (error) {
    console.error("createMealSlot error:", error);
    res.status(500).json({ message: "Server error while creating meal slot" });
  }
};

const getMealSlots = async (req, res) => {
  try {
    const slots = await MealSlot.find({ isActive: true }).sort({ createdAt: 1 });

    res.status(200).json(slots);
  } catch (error) {
    console.error("getMealSlots error:", error);
    res.status(500).json({ message: "Server error while fetching meal slots" });
  }
};

const bookMealSlot = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { slotId, studentName } = req.body;

    if (!slotId || !studentName) {
      return res.status(400).json({
        message: "Slot ID and student name are required",
      });
    }

    const existingBooking = await SlotBooking.findOne({
      user: userId,
      bookingStatus: "booked",
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You already have an active slot booking",
      });
    }

    const slot = await MealSlot.findById(slotId);

    if (!slot) {
      return res.status(404).json({ message: "Meal slot not found" });
    }

    if (!slot.isActive) {
      return res.status(400).json({ message: "This slot is not active" });
    }

    if (slot.bookedCount >= slot.maxCapacity) {
      return res.status(400).json({ message: "This slot is full" });
    }

    const newBooking = await SlotBooking.create({
      user: userId,
      slot: slotId,
      studentName,
      role: userRole,
    });

    slot.bookedCount += 1;
    await slot.save();

    res.status(201).json({
      message: "Meal slot booked successfully",
      booking: newBooking,
    });
  } catch (error) {
    console.error("bookMealSlot error:", error);
    res.status(500).json({ message: "Server error while booking meal slot" });
  }
};

const getMySlotBooking = async (req, res) => {
  try {
    const booking = await SlotBooking.findOne({
      user: req.user.id,
      bookingStatus: "booked",
    }).populate("slot");

    res.status(200).json(booking);
  } catch (error) {
    console.error("getMySlotBooking error:", error);
    res.status(500).json({ message: "Server error while fetching booking" });
  }
};

module.exports = {
  createMealSlot,
  getMealSlots,
  bookMealSlot,
  getMySlotBooking,
};