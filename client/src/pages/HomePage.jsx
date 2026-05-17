import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function HomePage() {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const getDashboardLink = () => {
    if (!user) return null;

    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "faculty") return "/faculty-dashboard";
    if (user.role === "staff") return "/staff-dashboard";
    return "/student-dashboard";
  };

  const getDashboardLabel = () => {
    if (!user) return null;

    if (user.role === "admin") return "Admin Dashboard";
    if (user.role === "faculty") return "Faculty Dashboard";
    if (user.role === "staff") return "Staff Dashboard";
    return "Student Dashboard";
  };

  const getQueueLink = () => {
    if (!user) return "/login";

    if (user.role === "admin") return "/admin/queue";
    if (user.role === "faculty") return "/faculty/queue";
    if (user.role === "staff") return "/staff/queue";
    return "/student/queue";
  };

  const getSlotLink = () => {
    if (!user) return "/login";

    if (user.role === "faculty") return "/faculty/slot-booking";
    if (user.role === "staff") return "/staff/slot-booking";
    if (user.role === "student") return "/student/slot-booking";

    return "/admin-dashboard";
  };

  const getQueueLabel = () => {
    if (!user) return "View Queue";
    return user.role === "admin" ? "Manage Queue" : "View Queue";
  };

  const getSlotLabel = () => {
    if (!user) return "Book Meal Slot";
    return user.role === "admin" ? "Manage Meal Slots" : "Book Meal Slot";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-emerald-950 text-white">
      <Navbar />

      <section className="px-6 py-16 md:px-12 lg:px-20">
        <div className="max-w-6xl mx-auto">
          <p className="text-emerald-400 text-lg font-semibold mb-6">
            Smart Queue • Fair Slot Booking • Wait-Time Prediction
          </p>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-8 text-slate-100">
            Smarter canteen flow for a better campus experience
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 max-w-5xl leading-relaxed mb-12">
            A full-stack web platform that helps students, faculty, staff, and admins
            manage meal slots, receive digital queue tokens, track live waiting time,
            and reduce crowding in campus canteens through fair allocation and analytics.
          </p>

          <div className="flex flex-wrap gap-5">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="px-8 py-4 rounded-2xl bg-emerald-400 text-slate-950 font-bold text-xl hover:bg-emerald-300 transition"
                >
                  Get Started
                </Link>

                <Link
                  to="/login"
                  className="px-8 py-4 rounded-2xl border border-white/20 bg-white/5 text-white font-semibold text-xl hover:bg-white/10 transition"
                >
                  Login to Portal
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={getDashboardLink()}
                  className="px-8 py-4 rounded-2xl border border-emerald-400 bg-transparent text-emerald-400 font-semibold text-xl hover:bg-emerald-400 hover:text-slate-950 transition"
                >
                  {getDashboardLabel()}
                </Link>

                <Link
                  to={getQueueLink()}
                  className="px-8 py-4 rounded-2xl border border-white/20 bg-white/5 text-white font-semibold text-xl hover:bg-white/10 transition"
                >
                  {getQueueLabel()}
                </Link>

                <Link
                  to={getSlotLink()}
                  className="px-8 py-4 rounded-2xl border border-white/20 bg-white/5 text-white font-semibold text-xl hover:bg-white/10 transition"
                >
                  {getSlotLabel()}
                </Link>
              </>
            )}
          </div>

          <div className="mt-16 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-8 md:p-10 shadow-2xl">
            <h2 className="text-4xl font-bold text-emerald-400 mb-8">
              Platform Highlights
            </h2>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-6">
                <h3 className="text-2xl font-semibold mb-3 text-white">
                  Digital Queue Tokens
                </h3>
                <p className="text-slate-300">
                  Reduce long physical lines with real-time digital queue management for walk-in users.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-6">
                <h3 className="text-2xl font-semibold mb-3 text-white">
                  Meal Slot Allocation
                </h3>
                <p className="text-slate-300">
                  Book optional meal slots during rush hours for better crowd balancing and fairness.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-6">
                <h3 className="text-2xl font-semibold mb-3 text-white">
                  Wait-Time Prediction
                </h3>
                <p className="text-slate-300">
                  View estimated waiting time based on live queue conditions and demand trends.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-6">
                <h3 className="text-2xl font-semibold mb-3 text-white">
                  Role-Based Access
                </h3>
                <p className="text-slate-300">
                  Separate dashboards for students, faculty, staff, and admins for a cleaner experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;