const QueueToken = require("../models/QueueToken");
const SlotBooking = require("../models/SlotBooking");
const MealSlot = require("../models/MealSlot");
const HistoricalRecord = require("../models/HistoricalRecord");

// ── Crowd level — matches frontend thresholds exactly ─────────────────────
function getCrowdLevel(queueLength, waitTime) {
  if (queueLength >= 15 || waitTime >= 25) return "high";
  if (queueLength >= 5  || waitTime >= 10) return "moderate";
  return "low";
}

// ── Save one snapshot of current canteen state to HistoricalRecords ────────
const saveHourlySnapshot = async () => {
  try {
    const now = new Date();
    const hour = now.getHours();

    // Skip outside canteen hours (before 7 AM or after 9 PM)
    if (hour < 7 || hour > 21) {
      console.log(`[Snapshot] Skipped — outside canteen hours (${hour}:00)`);
      return;
    }

    // ── Pull live queue data ──────────────────────────────────────────────
    const waitingTokens = await QueueToken.find({ status: "waiting" });
    const queueLength   = waitingTokens.length;

    const maxWait = queueLength > 0
      ? Math.max(...waitingTokens.map(t => Number(t.estimatedWaitTime) || 0))
      : 0;

    const avgWait = queueLength > 0
      ? Math.round(waitingTokens.reduce((s, t) => s + (Number(t.estimatedWaitTime) || 0), 0) / queueLength)
      : 0;

    // Tokens served and cancelled in the last hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const servedCount = await QueueToken.countDocuments({
      status: "served",
      updatedAt: { $gte: oneHourAgo },
    });

    const cancelledCount = await QueueToken.countDocuments({
      status: "cancelled",
      updatedAt: { $gte: oneHourAgo },
    });

    // Role breakdown of current waiting queue
    const studentCount = waitingTokens.filter(t => t.role === "student").length;
    const facultyCount = waitingTokens.filter(t => t.role === "faculty").length;
    const staffCount   = waitingTokens.filter(t => t.role === "staff").length;

    // ── Pull live slot data ───────────────────────────────────────────────
    const activeSlots = await MealSlot.find({ isActive: true });

    const totalCapacity = activeSlots.reduce((s, sl) => s + sl.maxCapacity, 0);
    const totalBooked   = activeSlots.reduce((s, sl) => s + sl.bookedCount, 0);

    const slotUtilizationPct = totalCapacity > 0
      ? Math.round((totalBooked / totalCapacity) * 100)
      : 0;

    // ── Save snapshot ─────────────────────────────────────────────────────
    const record = await HistoricalRecord.create({
      timestamp:          now,
      hour,
      dayOfWeek:          now.getDay(),
      queueLength,
      waitTime:           avgWait,
      servedCount,
      cancelledCount,
      slotUtilizationPct,
      crowdLevel:         getCrowdLevel(queueLength, maxWait),
      studentCount,
      facultyCount,
      staffCount,
    });

    console.log(
      `[Snapshot] Saved at ${now.toLocaleTimeString()} — ` +
      `queue: ${queueLength}, wait: ${avgWait} min, ` +
      `crowd: ${record.crowdLevel}, slot util: ${slotUtilizationPct}%`
    );
  } catch (err) {
    console.error("[Snapshot] Failed to save hourly snapshot:", err.message);
  }
};

// ── Start the hourly snapshot timer ───────────────────────────────────────
// Runs every 60 minutes. Also saves one snapshot immediately on server start
// so you don't have to wait an hour for the first record.
const startSnapshotTimer = () => {
  const INTERVAL_MS = 60 * 60 * 1000; // 1 hour

  // Save immediately on startup
  saveHourlySnapshot();

  // Then every hour
  setInterval(saveHourlySnapshot, INTERVAL_MS);

  console.log("[Snapshot] Hourly snapshot timer started — saves every 60 min");
};

module.exports = { startSnapshotTimer, saveHourlySnapshot };