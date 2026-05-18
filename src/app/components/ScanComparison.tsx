import { useMemo } from "react";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  UserMinus,
  Globe,
  TrendingUp,
  TrendingDown,
  Equal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { ScanData } from "../types/scan";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ScanComparisonProps {
  currentScan: ScanData;
  previousScan?: ScanData | null;
  previousDate?: string;
}

interface DiffItem {
  platform: string;
  url?: string;
  type: "added" | "removed";
}

interface BreachDiff {
  name: string;
  date?: string;
  severity?: string;
  type: "new" | "resolved";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getProfileKey(s: { platform: string; url?: string }): string {
  // Normalize to deduplicate
  return `${(s.platform || "").toLowerCase()}::${(s.url || "").toLowerCase().replace(/\/$/, "")}`;
}

function getBreachKey(b: { platform?: string; name?: string; domain?: string; date?: string }): string {
  return `${(b.platform || b.name || b.domain || "").toLowerCase()}::${(b.date || "").toLowerCase()}`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function ScanComparison({ currentScan, previousScan, previousDate }: ScanComparisonProps) {
  const comparison = useMemo(() => {
    if (!previousScan) return null;

    // ── Risk Score Delta ──
    const currentScore = currentScan.riskScore?.score || 0;
    const previousScore = previousScan.riskScore?.score || 0;
    const scoreDelta = currentScore - previousScore;

    // ── Social Profile Diff ──
    const currentProfiles = new Map(
      (currentScan.socialResults || []).filter(s => s.found).map(s => [getProfileKey(s), s])
    );
    const previousProfiles = new Map(
      (previousScan.socialResults || []).filter(s => s.found).map(s => [getProfileKey(s), s])
    );

    const newProfiles: DiffItem[] = [];
    const removedProfiles: DiffItem[] = [];

    for (const [key, s] of currentProfiles) {
      if (!previousProfiles.has(key)) {
        newProfiles.push({ platform: s.platform, url: s.url, type: "added" });
      }
    }
    for (const [key, s] of previousProfiles) {
      if (!currentProfiles.has(key)) {
        removedProfiles.push({ platform: s.platform, url: s.url, type: "removed" });
      }
    }

    // ── Breach Diff ──
    const currentBreaches = new Map(
      (currentScan.breachResults || []).map(b => [getBreachKey(b), b])
    );
    const previousBreaches = new Map(
      (previousScan.breachResults || []).map(b => [getBreachKey(b), b])
    );

    const newBreaches: BreachDiff[] = [];
    const resolvedBreaches: BreachDiff[] = [];

    for (const [key, b] of currentBreaches) {
      if (!previousBreaches.has(key)) {
        newBreaches.push({
          name: b.platform || b.name || b.domain || "Unknown",
          date: b.date || b.breachDate,
          severity: b.severity,
          type: "new",
        });
      }
    }
    for (const [key, b] of previousBreaches) {
      if (!currentBreaches.has(key)) {
        resolvedBreaches.push({
          name: b.platform || b.name || b.domain || "Unknown",
          date: b.date || b.breachDate,
          severity: b.severity,
          type: "resolved",
        });
      }
    }

    // ── Search Visibility ──
    const currentGoogle = currentScan.googleResults?.length || 0;
    const previousGoogle = previousScan.googleResults?.length || 0;
    const googleDelta = currentGoogle - previousGoogle;

    // ── Mention Diff ──
    const currentMentions = currentScan.mentionResults?.length || 0;
    const previousMentions = previousScan.mentionResults?.length || 0;
    const mentionDelta = currentMentions - previousMentions;

    // ── Overall Status ──
    let overallStatus: "improved" | "degraded" | "unchanged" = "unchanged";
    if (scoreDelta < -5 || resolvedBreaches.length > newBreaches.length) overallStatus = "improved";
    if (scoreDelta > 5 || newBreaches.length > resolvedBreaches.length) overallStatus = "degraded";

    return {
      currentScore,
      previousScore,
      scoreDelta,
      newProfiles,
      removedProfiles,
      newBreaches,
      resolvedBreaches,
      currentGoogle,
      previousGoogle,
      googleDelta,
      currentMentions,
      previousMentions,
      mentionDelta,
      overallStatus,
    };
  }, [currentScan, previousScan]);

  if (!comparison || !previousScan) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 p-10 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
          <Clock className="h-7 w-7 text-indigo-400" />
        </div>
        <h4 className="text-lg font-bold text-slate-900 dark:text-white">First Scan Complete</h4>
        <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
          This is the first time you've scanned this identity. Future scans will be compared against this baseline to track changes in your digital footprint over time.
        </p>
      </motion.div>
    );
  }

  const {
    currentScore, previousScore, scoreDelta,
    newProfiles, removedProfiles,
    newBreaches, resolvedBreaches,
    currentGoogle, previousGoogle, googleDelta,
    currentMentions, previousMentions, mentionDelta,
    overallStatus,
  } = comparison;

  const hasChanges = scoreDelta !== 0 || newProfiles.length > 0 || removedProfiles.length > 0 ||
    newBreaches.length > 0 || resolvedBreaches.length > 0 || googleDelta !== 0;

  return (
    <div className="space-y-6">
      {/* Overall Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border p-5 ${
          overallStatus === "improved"
            ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20"
            : overallStatus === "degraded"
            ? "border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20"
            : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2.5 ${
              overallStatus === "improved"
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600"
                : overallStatus === "degraded"
                ? "bg-rose-100 dark:bg-rose-900/40 text-rose-600"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
            }`}>
              {overallStatus === "improved" ? <TrendingDown className="h-5 w-5" /> :
               overallStatus === "degraded" ? <TrendingUp className="h-5 w-5" /> :
               <Equal className="h-5 w-5" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {overallStatus === "improved" ? "Security Posture Improved 🟢" :
                 overallStatus === "degraded" ? "Exposure Increased 🔴" :
                 "No Significant Changes ⚪"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Compared to your {previousDate ? `scan on ${new Date(previousDate).toLocaleDateString()}` : "last scan"}
              </p>
            </div>
          </div>
          {previousDate && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              {new Date(previousDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          )}
        </div>
      </motion.div>

      {/* Risk Score Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl p-5"
      >
        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Risk Score Change</h4>
        <div className="flex items-center justify-center gap-6">
          {/* Previous */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Previous</p>
            <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl text-xl font-black ${
              previousScore >= 70 ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600" :
              previousScore >= 40 ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600" :
              "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
            }`}>
              {previousScore}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1">
            <div className={`rounded-full p-2 ${
              scoreDelta > 0 ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600" :
              scoreDelta < 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" :
              "bg-slate-100 dark:bg-slate-800 text-slate-400"
            }`}>
              {scoreDelta > 0 ? <ArrowUpRight className="h-5 w-5" /> :
               scoreDelta < 0 ? <ArrowDownRight className="h-5 w-5" /> :
               <Minus className="h-5 w-5" />}
            </div>
            <span className={`text-xs font-bold ${
              scoreDelta > 0 ? "text-rose-600" :
              scoreDelta < 0 ? "text-emerald-600" :
              "text-slate-400"
            }`}>
              {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta < 0 ? String(scoreDelta) : "0"}
            </span>
          </div>

          {/* Current */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Current</p>
            <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl text-xl font-black ${
              currentScore >= 70 ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600" :
              currentScore >= 40 ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600" :
              "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
            }`}>
              {currentScore}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "Profiles", prev: (previousScan.socialResults || []).filter(s => s.found).length, curr: (currentScan.socialResults || []).filter(s => s.found).length, icon: Globe },
          { label: "Breaches", prev: previousScan.breachResults?.length || 0, curr: currentScan.breachResults?.length || 0, icon: ShieldAlert },
          { label: "Search Hits", prev: previousGoogle, curr: currentGoogle, icon: Globe },
          { label: "Mentions", prev: previousMentions, curr: currentMentions, icon: Globe },
        ].map((m, i) => {
          const delta = m.curr - m.prev;
          return (
            <div key={m.label} className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{m.label}</p>
              <p className="text-lg font-black text-slate-900 dark:text-white">{m.prev} → {m.curr}</p>
              <p className={`text-xs font-bold mt-1 ${
                delta > 0 && m.label === "Breaches" ? "text-rose-600" :
                delta < 0 && m.label === "Breaches" ? "text-emerald-600" :
                delta > 0 ? "text-blue-600" :
                delta < 0 ? "text-amber-600" :
                "text-slate-400"
              }`}>
                {delta > 0 ? `▲ +${delta}` : delta < 0 ? `▼ ${delta}` : "— No change"}
              </p>
            </div>
          );
        })}
      </motion.div>

      {/* New Profiles */}
      {newProfiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30 bg-white/40 dark:bg-slate-950/40 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">New Profiles Detected</h4>
            <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
              +{newProfiles.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {newProfiles.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {p.platform}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Removed Profiles */}
      {removedProfiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-amber-200/50 dark:border-amber-900/30 bg-white/40 dark:bg-slate-950/40 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <UserMinus className="h-4 w-4 text-amber-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Profiles No Longer Detected</h4>
            <span className="ml-auto text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
              −{removedProfiles.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {removedProfiles.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/30 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <XCircle className="h-3 w-3" />
                {p.platform}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* New Breaches */}
      {newBreaches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl border border-rose-200/50 dark:border-rose-900/30 bg-white/40 dark:bg-slate-950/40 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">New Breaches Since Last Scan</h4>
            <span className="ml-auto text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
              ⚠ {newBreaches.length}
            </span>
          </div>
          <div className="space-y-2">
            {newBreaches.map((b, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-rose-100 dark:border-rose-800/30 bg-rose-50/30 dark:bg-rose-950/20 px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{b.name}</p>
                  {b.date && <p className="text-xs text-slate-500 mt-0.5">{b.date}</p>}
                </div>
                {b.severity && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    b.severity === "high" ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600" :
                    b.severity === "medium" ? "bg-amber-100 dark:bg-amber-900/50 text-amber-600" :
                    "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  }`}>
                    {b.severity}
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Resolved Breaches */}
      {resolvedBreaches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30 bg-white/40 dark:bg-slate-950/40 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Resolved Breaches</h4>
            <span className="ml-auto text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
              ✓ {resolvedBreaches.length}
            </span>
          </div>
          <div className="space-y-2">
            {resolvedBreaches.map((b, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-emerald-100 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20 px-4 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-through opacity-60">{b.name}</p>
                  {b.date && <p className="text-xs text-slate-500 mt-0.5">{b.date}</p>}
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* No Changes */}
      {!hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 p-10 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
            <Equal className="h-7 w-7 text-slate-300" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Identical Results</h4>
          <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
            No differences were found between the current scan and your previous scan. Your digital footprint is stable.
          </p>
        </motion.div>
      )}
    </div>
  );
}
