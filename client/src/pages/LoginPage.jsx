import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api/api";

function LoginPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await API.post("/auth/login", formData);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage(res.data.message || "Login successful");

      setTimeout(() => {
        const role = res.data.user.role;

        if (role === "admin") {
          navigate("/admin-dashboard");
        } else if (role === "faculty") {
          navigate("/faculty-dashboard");
        } else if (role === "staff") {
          navigate("/staff-dashboard");
        } else {
          navigate("/student-dashboard");
        }
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <Navbar />

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center text-emerald-400 mb-2">
            Login
          </h1>
          <p className="text-slate-300 text-center mb-8">
            Sign in to access the Smart Canteen platform
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-2 text-sm text-slate-300">Email</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm text-slate-300">Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white outline-none focus:border-emerald-400"
                required
              />
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-emerald-400 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>

            {message && (
              <p className="text-sm text-green-400 font-medium">{message}</p>
            )}

            {error && (
              <p className="text-sm text-red-400 font-medium">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-300 transition"
            >
              Login
            </button>
          </form>

          <p className="text-center text-slate-300 mt-6">
            Don’t have an account?{" "}
            <Link to="/register" className="text-emerald-400 hover:underline">
              Register
            </Link>
          </p>

          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-slate-400 hover:text-white">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;