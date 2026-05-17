const MealSlot = require("../models/MealSlot");
const SlotBooking = require("../models/SlotBooking");

const createMealSlot = async (req, res) => {
  try {
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

const getAllMealSlots = async (req, res) => {
  try {
    const slots = await MealSlot.find().sort({ createdAt: 1 });

    res.status(200).json(slots);
  } catch (error) {
    console.error("getAllMealSlots error:", error);
    res.status(500).json({ message: "Server error while fetching all meal slots" });
  }
};

const updateMealSlotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const slot = await MealSlot.findById(id);

    if (!slot) {
      return res.status(404).json({ message: "Meal slot not found" });
    }

    slot.isActive = isActive;
    await slot.save();

    res.status(200).json({
      message: `Meal slot ${isActive ? "activated" : "deactivated"} successfully`,
      slot,
    });
  } catch (error) {
    console.error("updateMealSlotStatus error:", error);
    res.status(500).json({ message: "Server error while updating meal slot" });
  }
};

const updateMealSlotDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { slotLabel, startTime, endTime, maxCapacity } = req.body;

    const slot = await MealSlot.findById(id);

    if (!slot) {
      return res.status(404).json({ message: "Meal slot not found" });
    }

    if (!slotLabel || !startTime || !endTime || !maxCapacity) {
      return res.status(400).json({
        message: "All slot fields are required",
      });
    }

    slot.slotLabel = slotLabel;
    slot.startTime = startTime;
    slot.endTime = endTime;
    slot.maxCapacity = maxCapacity;

    await slot.save();

    res.status(200).json({
      message: "Meal slot updated successfully",
      slot,
    });
  } catch (error) {
    console.error("updateMealSlotDetails error:", error);
    res.status(500).json({ message: "Server error while updating meal slot details" });
  }
};

const deleteMealSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const slot = await MealSlot.findById(id);

    if (!slot) {
      return res.status(404).json({ message: "Meal slot not found" });
    }

    await MealSlot.findByIdAndDelete(id);

    res.status(200).json({
      message: "Meal slot deleted successfully",
    });
  } catch (error) {
    console.error("deleteMealSlot error:", error);
    res.status(500).json({ message: "Server error while deleting meal slot" });
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

const cancelMySlotBooking = async (req, res) => {
  try {
    const userId = req.user.id;

    const booking = await SlotBooking.findOne({
      user: userId,
      bookingStatus: "booked",
    });

    if (!booking) {
      return res.status(404).json({ message: "No active slot booking found" });
    }

    const slot = await MealSlot.findById(booking.slot);

    if (slot && slot.bookedCount > 0) {
      slot.bookedCount -= 1;
      await slot.save();
    }

    booking.bookingStatus = "cancelled";
    await booking.save();

    res.status(200).json({
      message: "Meal slot booking cancelled successfully",
      booking,
    });
  } catch (error) {
    console.error("cancelMySlotBooking error:", error);
    res.status(500).json({ message: "Server error while cancelling slot booking" });
  }
};

module.exports = {
  createMealSlot,
  getMealSlots,
  getAllMealSlots,
  updateMealSlotStatus,
  updateMealSlotDetails,
  deleteMealSlot,
  bookMealSlot,
  getMySlotBooking,
  cancelMySlotBooking,
};