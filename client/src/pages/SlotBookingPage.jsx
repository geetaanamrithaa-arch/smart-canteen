import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function SlotBookingPage() {
  const slots = [
    { time: "8:00 AM - 8:30 AM", type: "Breakfast", seats: 120, status: "Available" },
    { time: "10:30 AM - 11:00 AM", type: "Snacks", seats: 95, status: "Available" },
    { time: "1:00 PM - 1:30 PM", type: "Lunch", seats: 48, status: "Filling Fast" },
    { time: "3:30 PM - 4:00 PM", type: "Refreshments", seats: 88, status: "Available" },
    { time: "7:00 PM - 7:30 PM", type: "Dinner", seats: 0, status: "Full" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <Navbar />

      <div className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <p className="text-emerald-300 font-medium mb-2">Meal Slot Booking</p>
              <h1 className="text-4xl font-bold">Choose your preferred meal slot</h1>
              <p className="text-slate-300 mt-2">
                Book in advance to reduce crowding and improve queue flow.
              </p>
            </div>

            <Link
              to="/student-dashboard"
              className="px-5 py-3 rounded-xl border border-white/15 hover:bg-white/10 transition w-fit"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {slots.map((slot, index) => (
              <div
                key={index}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg"
              >
                <p className="text-sm text-emerald-300 font-medium mb-2">{slot.type}</p>
                <h2 className="text-2xl font-bold mb-3">{slot.time}</h2>
                <p className="text-slate-300 mb-2">Available Capacity: {slot.seats}</p>
                <p
                  className={`mb-5 font-medium ${
                    slot.status === "Available"
                      ? "text-green-400"
                      : slot.status === "Filling Fast"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                >
                  {slot.status}
                </p>

                <button
                  className={`w-full py-3 rounded-xl font-bold transition ${
                    slot.status === "Full"
                      ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  }`}
                  disabled={slot.status === "Full"}
                >
                  {slot.status === "Full" ? "Unavailable" : "Book Slot"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SlotBookingPage;