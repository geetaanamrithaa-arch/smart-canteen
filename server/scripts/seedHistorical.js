/**
 * seedHistorical.js
 * Run once from the server folder:  node scripts/seedHistorical.js
 *
 * Generates 45 days of realistic per-hour canteen records and inserts them
 * into MongoDB. Patterns are derived from published university canteen
 * queue studies (e.g. Rambandara et al., 2019) and the Canteen Shop
 * Transaction dataset (Kaggle, 2024).
 *
 * Crowd thresholds used throughout the live system:
 *   Low      — queueLength < 5  AND waitTime < 10 min
 *   Moderate — queueLength < 15 AND waitTime < 25 min
 *   High     — queueLength >= 15 OR  waitTime >= 25 min
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const HistoricalRecord = require("../models/HistoricalRecord");

// ── helpers ──────────────────────────────────────────────────────────────────

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, dp = 1) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(dp));
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Returns a demand multiplier (0–1) for a given hour.
 * Peaks at lunch (12–14) and a smaller dinner peak (18–20).
 * Very low outside canteen hours (before 8, after 21).
 */
function hourDemand(hour) {
  const curve = {
    7: 0.15,
    8: 0.35,
    9: 0.25,
    10: 0.20,
    11: 0.55,
    12: 1.00, // lunch peak
    13: 0.95,
    14: 0.70,
    15: 0.30,
    16: 0.25,
    17: 0.40,
    18: 0.75, // dinner peak
    19: 0.80,
    20: 0.60,
    21: 0.20,
  };
  return curve[hour] ?? 0.05;
}

/**
 * Weekend demand is ~40 % of weekday.
 */
function dayMultiplier(dayOfWeek) {
  return dayOfWeek === 0 || dayOfWeek === 6 ? 0.4 : 1.0;
}

function crowdLevel(queueLength, waitTime) {
  if (queueLength >= 15 || waitTime >= 25) return "high";
  if (queueLength >= 5  || waitTime >= 10) return "moderate";
  return "low";
}

// ── main ─────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Wipe existing historical data so re-runs are safe
    await HistoricalRecord.deleteMany({});
    console.log("Cleared existing historical records");

    const records = [];
    const DAYS = 45;
    const AVERAGE_SERVICE_TIME = 3; // minutes — matches queueController.js

    const now = new Date();

    for (let d = DAYS; d >= 0; d--) {
      const day = new Date(now);
      day.setDate(now.getDate() - d);
      const dow = day.getDay();
      const dm  = dayMultiplier(dow);

      // Generate one record per canteen-open hour
      for (let h = 7; h <= 21; h++) {
        const hd = hourDemand(h);
        const demand = hd * dm;

        // Base queue length driven by demand, with realistic noise
        const baseQueue = Math.round(demand * 20);
        const noise     = randInt(-2, 3);
        const queueLength = clamp(baseQueue + noise, 0, 30);

        // Wait time = queueLength * service time + small variance
        const waitTime = clamp(
          Math.round(queueLength * AVERAGE_SERVICE_TIME + randInt(-2, 4)),
          0,
          90
        );

        // Served / cancelled
        const servedCount    = Math.round(queueLength * randFloat(0.75, 0.95));
        const cancelledCount = queueLength - servedCount > 0
          ? randInt(0, queueLength - servedCount)
          : 0;

        // Slot utilisation correlates with demand
        const slotUtilizationPct = clamp(
          Math.round(demand * 100 + randInt(-10, 10)),
          0,
          100
        );

        // Role split: mostly students
        const studentCount = Math.round(queueLength * randFloat(0.65, 0.80));
        const facultyCount = Math.round(queueLength * randFloat(0.10, 0.20));
        const staffCount   = clamp(queueLength - studentCount - facultyCount, 0, 10);

        const timestamp = new Date(day);
        timestamp.setHours(h, randInt(0, 59), 0, 0);

        records.push({
          timestamp,
          hour: h,
          dayOfWeek: dow,
          queueLength,
          waitTime,
          servedCount,
          cancelledCount,
          slotUtilizationPct,
          crowdLevel: crowdLevel(queueLength, waitTime),
          studentCount,
          facultyCount,
          staffCount,
        });
      }
    }

    await HistoricalRecord.insertMany(records);
    console.log(`✅ Seeded ${records.length} historical records (${DAYS} days × 15 hours)`);

    // ── Quick sanity summary ────────────────────────────────────────────────
    const total    = records.length;
    const highPct  = ((records.filter(r => r.crowdLevel === "high").length  / total) * 100).toFixed(1);
    const modPct   = ((records.filter(r => r.crowdLevel === "moderate").length / total) * 100).toFixed(1);
    const lowPct   = ((records.filter(r => r.crowdLevel === "low").length   / total) * 100).toFixed(1);
    const avgWait  = (records.reduce((s, r) => s + r.waitTime, 0) / total).toFixed(1);
    const avgQueue = (records.reduce((s, r) => s + r.queueLength, 0) / total).toFixed(1);

    console.log("\n── Dataset summary ──────────────────────────");
    console.log(`Total records  : ${total}`);
    console.log(`Avg queue len  : ${avgQueue} people`);
    console.log(`Avg wait time  : ${avgWait} min`);
    console.log(`Crowd — High   : ${highPct}%`);
    console.log(`Crowd — Mod    : ${modPct}%`);
    console.log(`Crowd — Low    : ${lowPct}%`);
    console.log("─────────────────────────────────────────────\n");

    await mongoose.disconnect();
    console.log("Done. MongoDB disconnected.");
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
}

seed();