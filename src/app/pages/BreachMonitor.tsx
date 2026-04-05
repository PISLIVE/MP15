import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Plus, Trash2, RefreshCw, ShieldCheck, ShieldAlert, Clock, Mail, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  triggerCheckNow,
} from "../services/monitorService";

interface MonitoredEmail {
  id: string;
  email: string;
  status: "pending" | "safe" | "breached" | "new_breach";
  known_breach_count: number;
  last_checked: string | null;
  created_at: string;
}

const StatusBadge = ({ status, count }: { status: string; count: number }) => {
  const map: Record<string, { label: string; classes: string; icon: React.ReactNode }> = {
    safe:      { label: "Safe",       classes: "bg-emerald-50 text-emerald-700 border-emerald-200",    icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    breached:  { label: `${count} Breach${count !== 1 ? "es" : ""}`, classes: "bg-red-50 text-red-700 border-red-200", icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    new_breach:{ label: "🆕 New Breach!", classes: "bg-orange-50 text-orange-700 border-orange-200 animate-pulse", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    pending:   { label: "Pending",    classes: "bg-slate-50 text-slate-500 border-slate-200",          icon: <Clock className="w-3.5 h-3.5" /> },
  };
  const s = map[status] || map["pending"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${s.classes}`}>
      {s.icon}{s.label}
    </span>
  );
};

export function BreachMonitor() {
  const navigate = useNavigate();
  const [list, setList]           = useState<MonitoredEmail[]>([]);
  const [loading, setLoading]     = useState(true);
  const [email, setEmail]         = useState("");
  const [adding, setAdding]       = useState(false);
  const [checking, setChecking]   = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await getWatchlist();
      if (res.success) setList(res.data || []);
    } catch {
      toast.error("Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!email.trim()) return;
    setAdding(true);
    try {
      const res = await addToWatchlist(email.trim());
      if (res.success) {
        toast.success(`Now watching ${email}`);
        setEmail("");
        await load();
      } else {
        toast.error(res.message || "Failed to add email");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to add email";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };


  const handleRemove = async (id: string, em: string) => {
    try {
      await removeFromWatchlist(id);
      toast.success(`Removed ${em}`);
      setList((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Failed to remove");
    }
  };

  const handleCheckNow = async (id: string) => {
    setChecking(id);
    try {
      const res = await triggerCheckNow(id);
      if (res.success) {
        toast.success("Breach check started! Results update in ~10 seconds.");
        setTimeout(load, 12000);
      } else {
        toast.error(res.message || "Check failed");
      }
    } catch {
      toast.error("Check failed");
    } finally {
      setChecking(null);
    }
  };

  const formatDate = (iso: string | null) => {
    if (!iso) return "Never";
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const totalBreached = list.filter((r) => r.status === "breached" || r.status === "new_breach").length;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0f172a_0%,_#1e293b_50%,_#0f172a_100%)]">
      {/* Nav */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/dashboard")} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-none">Breach Monitor</h1>
            <p className="text-slate-400 text-xs">Get alerted when your emails appear in new breaches</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Watching", value: list.length, icon: <Mail className="w-4 h-4 text-blue-400" />, color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20" },
            { label: "Breached", value: totalBreached, icon: <ShieldAlert className="w-4 h-4 text-red-400" />, color: "from-red-500/10 to-rose-500/10 border-red-500/20" },
            { label: "Safe",     value: list.filter(r => r.status === "safe").length, icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />, color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20" },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`rounded-2xl border bg-gradient-to-br ${color} p-4 text-center`}>
              <div className="flex justify-center mb-1">{icon}</div>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Add email form */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-400" /> Add Email to Watchlist
          </h2>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAdd()}
              placeholder="someone@example.com"
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              disabled={adding || !email.trim()}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Watch
            </motion.button>
          </div>
          <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
            <Bell className="w-3 h-3" /> You'll receive an email alert if a new breach is detected. Checked daily at 8:00 AM.
          </p>
        </div>

        {/* Watchlist */}
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" /> Your Watchlist
          </h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
              <Bell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No emails being monitored yet.</p>
              <p className="text-slate-500 text-xs mt-1">Add an email above to start getting breach alerts.</p>
            </div>
          ) : (
            <AnimatePresence>
              {list.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex items-center gap-4"
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    record.status === "breached" || record.status === "new_breach"
                      ? "bg-red-500/20"
                      : record.status === "safe" ? "bg-emerald-500/20" : "bg-slate-500/20"
                  }`}>
                    <Mail className={`w-5 h-5 ${
                      record.status === "breached" || record.status === "new_breach"
                        ? "text-red-400"
                        : record.status === "safe" ? "text-emerald-400" : "text-slate-400"
                    }`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{record.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <StatusBadge status={record.status} count={record.known_breach_count} />
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(record.last_checked)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCheckNow(record.id)}
                      disabled={checking === record.id}
                      title="Check now"
                      className="w-8 h-8 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      {checking === record.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <RefreshCw className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleRemove(record.id, record.email)}
                      title="Remove"
                      className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Info box */}
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
          <h3 className="text-blue-300 font-semibold text-sm mb-2 flex items-center gap-2">
            <Bell className="w-4 h-4" /> How it works
          </h3>
          <ul className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
            <li>🔍 Every day at 8:00 AM, all watched emails are checked against <strong className="text-slate-300">XposedOrNot's</strong> breach database</li>
            <li>📧 If a NEW breach is detected, you'll receive an <strong className="text-slate-300">email alert</strong> with details and recommendations</li>
            <li>🔄 Click <strong className="text-slate-300">Check Now</strong> to run an immediate check on any email</li>
            <li>🆓 Completely free — powered by open breach intelligence APIs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
