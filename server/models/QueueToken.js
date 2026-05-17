const mongoose = require("mongoose");

const queueTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["student", "admin", "faculty", "staff"],
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    queueType: {
      type: String,
      default: "walk-in",
    },
    status: {
      type: String,
      enum: ["waiting", "served", "cancelled"],
      default: "waiting",
    },
    estimatedWaitTime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QueueToken", queueTokenSchema);