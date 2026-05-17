import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function QueuePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white">
      <Navbar />

      <div className="p-6 md:p-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <p className="text-emerald-300 font-medium mb-2">Live Queue Management</p>
              <h1 className="text-4xl font-bold">Walk-in Queue Status</h1>
              <p className="text-slate-300 mt-2">
                Join the queue instantly if you want food right now, without booking a slot.
              </p>
            </div>

            <Link
              to="/student-dashboard"
              className="px-5 py-3 rounded-xl border border-white/15 hover:bg-white/10 transition w-fit"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-2">Current Token Being Served</p>
              <h2 className="text-3xl font-bold text-emerald-400">W-112</h2>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-2">Estimated Waiting Time</p>
              <h2 className="text-3xl font-bold">9 mins</h2>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <p className="text-slate-400 text-sm mb-2">People Ahead</p>
              <h2 className="text-3xl font-bold">6</h2>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-2xl font-semibold mb-4 text-emerald-300">
                Your Walk-in Token
              </h3>

              <div className="space-y-3 text-slate-300 mb-6">
                <p><span className="text-white font-medium">Token Number:</span> W-118</p>
                <p><span className="text-white font-medium">Queue Position:</span> 6</p>
                <p><span className="text-white font-medium">Predicted Wait:</span> 9 mins</p>
                <p><span className="text-white font-medium">Status:</span> Active</p>
              </div>

              <button className="w-full py-3 rounded-xl bg-emerald-400 text-slate-950 font-bold hover:bg-emerald-300 transition">
                Join Walk-in Queue
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-2xl font-semibold mb-4 text-emerald-300">
                Why this helps
              </h3>

              <div className="space-y-4 text-slate-300">
                <p>
                  Students who plan ahead can use meal-slot booking during peak rush.
                </p>
                <p>
                  Students who want food immediately can join the live walk-in queue.
                </p>
                <p>
                  This hybrid system makes the platform more flexible and practical for real campus use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QueuePage;