import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function FacultyDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser || !token) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    if (parsedUser.role !== "faculty") {
      if (parsedUser.role === "admin") navigate("/admin-dashboard");
      else if (parsedUser.role === "student") navigate("/student-dashboard");
      else if (parsedUser.role === "staff") navigate("/staff-dashboard");
      return;
    }

    setUser(parsedUser);
  }, [navigate]);

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
          <h1 className="text-3xl font-bold text-emerald-400 mb-2">
            Faculty Dashboard
          </h1>

          <p className="text-slate-300 mb-6">
            Manage faculty meal access, monitor availability, and use the Smart Canteen platform efficiently.
          </p>

          {user && (
            <div className="mb-8 rounded-2xl bg-slate-900/70 border border-white/10 p-5">
              <p className="text-lg">
                <span className="text-slate-400">Name:</span> {user.name}
              </p>
              <p className="text-lg">
                <span className="text-slate-400">Email:</span> {user.email}
              </p>
              <p className="text-lg">
                <span className="text-slate-400">Role:</span> {user.role}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Link
              to="/faculty/queue"
              className="rounded-2xl bg-emerald-400 text-slate-950 p-6 font-bold hover:bg-emerald-300 transition"
            >
              View Queue
            </Link>

            <Link
              to="/faculty/slot-booking"
              className="rounded-2xl bg-white/10 border border-white/10 p-6 font-bold hover:bg-white/15 transition"
            >
              Book Meal Slot
            </Link>
          </div>

          <button
            onClick={handleLogout}
            className="mt-8 px-6 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-400 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default FacultyDashboard;