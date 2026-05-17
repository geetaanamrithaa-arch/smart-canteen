const mongoose = require("mongoose");

const slotBookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    slot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MealSlot",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "admin", "faculty", "staff"],
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ["booked", "cancelled"],
      default: "booked",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SlotBooking", slotBookingSchema);