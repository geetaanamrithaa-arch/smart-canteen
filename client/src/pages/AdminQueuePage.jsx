import { useEffect, useMemo, useState } from "react";
import API from "../api/api";

function AdminQueuePage() {
  const [queue, setQueue] = useState([]);
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchQueue = async () => {
    try {
      setError("");
      const res = await API.get("/queue");
      setQueue(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch queue");
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await API.get("/slots");
      setSlots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch slots", err);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (status === "cancelled") {
      const confirmed = window.confirm("Are you sure you want to cancel this token?");
      if (!confirmed) return;
    }

    try {
      setMessage("");
      setError("");

      const res = await API.put(`/queue/${id}`, { status });
      setMessage(res.data.message);
      fetchQueue();
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update queue status");
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchSlots();

    const interval = setInterval(() => {
      fetchQueue();
      fetchSlots();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const analytics = useMemo(() => {
    const waitingQueue = queue.filter((item) => item.status === "waiting");
    const totalWaitingUsers = waitingQueue.length;

    const totalWait = waitingQueue.reduce(
      (sum, item) => sum + (Number(item.estimatedWaitTime) || 0),
      0
    );

    const averageWaitTime =
      totalWaitingUsers > 0 ? Math.round(totalWait / totalWaitingUsers) : 0;

    const maxWaitTime =
      totalWaitingUsers > 0
        ? Math.max(...waitingQueue.map((item) => Number(item.estimatedWaitTime) || 0))
        : 0;

    const studentsInQueue = waitingQueue.filter(
      (item) => item.role === "student"
    ).length;

    const facultyAndStaffInQueue = waitingQueue.filter(
      (item) => item.role === "faculty" || item.role === "staff"
    ).length;

    const activeSlots = slots.filter((slot) => slot.isActive);
    const nearlyFullSlots = activeSlots.filter((slot) => {
      const utilization =
        slot.maxCapacity > 0 ? slot.bookedCount / slot.maxCapacity : 0;
      return utilization >= 0.8 && slot.bookedCount < slot.maxCapacity;
    });

    let crowdLevel = "Low Crowd";
    if (totalWaitingUsers >= 8 || maxWaitTime >= 15) {
      crowdLevel = "High Crowd";
    } else if (totalWaitingUsers >= 4 || maxWaitTime >= 8) {
      crowdLevel = "Moderate Crowd";
    }

    return {
      totalWaitingUsers,
      averageWaitTime,
      maxWaitTime,
      studentsInQueue,
      facultyAndStaffInQueue,
      nearlyFullSlotsCount: nearlyFullSlots.length,
      crowdLevel,
    };
  }, [queue, slots]);

  const adminAlerts = useMemo(() => {
    const alerts = [];

    if (analytics.totalWaitingUsers >= 8) {
      alerts.push({
        type: "high",
        title: "Queue congestion detected",
        description: `There are ${analytics.totalWaitingUsers} active users in the queue right now.`,
      });
    }

    if (analytics.maxWaitTime >= 15) {
      alerts.push({
        type: "high",
        title: "Wait time too high",
        description: `The predicted maximum wait time is about ${analytics.maxWaitTime} minutes.`,
      });
    }

    if (analytics.nearlyFullSlotsCount > 0) {
      alerts.push({
        type: "medium",
        title: "Meal slots nearly full",
        description: `${analytics.nearlyFullSlotsCount} active slot(s) are above 80% capacity.`,
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: "good",
        title: "Queue flow is stable",
        description: "No major congestion or slot pressure is detected right now.",
      });
    }

    return alerts;
  }, [analytics]);

  const getRoleBadgeClass = (role) => {
    if (role === "student") return "bg-violet-100 text-violet-800 border border-violet-200";
    if (role === "faculty") return "bg-blue-100 text-blue-800 border border-blue-200";
    if (role === "staff") return "bg-amber-100 text-amber-800 border border-amber-200";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const getQueueStatusClass = (status) => {
    if (status === "waiting") return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    if (status === "served") return "bg-green-100 text-green-800 border border-green-200";
    if (status === "cancelled") return "bg-red-100 text-red-800 border border-red-200";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const getCrowdBadgeClass = (level) => {
    if (level === "Low Crowd") {
      return "bg-green-100 text-green-800 border border-green-200";
    }
    if (level === "Moderate Crowd") {
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    }
    return "bg-red-100 text-red-800 border border-red-200";
  };

  const getAlertClass = (type) => {
    if (type === "high") return "border-red-200 bg-red-50 text-red-800";
    if (type === "medium") return "border-amber-200 bg-amber-50 text-amber-800";
    return "border-green-200 bg-green-50 text-green-800";
  };

  const visibleQueue = useMemo(() => {
    return queue.filter((item) => item.status === "waiting");
  }, [queue]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              Admin Queue Management
            </h1>
            <p className="text-slate-600">
              Monitor the live queue, track wait times, and manage serving flow in real time.
            </p>
          </div>

          <div
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold w-fit ${getCrowdBadgeClass(
              analytics.crowdLevel
            )}`}
          >
            {analytics.crowdLevel}
          </div>
        </div>

        {message && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8">
          <p className="text-sm font-semibold text-slate-700 mb-3">Admin Alerts</p>

          <div className="space-y-3">
            {adminAlerts.map((alert, index) => (
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

        <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-5">
            <p className="text-sm text-slate-600 mb-1">Total Waiting Users</p>
            <h2 className="text-3xl font-bold text-blue-700">
              {analytics.totalWaitingUsers}
            </h2>
          </div>

          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
            <p className="text-sm text-slate-600 mb-1">Average Wait Time</p>
            <h2 className="text-3xl font-bold text-emerald-700">
              ~{analytics.averageWaitTime} mins
            </h2>
          </div>

          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-5">
            <p className="text-sm text-slate-600 mb-1">Max Wait Time</p>
            <h2 className="text-3xl font-bold text-rose-700">
              ~{analytics.maxWaitTime} mins
            </h2>
          </div>

          <div className="rounded-2xl bg-violet-50 border border-violet-200 p-5">
            <p className="text-sm text-slate-600 mb-1">Students in Queue</p>
            <h2 className="text-3xl font-bold text-violet-700">
              {analytics.studentsInQueue}
            </h2>
          </div>

          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <p className="text-sm text-slate-600 mb-1">Faculty + Staff</p>
            <h2 className="text-3xl font-bold text-amber-700">
              {analytics.facultyAndStaffInQueue}
            </h2>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Live Queue</h2>

        {visibleQueue.length === 0 ? (
          <p className="text-slate-600">No one is in the queue right now.</p>
        ) : (
          <div className="space-y-4">
            {visibleQueue.map((item, index) => (
              <div
                key={item._id}
                className="border border-slate-200 rounded-2xl p-5 bg-slate-50"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <p>
                      <strong>Queue Position:</strong> {index + 1}
                    </p>
                    <p>
                      <strong>Token Number:</strong> {item.tokenNumber}
                    </p>
                    <p>
                      <strong>Name:</strong> {item.name}
                    </p>

                    <p>
                      <strong>Role:</strong>{" "}
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeClass(
                          item.role
                        )}`}
                      >
                        {item.role}
                      </span>
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getQueueStatusClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </p>

                    <p>
                      <strong>Estimated Wait Time:</strong> ~{item.estimatedWaitTime} mins
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => handleUpdateStatus(item._id, "served")}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition"
                    >
                      Mark Served
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(item._id, "cancelled")}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition"
                    >
                      Cancel Token
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminQueuePage;