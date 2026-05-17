// HistoricalAnalytics.jsx
// Drop this component into your AdminDashboard.jsx
// Requires: npm install recharts   (in the client folder)

import { useEffect, useState } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import API from "../api/api";

const CROWD_COLORS = {
  low:      "#22c55e",
  moderate: "#f59e0b",
  high:     "#ef4444",
};

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export default function HistoricalAnalytics() {
  const [summary,   setSummary]   = useState(null);
  const [hourly,    setHourly]    = useState([]);
  const [daily,     setDaily]     = useState([]);
  const [crowdDist, setCrowdDist] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [s, h, d, c] = await Promise.all([
          API.get("/analytics/summary"),
          API.get("/analytics/hourly"),
          API.get("/analytics/daily?days=14"),
          API.get("/analytics/crowd-distribution"),
        ]);
        setSummary(s.data);
        // Only show canteen-open hours in the chart (7 AM – 9 PM)
        setHourly(h.data.filter((r) => r.hour >= 7 && r.hour <= 21));
        setDaily(d.data);
        setCrowdDist(c.data);
      } catch (err) {
        setError("Failed to load analytics data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <p style={styles.msg}>Loading historical analytics…</p>;
  if (error)   return <p style={{ ...styles.msg, color: "#ef4444" }}>{error}</p>;

  // Pie chart data
  const pieData = crowdDist
    ? [
        { name: "Low",      value: crowdDist.distribution.low },
        { name: "Moderate", value: crowdDist.distribution.moderate },
        { name: "High",     value: crowdDist.distribution.high },
      ]
    : [];

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.sectionTitle}>📊 Historical Analytics (45-Day Dataset)</h2>
      <p style={styles.subtitle}>
        Derived from 45 days of canteen operational data — used to calibrate
        crowd thresholds and validate wait-time predictions.
      </p>

      {/* ── KPI Cards ──────────────────────────────────────────────────── */}
      {summary && (
        <div style={styles.kpiRow}>
          <KPICard label="Avg Wait Time"        value={`${summary.avgWaitTime} min`}  color="#6366f1" />
          <KPICard label="Avg Queue Length"     value={`${summary.avgQueueLength}`}   color="#0ea5e9" />
          <KPICard label="Peak Queue Recorded"  value={`${summary.peakQueueLength}`}  color="#ef4444" />
          <KPICard label="Total Served"         value={summary.totalServed}            color="#22c55e" />
          <KPICard label="Avg Slot Utilisation" value={`${summary.avgSlotUtilization}%`} color="#f59e0b" />
        </div>
      )}

      {/* ── Hourly Bar Chart ───────────────────────────────────────────── */}
      <div style={styles.card}>
        <h3 style={styles.chartTitle}>Busiest Hours — Avg Queue Length &amp; Wait Time</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={hourly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
              labelStyle={{ color: "#f1f5f9" }}
              itemStyle={{ color: "#94a3b8" }}
            />
            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
            <Bar dataKey="avgQueueLength" name="Avg Queue Length" fill="#6366f1" radius={[4,4,0,0]} />
            <Bar dataKey="avgWaitTime"    name="Avg Wait (min)"   fill="#0ea5e9" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Daily Line Chart + Pie ─────────────────────────────────────── */}
      <div style={styles.row}>
        <div style={{ ...styles.card, flex: 2 }}>
          <h3 style={styles.chartTitle}>Queue Activity — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={daily} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(v) => v.slice(5)} // show MM-DD only
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                labelStyle={{ color: "#f1f5f9" }}
                itemStyle={{ color: "#94a3b8" }}
              />
              <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
              <Line type="monotone" dataKey="avgQueueLength"  name="Avg Queue" stroke="#6366f1" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="peakQueueLength" name="Peak Queue" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="avgWaitTime"     name="Avg Wait (min)" stroke="#0ea5e9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...styles.card, flex: 1, minWidth: 220 }}>
          <h3 style={styles.chartTitle}>Crowd Level Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                formatter={(v) => `${v}%`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={styles.legend}>
            {pieData.map((d, i) => (
              <span key={d.name} style={{ color: PIE_COLORS[i], fontSize: 12 }}>
                ● {d.name}: {d.value}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Dataset note for viva ──────────────────────────────────────── */}
      <p style={styles.note}>
        ℹ️ Dataset: 45 days × 15 canteen-hours = <strong>{summary?.totalRecords || "—"}</strong> records.
        Average service time per person: <strong>3 min</strong> (matches live queue prediction logic).
        Crowd thresholds — Low: queue &lt; 5 &amp; wait &lt; 10 min |
        Moderate: queue &lt; 15 &amp; wait &lt; 25 min |
        High: queue ≥ 15 or wait ≥ 25 min.
      </p>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({ label, value, color }) {
  return (
    <div style={{ ...styles.kpi, borderTop: `3px solid ${color}` }}>
      <p style={styles.kpiValue}>{value}</p>
      <p style={styles.kpiLabel}>{label}</p>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  wrapper: {
    padding: "24px 0",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#f1f5f9",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 20,
  },
  kpiRow: {
    display: "flex",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  kpi: {
    background: "#1e293b",
    borderRadius: 10,
    padding: "14px 20px",
    flex: "1 1 140px",
    minWidth: 130,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: 700,
    color: "#f1f5f9",
    margin: 0,
  },
  kpiLabel: {
    fontSize: 12,
    color: "#64748b",
    margin: "4px 0 0",
  },
  card: {
    background: "#1e293b",
    borderRadius: 12,
    padding: "18px 20px",
    marginBottom: 16,
  },
  row: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: 14,
  },
  legend: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginTop: 8,
    paddingLeft: 8,
  },
  note: {
    fontSize: 12,
    color: "#475569",
    background: "#0f172a",
    borderRadius: 8,
    padding: "10px 14px",
    lineHeight: 1.7,
  },
  msg: {
    color: "#94a3b8",
    textAlign: "center",
    padding: 40,
  },
};
