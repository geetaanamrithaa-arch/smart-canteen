import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import API from "../api/api";

function ForgotPasswordPage() {
  const [email,   setEmail]   = useState("");
  const [message, setMessage] = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); setError(""); setLoading(true);

    try {
      const res = await API.post("/auth/forgot-password", { email });
      setMessage(res.data.message);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
            Forgot Password
          </h1>

          <p className="text-slate-300 text-center mb-8">
            Enter your registered email and we will send you a reset link.
          </p>

          {!sent ? (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block mb-2 text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-6 text-center">
              <p className="text-2xl mb-2">📧</p>
              <h2 className="text-lg font-bold text-emerald-800 mb-2">Check your email</h2>
              <p className="text-emerald-700 text-sm">{message}</p>
              <p className="text-slate-500 text-xs mt-3">
                The link expires in 1 hour. Check your spam folder if you don't see it.
              </p>
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

export default ForgotPasswordPage;
