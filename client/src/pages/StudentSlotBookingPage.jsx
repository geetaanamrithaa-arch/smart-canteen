import { useEffect, useMemo, useState } from "react";
import API from "../api/api";

function StudentSlotBookingPage() {
  const [slots, setSlots] = useState([]);
  const [queue, setQueue] = useState([]);
  const [myBooking, setMyBooking] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role || "student";
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  const getSlotStatusClass = (isActive) => {
    return isActive
      ? "bg-green-100 text-green-800 border border-green-200"
      : "bg-gray-100 text-gray-700 border border-gray-200";
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

  const getDemandBadgeClass = (level) => {
    if (level === "Low Demand") {
      return "bg-green-100 text-green-800 border border-green-200";
    }
    if (level === "Moderate Demand") {
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

  const fetchSlots = async () => {
    try {
      const res = await API.get("/slots");
      setSlots(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch slots");
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await API.get("/queue");
      setQueue(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch queue", err);
    }
  };

  const fetchMyBooking = async () => {
    try {
      const res = await API.get("/slots/my-booking");
      setMyBooking(res.data);
      setError("");
    } catch (err) {
      setMyBooking(null);
    }
  };

  const handleBookSlot = async (slotId) => {
    try {
      setMessage("");
      setError("");

      const res = await API.post("/slots/book", {
        slotId,
        studentName: user.name,
      });

      setMessage(res.data.message);
      fetchSlots();
      fetchMyBooking();
      fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book slot");
    }
  };

  const handleCancelBooking = async () => {
    const confirmed = window.confirm("Are you sure you want to cancel your meal slot booking?");
    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      const res = await API.put("/slots/my-booking/cancel");
      setMessage(res.data.message);
      fetchSlots();
      fetchMyBooking();
      fetchQueue();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking");
    }
  };

  useEffect(() => {
    fetchSlots();
    fetchQueue();
    fetchMyBooking();

    const interval = setInterval(() => {
      fetchSlots();
      fetchQueue();
      fetchMyBooking();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const waitingQueue = useMemo(() => {
    return queue.filter((item) => item.status === "waiting");
  }, [queue]);

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

  const visibleSlots = useMemo(() => {
    return slots.filter((slot) => {
      const isMyBookedSlot = myBooking?.slot?._id === slot._id;
      const isBookable = slot.isActive && slot.bookedCount < slot.maxCapacity;

      return !isMyBookedSlot && isBookable;
    });
  }, [slots, myBooking]);

  const getSlotDemandLevel = (slot) => {
    const utilization = slot.maxCapacity > 0 ? slot.bookedCount / slot.maxCapacity : 0;

    if (utilization >= 0.8) return "High Demand";
    if (utilization >= 0.5) return "Moderate Demand";
    return "Low Demand";
  };

  const bestRecommendedSlot = useMemo(() => {
    if (visibleSlots.length === 0) return null;

    const sortedSlots = [...visibleSlots].sort((a, b) => {
      const utilizationA = a.bookedCount / a.maxCapacity;
      const utilizationB = b.bookedCount / b.maxCapacity;

      if (utilizationA !== utilizationB) {
        return utilizationA - utilizationB;
      }

      return a.bookedCount - b.bookedCount;
    });

    return sortedSlots[0];
  }, [visibleSlots]);

  const recommendationText = useMemo(() => {
    if (myBooking?.slot) {
      return {
        title: "You already have a booking",
        action: `Keep ${myBooking.slot.slotLabel}`,
        reason: "Your current meal slot is active, so no new slot selection is needed.",
      };
    }

    if (bestRecommendedSlot) {
      return {
        title: "Recommended slot for you",
        action: bestRecommendedSlot.slotLabel,
        reason:
          queueStats.crowdLevel === "High Crowd"
            ? "The current queue is crowded, so booking this lower-utilization slot is the better option."
            : "This slot currently has the best available capacity and the smoothest expected flow.",
      };
    }

    return {
      title: "No slots available",
      action: "Check again soon",
      reason: "All active meal slots are either full or unavailable at the moment.",
    };
  }, [myBooking, bestRecommendedSlot, queueStats]);

  const userAlert = useMemo(() => {
    if (myBooking?.slot) {
      return {
        type: "info",
        title: "You already have an active booking",
        message: "Your meal slot is reserved. You do not need another slot right now.",
      };
    }

    if (queueStats.crowdLevel === "High Crowd" && bestRecommendedSlot) {
      return {
        type: "warning",
        title: "High crowd detected",
        message: "Booking a slot is strongly recommended right now to avoid long queue waiting.",
      };
    }

    if (queueStats.crowdLevel === "Moderate Crowd" && bestRecommendedSlot) {
      return {
        type: "moderate",
        title: "Moderate queue pressure",
        message: "A meal slot may give you smoother service than joining the walk-in queue.",
      };
    }

    if (visibleSlots.length > 0) {
      return {
        type: "success",
        title: "Slots available now",
        message: "You have active options available, and current booking pressure looks manageable.",
      };
    }

    return {
      type: "warning",
      title: "No active slots available",
      message: "Please check again shortly or use the live walk-in queue if needed.",
    };
  }, [myBooking, queueStats, bestRecommendedSlot, visibleSlots]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50 p-6">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {roleLabel} Meal Slot Booking
            </h1>
            <p className="text-slate-600">
              View available meal slots, reserve one slot, and manage your current booking.
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
            <p className="text-slate-500 text-sm mb-1">Current Queue Size</p>
            <h2 className="text-3xl font-bold text-slate-800">{queueStats.queueLength}</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-slate-500 text-sm mb-1">Predicted Queue Wait</p>
            <h2 className="text-3xl font-bold text-slate-800">~{queueStats.maxWait} mins</h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-slate-500 text-sm mb-1">Available Slots Now</p>
            <h2 className="text-3xl font-bold text-slate-800">{visibleSlots.length}</h2>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-semibold text-emerald-700 mb-2">
            Smart Recommendation Engine
          </p>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {recommendationText.title}
          </h2>
          <p className="text-lg font-semibold text-emerald-700 mb-2">
            {recommendationText.action}
          </p>
          <p className="text-slate-700">{recommendationText.reason}</p>

          {bestRecommendedSlot && !myBooking?.slot && (
            <div className="mt-4 text-sm text-slate-600">
              Best slot time:{" "}
              <span className="font-semibold text-slate-800">
                {bestRecommendedSlot.startTime} - {bestRecommendedSlot.endTime}
              </span>
            </div>
          )}
        </div>

        <div className={`mb-6 rounded-2xl border p-5 ${getUserAlertClass(userAlert.type)}`}>
          <h3 className="text-lg font-bold mb-1">{userAlert.title}</h3>
          <p>{userAlert.message}</p>
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

        {myBooking && myBooking.slot && (
          <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h2 className="text-xl font-semibold text-slate-800 mb-3">My Current Booking</h2>

            <div className="space-y-2 text-slate-700">
              <p><strong>Slot:</strong> {myBooking.slot.slotLabel}</p>
              <p><strong>Time:</strong> {myBooking.slot.startTime} - {myBooking.slot.endTime}</p>
              <p><strong>Status:</strong> {myBooking.bookingStatus}</p>
              <p className="text-sm text-slate-600 pt-1">
                You can only hold one active meal slot at a time.
              </p>
            </div>

            <button
              onClick={handleCancelBooking}
              className="mt-4 bg-red-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-red-700 transition"
            >
              Cancel Booking
            </button>
          </div>
        )}

        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Available Meal Slots</h2>

        {visibleSlots.length === 0 ? (
          <p className="text-slate-600">No meal slots available right now.</p>
        ) : (
          <div className="space-y-4">
            {visibleSlots.map((slot) => {
              const demandLevel = getSlotDemandLevel(slot);

              return (
                <div
                  key={slot._id}
                  className="border border-slate-200 rounded-2xl p-5 bg-slate-50"
                >
                  <div className="space-y-3 text-slate-700">
                    <p><strong>Slot:</strong> {slot.slotLabel}</p>
                    <p><strong>Time:</strong> {slot.startTime} - {slot.endTime}</p>
                    <p><strong>Capacity:</strong> {slot.bookedCount} / {slot.maxCapacity}</p>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSlotStatusClass(
                          slot.isActive
                        )}`}
                      >
                        {slot.isActive ? "Active" : "Inactive"}
                      </span>

                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getDemandBadgeClass(
                          demandLevel
                        )}`}
                      >
                        {demandLevel}
                      </span>

                      {bestRecommendedSlot?._id === slot._id && !myBooking?.slot && (
                        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Recommended
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleBookSlot(slot._id)}
                    disabled={!!myBooking}
                    className={`mt-4 px-5 py-3 rounded-xl text-white font-semibold transition ${
                      myBooking
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {myBooking ? "One Slot Already Booked" : "Book Slot"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentSlotBookingPage;