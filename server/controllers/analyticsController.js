const HistoricalRecord = require("../models/HistoricalRecord");

/**
 * GET /api/analytics/hourly
 * Average queue length and wait time for each hour (0–23), across all data.
 * Used for the "Busiest Hours" bar chart on AdminDashboard.
 */
const getHourlyTrends = async (req, res) => {
  try {
    const data = await HistoricalRecord.aggregate([
      {
        $group: {
          _id: "$hour",
          avgQueueLength:       { $avg: "$queueLength" },
          avgWaitTime:          { $avg: "$waitTime" },
          avgSlotUtilization:   { $avg: "$slotUtilizationPct" },
          totalServed:          { $sum: "$servedCount" },
          totalCancelled:       { $sum: "$cancelledCount" },
          count:                { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formatted = data.map((d) => ({
      hour:               d._id,
      label:              formatHour(d._id),
      avgQueueLength:     parseFloat(d.avgQueueLength.toFixed(1)),
      avgWaitTime:        parseFloat(d.avgWaitTime.toFixed(1)),
      avgSlotUtilization: parseFloat(d.avgSlotUtilization.toFixed(1)),
      totalServed:        d.totalServed,
      totalCancelled:     d.totalCancelled,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("getHourlyTrends error:", error);
    res.status(500).json({ message: "Server error fetching hourly trends" });
  }
};

/**
 * GET /api/analytics/daily?days=14
 * Daily aggregated crowd data for the last N days.
 * Used for the "Queue Activity (Last 14 Days)" line chart.
 */
const getDailyTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const data = await HistoricalRecord.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            year:  { $year:  "$timestamp" },
            month: { $month: "$timestamp" },
            day:   { $dayOfMonth: "$timestamp" },
          },
          avgQueueLength:     { $avg: "$queueLength" },
          avgWaitTime:        { $avg: "$waitTime" },
          peakQueueLength:    { $max: "$queueLength" },
          totalServed:        { $sum: "$servedCount" },
          totalCancelled:     { $sum: "$cancelledCount" },
          highCrowdHours:     { $sum: { $cond: [{ $eq: ["$crowdLevel", "high"] }, 1, 0] } },
          moderateCrowdHours: { $sum: { $cond: [{ $eq: ["$crowdLevel", "moderate"] }, 1, 0] } },
          lowCrowdHours:      { $sum: { $cond: [{ $eq: ["$crowdLevel", "low"] }, 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const formatted = data.map((d) => ({
      date:               `${d._id.year}-${String(d._id.month).padStart(2,"0")}-${String(d._id.day).padStart(2,"0")}`,
      avgQueueLength:     parseFloat(d.avgQueueLength.toFixed(1)),
      avgWaitTime:        parseFloat(d.avgWaitTime.toFixed(1)),
      peakQueueLength:    d.peakQueueLength,
      totalServed:        d.totalServed,
      totalCancelled:     d.totalCancelled,
      highCrowdHours:     d.highCrowdHours,
      moderateCrowdHours: d.moderateCrowdHours,
      lowCrowdHours:      d.lowCrowdHours,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error("getDailyTrends error:", error);
    res.status(500).json({ message: "Server error fetching daily trends" });
  }
};

/**
 * GET /api/analytics/crowd-distribution
 * Overall % breakdown of Low / Moderate / High across all records.
 * Used for the crowd doughnut chart.
 */
const getCrowdDistribution = async (req, res) => {
  try {
    const data = await HistoricalRecord.aggregate([
      {
        $group: {
          _id:   "$crowdLevel",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = data.reduce((sum, d) => sum + d.count, 0);
    const dist  = { low: 0, moderate: 0, high: 0 };
    data.forEach((d) => {
      dist[d._id] = parseFloat(((d.count / total) * 100).toFixed(1));
    });

    res.status(200).json({ total, distribution: dist });
  } catch (error) {
    console.error("getCrowdDistribution error:", error);
    res.status(500).json({ message: "Server error fetching crowd distribution" });
  }
};

/**
 * GET /api/analytics/summary
 * High-level KPIs derived from the historical dataset.
 * Used for the analytics cards at the top of AdminDashboard.
 */
const getSummary = async (req, res) => {
  try {
    const [result] = await HistoricalRecord.aggregate([
      {
        $group: {
          _id:                null,
          avgWaitTime:        { $avg: "$waitTime" },
          avgQueueLength:     { $avg: "$queueLength" },
          peakQueueLength:    { $max: "$queueLength" },
          totalServed:        { $sum: "$servedCount" },
          totalCancelled:     { $sum: "$cancelledCount" },
          avgSlotUtilization: { $avg: "$slotUtilizationPct" },
          totalRecords:       { $sum: 1 },
        },
      },
    ]);

    if (!result) {
      return res.status(200).json({ message: "No historical data yet" });
    }

    res.status(200).json({
      avgWaitTime:        parseFloat(result.avgWaitTime.toFixed(1)),
      avgQueueLength:     parseFloat(result.avgQueueLength.toFixed(1)),
      peakQueueLength:    result.peakQueueLength,
      totalServed:        result.totalServed,
      totalCancelled:     result.totalCancelled,
      avgSlotUtilization: parseFloat(result.avgSlotUtilization.toFixed(1)),
      totalRecords:       result.totalRecords,
    });
  } catch (error) {
    console.error("getSummary error:", error);
    res.status(500).json({ message: "Server error fetching summary" });
  }
};

// ── util ─────────────────────────────────────────────────────────────────────

function formatHour(h) {
  if (h === 0)  return "12 AM";
  if (h < 12)   return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

module.exports = {
  getHourlyTrends,
  getDailyTrends,
  getCrowdDistribution,
  getSummary,
};