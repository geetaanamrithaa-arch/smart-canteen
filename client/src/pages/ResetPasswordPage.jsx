import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api/api";

function ResetPasswordPage() {
  const { token }    = useParams();
  const navigate     = useNavigate();
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [message,    setMessage]    = useState("");
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post(`/auth/reset-password/${token}`, { password });
      setMessage(res.data.message);
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <Navbar />

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg bg-white/5 border border-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-center text-emerald-400 mb-2">
            Reset Password
          </h1>
          <p className="text-slate-300 text-center mb-8">
            Enter your new password below.
          </p>

          {!done ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block mb-2 text-sm text-slate-300">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block mb-2 text-sm text-slate-300">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white outline-none focus:border-emerald-400"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-bold transition ${
                  loading
                    ? "bg-emerald-700 cursor-not-allowed text-slate-300"
                    : "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                }`}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-6 text-center">
              <p className="text-2xl mb-2">✅</p>
              <h2 className="text-lg font-bold text-emerald-800 mb-2">Password Reset!</h2>
              <p className="text-emerald-700 text-sm">{message}</p>
              <p className="text-slate-500 text-xs mt-3">Redirecting to login...</p>
            </div>
          )}

          <div className="text-center mt-6">
            <Link to="/login" className="text-emerald-400 hover:underline text-sm">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
