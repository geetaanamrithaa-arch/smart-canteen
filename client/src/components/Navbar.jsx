import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getDashboardLink = () => {
    if (!user) return "/login";

    if (user.role === "admin") return "/admin-dashboard";
    if (user.role === "faculty") return "/faculty-dashboard";
    if (user.role === "staff") return "/staff-dashboard";
    return "/student-dashboard";
  };

  return (
    <nav className="w-full border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="text-2xl font-extrabold text-emerald-400">
          Smart Canteen
        </Link>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/"
            className="rounded-xl border border-white/10 px-5 py-2 text-lg font-medium text-white hover:bg-white/10 transition"
          >
            Home
          </Link>

          {!user ? (
            <>
              <Link
                to="/login"
                className="rounded-xl border border-white/10 px-5 py-2 text-lg font-medium text-white hover:bg-white/10 transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-xl border border-white/10 px-5 py-2 text-lg font-medium text-white hover:bg-white/10 transition"
              >
                Register
              </Link>
            </>
          ) : (
            <>
              <Link
                to={getDashboardLink()}
                className="rounded-xl border border-emerald-400 px-5 py-2 text-lg font-medium text-emerald-400 hover:bg-emerald-400 hover:text-slate-950 transition"
              >
                My Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-red-400 px-5 py-2 text-lg font-medium text-red-400 hover:bg-red-400 hover:text-white transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;