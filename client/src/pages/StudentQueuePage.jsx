import { useEffect, useMemo, useState } from "react";
import API from "../api/api";

function StudentQueuePage() {
  const [queue, setQueue] = useState([]);
  const [slots, setSlots] = useState([]);
  const [myBooking, setMyBooking] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [myToken, setMyToken] = useState(null);
  const [myPosition, setMyPosition] = useState(null);
  const [canCancel, setCanCancel] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "student";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const loggedInUserId = user?._id || user?.id;

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

  const getUserAlertClass = (type) => {
    if (type === "warning") {
      return "border-red-200 bg-red-50 text-red-800";
    }
    if (type === "moderate") {
      return "border-amber-200 bg-amber-50 text-amber-800";
    }
    if (type === "info") {
      return "border-blue-200 bg-blue-50 text-blue-800";
    }
    return "border-green-200 bg-green-50 text-green-800";
  };

  const fetchQueue = async () => {
    try {
      const res = await API.get("/queue");
      const queueData = Array.isArray(res.data) ? res.data : [];

      setQueue(queueData);

      const currentUserToken = queueData.find((item) => {
        const tokenUserId = item.user?._id || item.user?.id || item.user;
        return String(tokenUserId) === String(loggedInUserId) && item.status === "waiting";
      });

      setMyToken(currentUserToken || null);

      if (currentUserToken) {
        const position =
          queueData.findIndex((item) => item._id === currentUserToken._id) + 1;

        setMyPosition(position);

        const createdTime = new Date(currentUserToken.createdAt).getTime();
        const currentTime = new Date().getTime();
        const diffInMinutes = (currentTime - createdTime) / (1000 * 60);

        setCanCancel(diffInMinutes <= 1);
      } else {
        setMyPosition(null);
        setCanCancel(false);
      }

      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch queue");
    }
  };

  const fetchSlots = async () => {
    try {
      const res = await API.get("/slots");
      const slotData = Array.isArray(res.data) ? res.data : [];
      setSlots(slotData);
    } catch (err) {
      console.error("Failed to fetch slots", err);
    }
  };

  const fetchMyBooking = async () => {
    try {
      const res = await API.get("/slots/my-booking");
      setMyBooking(res.data);
    } catch (err) {
      setMyBooking(null);
    }
  };

  const handleJoinQueue = async () => {
    try {
      setMessage("");
      setError("");

      const res = await API.post("/queue/join", {
        name: user.name,
        role: user.role,
      });

      setMessage(res.data.message);
      fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to join queue");
    }
  };

  const handleLeaveQueue = async () => {
    if (!myToken?._id) {
      setError("No active token found");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to cancel your queue token?");
    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      await API.put(`/queue/${myToken._id}`, {
        status: "cancelled",
      });

      setMessage("You have left the queue successfully");
      fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave queue");
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchSlots();
    fetchMyBooking();

    const interval = setInterval(() => {
      fetchQueue();
      fetchSlots();
      fetchMyBooking();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const waitingQueue = useMemo(() => {
    return queue.filter((item) => item.status === "waiting");
  }, [queue]);

  const activeSlots = useMemo(() => {
    return slots.filter((slot) => slot.isActive && slot.bookedCount < slot.maxCapacity);
  }, [slots]);

  const queueStats = useMemo(() => {
    const queueLength = waitingQueue.length;

    const maxWait =
      waitingQueue.length > 0
        ? Math.max(...waitingQueue.map((item) => Number(item.estimatedWaitTime) || 0))
        : 0;

    let crowdLevel = "Low Crowd";

    if (queueLength >= 8 || maxWait >= 15) {
      crowdLevel = "High Crowd";
    } else if (queueLength >= 4 || maxWait >= 8) {
      crowdLevel = "Moderate Crowd";
    }

    return {
      queueLength,
      maxWait,
      crowdLevel,
    };
  }, [waitingQueue]);

  const bestSlotRecommendation = useMemo(() => {
    if (activeSlots.length === 0) return null;

    const sortedSlots = [...activeSlots].sort((a, b) => {
      const utilizationA = a.bookedCount / a.maxCapacity;
      const utilizationB = b.bookedCount / b.maxCapacity;
      return utilizationA - utilizationB;
    });

    return sortedSlots[0];
  }, [activeSlots]);

  const smartRecommendation = useMemo(() => {
    if (myToken) {
      return {
        title: "You are already in the queue",
        action: "Stay in queue",
        reason: "Your token is active, so the best next step is to monitor your position.",
      };
    }

    if (myBooking?.slot) {
      return {
        title: "You already have a slot booking",
        action: `Keep ${myBooking.slot.slotLabel}`,
        reason: "You already hold an active meal slot, so you do not need to join the queue now.",
      };
    }

    if (
      (queueStats.crowdLevel === "High Crowd" || queueStats.maxWait >= 10) &&
      bestSlotRecommendation
    ) {
      return {
        title: "Best option right now",
        action: `Book ${bestSlotRecommendation.slotLabel}`,
        reason: "The current queue is crowded, and this slot has lower utilization for smoother service.",
      };
    }

    return {
      title: "Best option right now",
      action: "Join queue now",
      reason: "The queue is manageable at the moment, so walk-in service is the faster option.",
    };
  }, [myToken, myBooking, queueStats, bestSlotRecommendation]);

  const userAlert = useMemo(() => {
    if (myToken) {
      return {
        type: "info",
        title: "You are already in the live queue",
        message: "Track your position and estimated wait time. Your current token is active.",
      };
    }

    if (myBooking?.slot) {
      return {
        type: "info",
        title: "You already have a meal slot booked",
        message: "No need to join the queue right now. Arrive during your booked time window.",
      };
    }

    if (queueStats.crowdLevel === "High Crowd" || queueStats.maxWait >= 10) {
      return {
        type: "warning",
        title: "High crowd detected",
        message: "Walk-in queue is busy right now. Booking a meal slot is the better option.",
      };
    }

    if (queueStats.crowdLevel === "Moderate Crowd") {
      return {
        type: "moderate",
        title: "Moderate crowd right now",
        message: "You can still join the queue, but booking a slot may reduce waiting.",
      };
    }

    return {
      type: "success",
      title: "Low crowd right now",
      message: "Walk-in queue looks manageable, so joining now is a good option.",
    };
  }, [myToken, myBooking, queueStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-violet-50 p-6">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {roleLabel} Queue Dashboard
            </h1>
            <p className="text-slate-600">
              Join the live canteen queue, track your position, and view your estimated wait time.
            </p>
          </div>

          <div
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold w-fit ${getCrowdBadgeClass(
              queueStats.crowdLevel
            )}`}
          >
            {queueStats.crowdLevel}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-slate-500 text-sm mb-1">Active Queue Size</p>
            <h2 className="text-3xl font-bold text-slate-800">{queueStats.queueLength}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-slate-500 text-sm mb-1">Predicted Max Wait</p>
            <h2 className="text-3xl font-bold text-slate-800">~{queueStats.maxWait} mins</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-slate-500 text-sm mb-1">Available Active Slots</p>
            <h2 className="text-3xl font-bold text-slate-800">{activeSlots.length}</h2>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-700 mb-2">
            Smart Recommendation Engine
          </p>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {smartRecommendation.title}
          </h2>
          <p className="text-lg font-semibold text-emerald-700 mb-2">
            {smartRecommendation.action}
          </p>
          <p className="text-slate-700">{smartRecommendation.reason}</p>

          {bestSlotRecommendation && !myToken && !myBooking?.slot && (
            <div className="mt-4 text-sm text-slate-600">
              Suggested slot:{" "}
              <span className="font-semibold text-slate-800">
                {bestSlotRecommendation.slotLabel}
              </span>{" "}
              ({bestSlotRecommendation.startTime} - {bestSlotRecommendation.endTime})
            </div>
          )}
        </div>

        <div className={`mb-6 rounded-2xl border p-5 ${getUserAlertClass(userAlert.type)}`}>
          <h3 className="text-lg font-bold mb-1">{userAlert.title}</h3>
          <p>{userAlert.message}</p>
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          <button
            onClick={handleJoinQueue}
            disabled={!!myToken || !!myBooking?.slot}
            className={`px-5 py-3 rounded-xl text-white font-semibold transition ${
              myToken || myBooking?.slot
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {myToken
              ? "Already in Queue"
              : myBooking?.slot
              ? "Booking Active"
              : "Join Queue"}
          </button>

          {myToken && canCancel && (
            <button
              onClick={handleLeaveQueue}
              className="bg-red-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-red-700 transition"
            >
              Cancel Within 1 Minute
            </button>
          )}
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

        {myToken && !canCancel && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
            Cancellation window closed. Please contact canteen staff.
          </div>
        )}

        {myToken && (
          <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h2 className="text-xl font-semibold text-slate-800 mb-3">My Active Token</h2>

            <div className="space-y-2 text-slate-700">
              <p><strong>Token Number:</strong> {myToken.tokenNumber}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getQueueStatusClass(
                    myToken.status
                  )}`}
                >
                  {myToken.status}
                </span>
              </p>
              <p><strong>My Position in Queue:</strong> {myPosition}</p>
              <p><strong>People Ahead of Me:</strong> {myPosition ? myPosition - 1 : 0}</p>
              <p><strong>Estimated Wait Time:</strong> ~{myToken.estimatedWaitTime} mins</p>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Live Queue</h2>

        {waitingQueue.length === 0 ? (
          <p className="text-slate-600">No one is in the queue right now.</p>
        ) : (
          <div className="space-y-4">
            {waitingQueue.map((item, index) => (
              <div
                key={item._id}
                className="border border-slate-200 rounded-2xl p-5 bg-slate-50"
              >
                <div className="space-y-2 text-slate-700">
                  <p><strong>Queue Position:</strong> {index + 1}</p>
                  <p><strong>Token Number:</strong> {item.tokenNumber}</p>
                  <p><strong>Name:</strong> {item.name}</p>

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

                  <p><strong>Estimated Wait Time:</strong> ~{item.estimatedWaitTime} mins</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentQueuePage;