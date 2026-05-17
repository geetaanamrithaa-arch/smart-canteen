const mongoose = require("mongoose");

const mealSlotSchema = new mongoose.Schema(
  {
    slotLabel: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    maxCapacity: {
      type: Number,
      required: true,
    },
    bookedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MealSlot", mealSlotSchema);