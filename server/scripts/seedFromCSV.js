/**
 * seedFromCSV.js
 * Reads the real Kaggle "Canteen Shop Transaction Data" CSV and seeds MongoDB.
 *
 * Run from the server folder:
 *   node scripts/seedFromCSV.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const fs       = require("fs");
const path     = require("path");
const readline = require("readline");
const mongoose = require("mongoose");
const HistoricalRecord = require("../models/HistoricalRecord");

const CSV_PATH = "C:\\MTech Sem 2\\Full Stack Development\\FSD_Project_Dataset\\archive (1)\\canteen_shop_data.csv";
const AVERAGE_SERVICE_TIME = 3; // matches queueController.js

// ── helpers ──────────────────────────────────────────────────────────────────

function crowdLevel(queueLength, waitTime) {
  if (queueLength >= 15 || waitTime >= 25) return "high";
  if (queueLength >= 5  || waitTime >= 10) return "moderate";
  return "low";
}

function parseTime(timeStr) {
  // handles "HH:MM", "HH:MM:SS", "H:MM AM/PM"
  if (!timeStr) return 12;
  timeStr = timeStr.trim();
  if (timeStr.toLowerCase().includes("am") || timeStr.toLowerCase().includes("pm")) {
    const [time, meridiem] = timeStr.split(" ");
    let [h] = time.split(":").map(Number);
    if (meridiem.toLowerCase() === "pm" && h !== 12) h += 12;
    if (meridiem.toLowerCase() === "am" && h === 12) h = 0;
    return h;
  }
  return parseInt(timeStr.split(":")[0], 10) || 12;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  // try common formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY
  const d = new Date(dateStr);
  if (!isNaN(d)) return d;
  // try DD/MM/YYYY
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    const attempt = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (!isNaN(attempt)) return attempt;
  }
  return null;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(`CSV not found at: ${CSV_PATH}`);
    }

    // ── Step 1: Parse CSV ───────────────────────────────────────────────────
    const rl = readline.createInterface({
      input: fs.createReadStream(CSV_PATH, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });

    let headers = null;
    const rows  = [];

    for await (const line of rl) {
      if (!line.trim()) continue;

      // Simple CSV split (handles quoted fields too)
      const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)
        ?.map(c => c.replace(/^"|"$/g, "").trim()) ?? line.split(",").map(s => s.trim());

      if (!headers) {
        headers = cols.map(h => h.toLowerCase().replace(/\s+/g, "_"));
        console.log("Detected columns:", headers.join(", "));
        continue;
      }

      const row = {};
      headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
      rows.push(row);
    }

    console.log(`Parsed ${rows.length} transaction rows`);
    if (rows.length === 0) throw new Error("CSV is empty or failed to parse");

    // ── Step 2: Print first row so we can see column names ─────────────────
    console.log("\nSample row:", rows[0]);

    // ── Step 3: Find the right column names (flexible) ─────────────────────
    const findCol = (...candidates) => {
      for (const c of candidates) {
        const found = headers.find(h => h.includes(c));
        if (found) return found;
      }
      return null;
    };

    const dateCol   = findCol("date");
    const timeCol   = findCol("time");
    const qtyCol    = findCol("quantity", "qty", "count");
    const roleCol   = findCol("customer_type", "role", "type", "category");
    const satisfCol = findCol("satisfaction", "rating", "score");

    console.log(`\nUsing columns → date: "${dateCol}", time: "${timeCol}", quantity: "${qtyCol}", role: "${roleCol}"`);

    // ── Step 4: Group by date + hour ────────────────────────────────────────
    const buckets = {}; // key: "YYYY-MM-DD_HH"

    for (const row of rows) {
      const date = parseDate(row[dateCol]);
      if (!date) continue;

      const hour = timeCol ? parseTime(row[timeCol]) : 12;
      if (hour < 7 || hour > 21) continue; // outside canteen hours

      const key = `${date.toISOString().slice(0, 10)}_${hour}`;

      if (!buckets[key]) {
        buckets[key] = {
          date,
          hour,
          dayOfWeek:    date.getDay(),
          transactions: [],
        };
      }

      const qty = qtyCol ? (parseInt(row[qtyCol], 10) || 1) : 1;
      const sat = satisfCol ? (parseFloat(row[satisfCol]) || 3) : 3;
      const role = roleCol ? row[roleCol]?.toLowerCase() : "student";

      buckets[key].transactions.push({ qty, sat, role });
    }

    // ── Step 5: Convert buckets → HistoricalRecord documents ───────────────
    await HistoricalRecord.deleteMany({});
    console.log("Cleared existing historical records");

    const records = [];

    for (const [key, bucket] of Object.entries(buckets)) {
      const txns        = bucket.transactions;
      const queueLength = Math.min(txns.length, 30); // cap at 30

      const waitTime = Math.min(
        Math.round(queueLength * AVERAGE_SERVICE_TIME + (Math.random() * 4 - 2)),
        90
      );

      const servedCount    = Math.round(queueLength * (0.80 + Math.random() * 0.15));
      const cancelledCount = Math.max(0, queueLength - servedCount);

      // Slot utilisation: derived from how busy this hour is vs max ever
      const slotUtilizationPct = Math.min(Math.round((queueLength / 30) * 100), 100);

      // Role split from actual data if available
      const studentCount = txns.filter(t => t.role.includes("stud") || t.role.includes("regular")).length
                        || Math.round(queueLength * 0.70);
      const facultyCount = txns.filter(t => t.role.includes("fac")  || t.role.includes("staff")).length
                        || Math.round(queueLength * 0.15);
      const staffCount   = Math.max(0, queueLength - studentCount - facultyCount);

      const timestamp = new Date(bucket.date);
      timestamp.setHours(bucket.hour, Math.floor(Math.random() * 59), 0, 0);

      records.push({
        timestamp,
        hour:              bucket.hour,
        dayOfWeek:         bucket.dayOfWeek,
        queueLength,
        waitTime,
        servedCount,
        cancelledCount,
        slotUtilizationPct,
        crowdLevel:        crowdLevel(queueLength, waitTime),
        studentCount,
        facultyCount,
        staffCount,
      });
    }

    await HistoricalRecord.insertMany(records);
    console.log(`\n✅ Seeded ${records.length} historical records from Kaggle CSV`);

    // ── Summary ─────────────────────────────────────────────────────────────
    const total   = records.length;
    const high    = records.filter(r => r.crowdLevel === "high").length;
    const mod     = records.filter(r => r.crowdLevel === "moderate").length;
    const low     = records.filter(r => r.crowdLevel === "low").length;
    const avgWait = (records.reduce((s, r) => s + r.waitTime, 0) / total).toFixed(1);
    const avgQ    = (records.reduce((s, r) => s + r.queueLength, 0) / total).toFixed(1);

    console.log("\n── Dataset summary ──────────────────────────");
    console.log(`Source         : Kaggle — Canteen Shop Transaction Data`);
    console.log(`Total records  : ${total}`);
    console.log(`Avg queue len  : ${avgQ} people`);
    console.log(`Avg wait time  : ${avgWait} min`);
    console.log(`Crowd — High   : ${((high / total) * 100).toFixed(1)}%`);
    console.log(`Crowd — Mod    : ${((mod  / total) * 100).toFixed(1)}%`);
    console.log(`Crowd — Low    : ${((low  / total) * 100).toFixed(1)}%`);
    console.log("─────────────────────────────────────────────\n");

    await mongoose.disconnect();
    console.log("Done. MongoDB disconnected.");
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();