import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  Globe, Shield, ShieldAlert, User, Clock, ExternalLink,
  AlertTriangle, CheckCircle, Loader2, Search, Lock,
  Activity, Link2, Star, Sparkles
} from "lucide-react";
import { fetchSharedReport } from "../services/reportService";

interface SocialResult {
  platform: string;
  url: string;
  found: boolean;
  profileData?: { name?: string; bio?: string; followers?: number; isVerified?: boolean; visibilityScore?: string };
}
interface BreachResult {
  platform: string;
  date?: string;
  severity?: string;
  dataExposed?: string[];
  recordCount?: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  GitHub: "bg-gray-900 text-white",
  YouTube: "bg-red-600 text-white",
  Instagram: "bg-pink-600 text-white",
  Reddit: "bg-orange-600 text-white",
  Twitter: "bg-sky-500 text-white",
  TikTok: "bg-black text-white",
  LinkedIn: "bg-blue-700 text-white",
  Telegram: "bg-blue-400 text-white",
  Snapchat: "bg-yellow-400 text-black",
  Facebook: "bg-blue-600 text-white",
};

const severityColor = (s = "") => {
  if (s === "high")   return "bg-red-500/20 text-red-300 border-red-500/30";
  if (s === "medium") return "bg-orange-500/20 text-orange-300 border-orange-500/30";
  return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
};

export function SharedReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchSharedReport(id)
      .then((res) => {
        if (res.success) setReport(res.data);
        else setError(res.message || "Report not found");
      })
      .catch(() => setError("Could not load report"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Loading report...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-white text-xl font-bold mb-2">{error}</h1>
        <p className="text-slate-400 text-sm mb-6">This report may have expired (reports last 7 days) or the link is invalid.</p>
        <button onClick={() => navigate("/")} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-colors">
          Create Your Own Report →
        </button>
      </div>
    </div>
  );

  const scan        = report.scan_data;
  const social      = (scan?.socialResults   || []) as SocialResult[];
  const breaches    = (scan?.breachResults   || []) as BreachResult[];
  const mentions    = (scan?.mentionResults  || []) as any[];
  const searchRes   = (scan?.googleResults   || []) as any[];
  const score       = scan?.riskScore?.score || 0;
  const level       = scan?.riskScore?.level || "Low";
  const query       = report.query || "Unknown";
  const createdAt   = new Date(report.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const expiresAt   = new Date(report.expires_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const scoreColor = score >= 70 ? "#ef4444" : score >= 40 ? "#f97316" : "#22c55e";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#0f172a_0%,_#1e293b_50%,_#0f172a_100%)] text-white">

      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Digital Footprint Analyzer</p>
              <p className="text-slate-400 text-xs">Shared Report · Expires {expiresAt}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Search className="w-3.5 h-3.5" /> Scan Yourself
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-slate-400 text-sm mb-2 flex items-center justify-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Generated on {createdAt}
          </p>
          <h1 className="text-3xl font-bold text-white mb-1">Digital Footprint Report</h1>
          <p className="text-slate-400">
            Public exposure analysis for <span className="text-blue-400 font-medium">"{query}"</span>
          </p>
        </motion.div>

        {/* Score + Stats */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4">
          {/* Privacy Score */}
          <div className="col-span-3 sm:col-span-1 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-slate-400 text-xs mb-3 uppercase tracking-wider">Privacy Score</p>
            <div className="relative w-24 h-24 mx-auto mb-3">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3"
                  strokeDasharray={`${score}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{score}</span>
                <span className="text-xs text-slate-400">{level}</span>
              </div>
            </div>
          </div>

          <div className="col-span-3 sm:col-span-2 grid grid-cols-2 gap-4">
            {[
              { label: "Online Accounts", value: social.length, icon: <User className="w-4 h-4" />, color: "text-blue-400" },
              { label: "Data Breaches", value: breaches.length, icon: <ShieldAlert className="w-4 h-4" />, color: breaches.length > 0 ? "text-red-400" : "text-emerald-400" },
              { label: "Search Results", value: (scan?.googleResults || []).length, icon: <Search className="w-4 h-4" />, color: "text-purple-400" },
              { label: "Mentions", value: (scan?.mentionResults || []).length, icon: <Globe className="w-4 h-4" />, color: "text-orange-400" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
                <div className={`${color} opacity-80`}>{icon}</div>
                <div>
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI SECURITY INSIGHT */}
        {scan?.aiSummary && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-blue-500/20 bg-blue-500/5 overflow-hidden p-6 relative"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-16 h-16 text-blue-400" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-none">AI Security Analysis</h2>
                <p className="text-blue-400/60 text-[10px] uppercase tracking-widest mt-1 font-bold">Expert Privacy Insight</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 relative overflow-hidden">
               <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap relative z-10">
                {scan.aiSummary}
              </div>
            </div>
          </motion.div>
        )}

        {/* Social Profiles */}
        {social.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <h2 className="font-semibold text-white">Online Accounts Found</h2>
              <span className="ml-auto text-xs text-slate-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">{social.length} platforms</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                        {social.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${PLATFORM_COLORS[s.platform] || "bg-slate-700 text-white"}`}>
                    {s.platform.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{s.platform}</p>
                    {s.profileData?.name && <p className="text-xs text-slate-400 truncate">{s.profileData.name}</p>}
                    {s.profileData?.followers != null && (
                      <p className="text-xs text-slate-500">{s.profileData.followers.toLocaleString()} followers</p>
                    )}
                  </div>
                  {s.profileData?.isVerified && <Star className="w-3 h-3 text-blue-400 shrink-0" />}
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </motion.div>
        )}

        {/* Breaches */}
        {breaches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-red-500/20 bg-red-500/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-500/20 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <h2 className="font-semibold text-white">Data Breach Records</h2>
              <span className="ml-auto text-xs text-red-300 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">{breaches.length} breaches</span>
            </div>
            <div className="divide-y divide-white/5">
              {breaches.slice(0, 6).map((b, i) => (
                <div key={i} className="px-6 py-4 flex items-start gap-4">
                  <div className={`mt-0.5 text-xs font-semibold px-2 py-1 rounded-lg border ${severityColor(b.severity)}`}>
                    {(b.severity || "low").toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{b.platform}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {b.date && `${b.date} · `}
                      {b.dataExposed?.join(", ")}
                    </p>
                  </div>
                  {b.recordCount && (
                    <span className="text-xs text-slate-500 shrink-0">
                      {b.recordCount.toLocaleString()} records
                    </span>
                  )}
                </div>
              ))}
              {breaches.length > 6 && (
                <div className="px-6 py-3 text-xs text-slate-500 text-center">
                  + {breaches.length - 6} more breaches hidden
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Web Mentions / Activity Feed */}
        {mentions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
              <Activity className="w-4 h-4 text-orange-400" />
              <h2 className="font-semibold text-white">Activity Feed — Web Mentions</h2>
              <span className="ml-auto text-xs text-slate-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">{mentions.length} mentions</span>
            </div>
            <div className="divide-y divide-white/5">
              {mentions.slice(0, 8).map((m: any, i: number) => (
                <a key={i} href={m.url || m.link || "#"} target="_blank" rel="noopener noreferrer"
                  className="px-5 py-3.5 flex items-start gap-3 hover:bg-white/5 transition-colors group block">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium line-clamp-1 group-hover:text-orange-300 transition-colors">
                      {m.title || m.platform || "Mention"}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{m.snippet || m.content || m.url}</p>
                    {m.platform && <span className="text-xs text-slate-500 mt-1 inline-block">{m.platform}</span>}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400 transition-colors shrink-0 mt-1" />
                </a>
              ))}
              {mentions.length > 8 && (
                <p className="text-center text-xs text-slate-500 py-3">+ {mentions.length - 8} more mentions</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Search Results */}
        {searchRes.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-400" />
              <h2 className="font-semibold text-white">Search Results</h2>
              <span className="ml-auto text-xs text-slate-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">{searchRes.length} results</span>
            </div>
            <div className="divide-y divide-white/5">
              {searchRes.slice(0, 8).map((r: any, i: number) => (
                <a key={i} href={r.link || r.url || "#"} target="_blank" rel="noopener noreferrer"
                  className="px-5 py-3.5 flex items-start gap-3 hover:bg-white/5 transition-colors group block">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Link2 className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium line-clamp-1 group-hover:text-purple-300 transition-colors">
                      {r.title || "Result"}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{r.snippet || r.description || r.link}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors shrink-0 mt-1" />
                </a>
              ))}
              {searchRes.length > 8 && (
                <p className="text-center text-xs text-slate-500 py-3">+ {searchRes.length - 8} more results</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Clean bill — only if truly nothing found */}
        {social.length === 0 && breaches.length === 0 && mentions.length === 0 && searchRes.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h2 className="text-white font-semibold text-lg mb-1">Low Digital Footprint</h2>
            <p className="text-slate-400 text-sm">No public profiles or data breach records were found for this identity.</p>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-8 text-center">
          <Lock className="w-8 h-8 text-blue-400 mx-auto mb-3" />
          <h2 className="text-white font-bold text-xl mb-2">Scan Your Own Digital Footprint</h2>
          <p className="text-slate-400 text-sm mb-5">
            Check what's publicly visible about you — social profiles, data breaches, and web mentions. Free, instant, no credit card.
          </p>
          <button onClick={() => navigate("/login")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity">
            Start Free Scan →
          </button>
        </motion.div>

        <p className="text-center text-xs text-slate-600 pb-4">
          Report ID: {id} · Powered by Digital Footprint Analyzer
        </p>
      </div>
    </div>
  );
}
