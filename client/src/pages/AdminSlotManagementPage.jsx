import { useEffect, useState } from "react";
import API from "../api/api";
import Navbar from "../components/Navbar";

function AdminSlotManagementPage() {
  const [slots, setSlots] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingSlotId, setEditingSlotId] = useState(null);

  const [formData, setFormData] = useState({
    slotLabel: "",
    startHour: "12",
    startMinute: "00",
    startPeriod: "PM",
    endHour: "12",
    endMinute: "30",
    endPeriod: "PM",
    maxCapacity: "",
  });

  const hours = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const minutes = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];
  const periods = ["AM", "PM"];

  const formatTime = (hour, minute, period) => `${hour}:${minute} ${period}`;

  const parseTime = (timeString) => {
    const match = timeString?.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

    if (!match) {
      return { hour: "12", minute: "00", period: "PM" };
    }

    let [, hour, minute, period] = match;
    hour = hour.padStart(2, "0");

    return {
      hour,
      minute,
      period: period.toUpperCase(),
    };
  };

  const getSlotStatusClass = (isActive) => {
    return isActive
      ? "bg-green-100 text-green-800 border border-green-200"
      : "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const fetchSlots = async () => {
    try {
      const res = await API.get("/slots/all");
      setSlots(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch (err) {
      console.error("Fetch slots error:", err);
      setError(err.response?.data?.message || "Failed to fetch slots");
      setSlots([]);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      slotLabel: "",
      startHour: "12",
      startMinute: "00",
      startPeriod: "PM",
      endHour: "12",
      endMinute: "30",
      endPeriod: "PM",
      maxCapacity: "",
    });
    setEditingSlotId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      setError("");

      const startTime = formatTime(
        formData.startHour,
        formData.startMinute,
        formData.startPeriod
      );

      const endTime = formatTime(
        formData.endHour,
        formData.endMinute,
        formData.endPeriod
      );

      const payload = {
        slotLabel: formData.slotLabel,
        startTime,
        endTime,
        maxCapacity: Number(formData.maxCapacity),
      };

      if (editingSlotId) {
        const res = await API.put(`/slots/details/${editingSlotId}`, payload);
        setMessage(res.data.message || "Meal slot updated successfully");
      } else {
        const res = await API.post("/slots", payload);
        setMessage(res.data.message || "Meal slot created successfully");
      }

      resetForm();
      fetchSlots();
    } catch (err) {
      console.error("Submit slot error:", err);
      setError(err.response?.data?.message || "Failed to save slot");
    }
  };

  const handleEditSlot = (slot) => {
    const start = parseTime(slot.startTime);
    const end = parseTime(slot.endTime);

    setEditingSlotId(slot._id);
    setFormData({
      slotLabel: slot.slotLabel,
      startHour: start.hour,
      startMinute: start.minute,
      startPeriod: start.period,
      endHour: end.hour,
      endMinute: end.minute,
      endPeriod: end.period,
      maxCapacity: slot.maxCapacity,
    });
    setMessage("");
    setError("");
  };

  const handleDeleteSlot = async (slotId) => {
    const confirmed = window.confirm("Are you sure you want to delete this meal slot?");
    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      const res = await API.delete(`/slots/${slotId}`);
      setMessage(res.data.message || "Meal slot deleted successfully");
      fetchSlots();

      if (editingSlotId === slotId) {
        resetForm();
      }
    } catch (err) {
      console.error("Delete slot error:", err);
      setError(err.response?.data?.message || "Failed to delete slot");
    }
  };

  const handleToggleSlot = async (slotId, currentStatus) => {
    try {
      setMessage("");
      setError("");

      const res = await API.put(`/slots/${slotId}`, {
        isActive: !currentStatus,
      });

      setMessage(res.data.message || "Slot updated successfully");
      fetchSlots();
    } catch (err) {
      console.error("Toggle slot error:", err);
      setError(err.response?.data?.message || "Failed to update slot");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50">
      <Navbar />

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white shadow-lg rounded-2xl border border-slate-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Admin Meal Slot Management
          </h1>
          <p className="text-slate-600 mb-6">
            Create, edit, activate, deactivate, and delete meal slots for the canteen system.
          </p>

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

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block font-medium text-slate-700 mb-2">Slot Label</label>
              <input
                type="text"
                name="slotLabel"
                placeholder="Example: Lunch Slot 1"
                value={formData.slotLabel}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-2">Maximum Capacity</label>
              <input
                type="number"
                name="maxCapacity"
                placeholder="Example: 20"
                value={formData.maxCapacity}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
            </div>

            <div className="hidden md:block" />

            <div>
              <label className="block font-medium text-slate-700 mb-2">Start Time</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  name="startHour"
                  value={formData.startHour}
                  onChange={handleChange}
                  className="border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>

                <select
                  name="startMinute"
                  value={formData.startMinute}
                  onChange={handleChange}
                  className="border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {minutes.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>

                <select
                  name="startPeriod"
                  value={formData.startPeriod}
                  onChange={handleChange}
                  className="border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-2">End Time</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  name="endHour"
                  value={formData.endHour}
                  onChange={handleChange}
                  className="border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>

                <select
                  name="endMinute"
                  value={formData.endMinute}
                  onChange={handleChange}
                  className="border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {minutes.map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>

                <select
                  name="endPeriod"
                  value={formData.endPeriod}
                  onChange={handleChange}
                  className="border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {periods.map((period) => (
                    <option key={period} value={period}>
                      {period}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="md:col-span-2 bg-emerald-600 text-white rounded-xl py-3 font-semibold hover:bg-emerald-700 transition"
            >
              {editingSlotId ? "Update Meal Slot" : "Create Meal Slot"}
            </button>
          </form>

          {editingSlotId && (
            <button
              onClick={resetForm}
              className="mt-4 bg-slate-500 text-white px-4 py-2 rounded-xl hover:bg-slate-600 transition"
            >
              Cancel Edit
            </button>
          )}
        </div>

        <div className="bg-white shadow-lg rounded-2xl border border-slate-200 p-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Existing Meal Slots</h2>

          {slots.length === 0 ? (
            <p className="text-slate-600">No meal slots found.</p>
          ) : (
            <div className="space-y-4">
              {slots.map((slot) => (
                <div
                  key={slot._id}
                  className="border border-slate-200 rounded-2xl p-5 bg-slate-50"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="space-y-2">
                      <p>
                        <strong>Slot:</strong> {slot.slotLabel}
                      </p>
                      <p>
                        <strong>Time:</strong> {slot.startTime} - {slot.endTime}
                      </p>
                      <p>
                        <strong>Capacity:</strong> {slot.bookedCount || 0} / {slot.maxCapacity}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getSlotStatusClass(
                            slot.isActive
                          )}`}
                        >
                          {slot.isActive ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleToggleSlot(slot._id, slot.isActive)}
                        className={`px-4 py-2 rounded-xl text-white font-medium transition ${
                          slot.isActive
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {slot.isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => handleEditSlot(slot)}
                        className="px-4 py-2 rounded-xl text-white font-medium bg-amber-500 hover:bg-amber-600 transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteSlot(slot._id)}
                        className="px-4 py-2 rounded-xl text-white font-medium bg-slate-700 hover:bg-slate-800 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminSlotManagementPage;