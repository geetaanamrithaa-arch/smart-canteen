import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api/api";
import HistoricalAnalytics from "../components/HistoricalAnalytics";

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    if (parsedUser.role !== "admin") {
      if (parsedUser.role === "student") navigate("/student-dashboard");
      else if (parsedUser.role === "faculty") navigate("/faculty-dashboard");
      else if (parsedUser.role === "staff") navigate("/staff-dashboard");
      return;
    }

    setUser(parsedUser);
  }, [navigate]);

  const fetchInsights = async () => {
    try {
      setLoadingInsights(true);

      const [queueRes, slotsRes] = await Promise.all([
        API.get("/queue"),
        API.get("/slots"),
      ]);

      setQueue(Array.isArray(queueRes.data) ? queueRes.data : []);
      setSlots(Array.isArray(slotsRes.data) ? slotsRes.data : []);
    } catch (err) {
      console.error("Failed to load admin insights", err);
    } finally {
      setLoadingInsights(false);
    }
  };

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(() => {
      fetchInsights();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const insights = useMemo(() => {
    const waitingQueue = queue.filter((item) => item.status === "waiting");
    const queueLength = waitingQueue.length;

    const totalWait = waitingQueue.reduce(
      (sum, item) => sum + (Number(item.estimatedWaitTime) || 0),
      0
    );

    const averageWait =
      queueLength > 0 ? Math.round(totalWait / queueLength) : 0;

    const maxWait =
      waitingQueue.length > 0
        ? Math.max(...waitingQueue.map((item) => Number(item.estimatedWaitTime) || 0))
        : 0;

    const activeSlots = slots.filter((slot) => slot.isActive);
    const nearlyFullSlots = activeSlots.filter((slot) => {
      const utilization =
        slot.maxCapacity > 0 ? slot.bookedCount / slot.maxCapacity : 0;
      return utilization >= 0.8 && slot.bookedCount < slot.maxCapacity;
    });

    const fullSlots = activeSlots.filter(
      (slot) => slot.bookedCount >= slot.maxCapacity
    );

    const lowUtilizationSlots = activeSlots.filter((slot) => {
      const utilization =
        slot.maxCapacity > 0 ? slot.bookedCount / slot.maxCapacity : 0;
      return utilization > 0 && utilization <= 0.3;
    });

    let crowdLevel = "Low Crowd";
    if (queueLength >= 8 || maxWait >= 15) crowdLevel = "High Crowd";
    else if (queueLength >= 4 || maxWait >= 8) crowdLevel = "Moderate Crowd";

    const alerts = [];

    if (queueLength >= 8) {
      alerts.push({
        type: "high",
        title: "Queue congestion detected",
        description: `There are currently ${queueLength} users waiting in the live queue.`,
      });
    }

    if (maxWait >= 15) {
      alerts.push({
        type: "high",
        title: "Wait time above threshold",
        description: `Predicted maximum wait time has reached about ${maxWait} minutes.`,
      });
    }

    if (nearlyFullSlots.length > 0) {
      alerts.push({
        type: "medium",
        title: "Slots nearly full",
        description: `${nearlyFullSlots.length} active slot(s) are above 80% capacity.`,
      });
    }

    if (fullSlots.length > 0) {
      alerts.push({
        type: "high",
        title: "One or more slots are full",
        description: `${fullSlots.length} active slot(s) have reached full capacity.`,
      });
    }

    if (lowUtilizationSlots.length >= 2) {
      alerts.push({
        type: "low",
        title: "Low-utilization slots detected",
        description: `${lowUtilizationSlots.length} slot(s) have low booking usage and may need better balancing.`,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: "good",
        title: "System operating normally",
        description: "Queue flow and slot utilization look balanced right now.",
      });
    }

    return {
      queueLength,
      averageWait,
      maxWait,
      activeSlotsCount: activeSlots.length,
      nearlyFullSlotsCount: nearlyFullSlots.length,
      crowdLevel,
      alerts,
    };
  }, [queue, slots]);

  const getAlertClass = (type) => {
    if (type === "high")   return "border-red-200 bg-red-50 text-red-800";
    if (type === "medium") return "border-amber-200 bg-amber-50 text-amber-800";
    if (type === "low")    return "border-blue-200 bg-blue-50 text-blue-800";
    return "border-green-200 bg-green-50 text-green-800";
  };

  const getCrowdClass = (level) => {
    if (level === "Low Crowd")      return "bg-green-100 text-green-800 border border-green-200";
    if (level === "Moderate Crowd") return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    return "bg-red-100 text-red-800 border border-red-200";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <Navbar />

      <div className="px-6 py-10 max-w-6xl mx-auto">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-md">

          {/* ── Header ── */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-emerald-400 mb-2">
                Admin Dashboard
              </h1>
            </div>
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold w-fit ${getCrowdClass(
                insights.crowdLevel
              )}`}
            >
              {insights.crowdLevel}
            </div>
          </div>

          {/* ── User info ── */}
          {user && (
            <div className="mb-8 rounded-2xl bg-slate-900/70 border border-white/10 p-5">
              <p className="text-lg"><span className="text-slate-400">Name:</span> {user.name}</p>
              <p className="text-lg"><span className="text-slate-400">Email:</span> {user.email}</p>
              <p className="text-lg"><span className="text-slate-400">Role:</span> {user.role}</p>
            </div>
          )}

          {/* ── Live KPI cards ── */}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
              <p className="text-sm text-slate-300 mb-1">Waiting Queue</p>
              <h2 className="text-3xl font-bold text-white">
                {loadingInsights ? "..." : insights.queueLength}
              </h2>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
              <p className="text-sm text-slate-300 mb-1">Average Wait</p>
              <h2 className="text-3xl font-bold text-white">
                {loadingInsights ? "..." : `~${insights.averageWait} mins`}
              </h2>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
              <p className="text-sm text-slate-300 mb-1">Active Slots</p>
              <h2 className="text-3xl font-bold text-white">
                {loadingInsights ? "..." : insights.activeSlotsCount}
              </h2>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/10 p-5">
              <p className="text-sm text-slate-300 mb-1">Nearly Full Slots</p>
              <h2 className="text-3xl font-bold text-white">
                {loadingInsights ? "..." : insights.nearlyFullSlotsCount}
              </h2>
            </div>
          </div>

          {/* ── Admin Alerts ── */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-emerald-300 mb-3">Admin Alerts</p>
            <div className="space-y-3">
              {insights.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`rounded-2xl border p-4 ${getAlertClass(alert.type)}`}
                >
                  <h3 className="font-bold mb-1">{alert.title}</h3>
                  <p className="text-sm">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Quick links ── */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Link
              to="/admin/queue"
              className="rounded-2xl bg-emerald-400 text-slate-950 p-6 font-bold hover:bg-emerald-300 transition"
            >
              Manage Queue
            </Link>
            <Link
              to="/admin/slot-management"
              className="rounded-2xl bg-white/10 border border-white/10 p-6 font-bold hover:bg-white/15 transition"
            >
              Manage Meal Slots
            </Link>
          </div>

          {/* ── Historical Analytics ── */}
          <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-6 mb-8">
            <HistoricalAnalytics />
          </div>

          {/* ── Logout ── */}
          <button
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-400 transition"
          >
            Logout
          </button>

        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
