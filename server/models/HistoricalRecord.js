const mongoose = require("mongoose");

const historicalRecordSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      required: true,
    },
    hour: {
      type: Number, // 0–23
      required: true,
    },
    dayOfWeek: {
      type: Number, // 0 = Sunday, 6 = Saturday
      required: true,
    },
    queueLength: {
      type: Number,
      required: true,
    },
    waitTime: {
      type: Number, // in minutes
      required: true,
    },
    servedCount: {
      type: Number,
      default: 0,
    },
    cancelledCount: {
      type: Number,
      default: 0,
    },
    slotUtilizationPct: {
      type: Number, // 0–100
      default: 0,
    },
    crowdLevel: {
      type: String,
      enum: ["low", "moderate", "high"],
      required: true,
    },
    studentCount: {
      type: Number,
      default: 0,
    },
    facultyCount: {
      type: Number,
      default: 0,
    },
    staffCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HistoricalRecord", historicalRecordSchema);