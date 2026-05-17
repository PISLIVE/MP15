import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Globe, Database, Eye, Lock, CheckCircle2, AlertTriangle, Search, Zap } from "lucide-react";

// ─── Simulated scan stages ───────────────────────────────────────────────────
const SCAN_STAGES = [
  {
    phase: "input",
    title: "Initializing Scan...",
    detail: "Target: john.doe@example.com",
    duration: 2000,
  },
  {
    phase: "social",
    title: "Scanning Social Platforms",
    detail: "Checking 25+ platforms...",
    duration: 3000,
    results: [
      { icon: "📸", platform: "Instagram", status: "found", color: "text-emerald-400" },
      { icon: "💼", platform: "LinkedIn", status: "found", color: "text-emerald-400" },
      { icon: "🐙", platform: "GitHub", status: "found", color: "text-emerald-400" },
      { icon: "🤖", platform: "Reddit", status: "not found", color: "text-slate-500" },
      { icon: "𝕏", platform: "X / Twitter", status: "found", color: "text-emerald-400" },
    ],
  },
  {
    phase: "breach",
    title: "Checking Breach Databases",
    detail: "Querying known data breaches...",
    duration: 2500,
    results: [
      { icon: "⚠️", platform: "Adobe (2013)", status: "152M records", color: "text-rose-400" },
      { icon: "⚠️", platform: "LinkedIn (2021)", status: "700M records", color: "text-rose-400" },
      { icon: "⚠️", platform: "Canva (2019)", status: "137M records", color: "text-amber-400" },
    ],
  },
  {
    phase: "email",
    title: "Email Intelligence",
    detail: "Verifying deliverability & registrations...",
    duration: 2000,
    results: [
      { icon: "✅", platform: "Deliverable", status: "Yes — Google", color: "text-emerald-400" },
      { icon: "👤", platform: "Gravatar", status: "Profile found", color: "text-blue-400" },
      { icon: "🔑", platform: "Registered on", status: "8 platforms", color: "text-amber-400" },
    ],
  },
  {
    phase: "ai",
    title: "AI Threat Analysis",
    detail: "Generating security insights...",
    duration: 3000,
    aiText: "⚠️ **Critical:** Your email appeared in 3 known breaches exposing passwords. Immediate action: change passwords on Adobe, LinkedIn, and Canva. Enable **2FA** on all accounts. Risk Score: **72/100 (High)**",
  },
  {
    phase: "complete",
    title: "Scan Complete",
    detail: "Full report generated",
    duration: 4000,
    summary: {
      profiles: 4,
      breaches: 3,
      riskScore: 72,
      riskLevel: "High",
    },
  },
];

function TypingText({ text, speed = 25 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      <span className="animate-pulse text-blue-400">▎</span>
    </span>
  );
}

export function DemoPreview() {
  const [stageIndex, setStageIndex] = useState(0);
  const [resultIndex, setResultIndex] = useState(0);

  const stage = SCAN_STAGES[stageIndex];

  // Auto-advance stages
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stageIndex < SCAN_STAGES.length - 1) {
        setStageIndex((i) => i + 1);
        setResultIndex(0);
      } else {
        // Loop back
        setStageIndex(0);
        setResultIndex(0);
      }
    }, stage.duration);
    return () => clearTimeout(timer);
  }, [stageIndex, stage.duration]);

  // Auto-reveal results one by one
  useEffect(() => {
    if (!("results" in stage) || !stage.results) return;
    if (resultIndex >= stage.results.length) return;

    const timer = setTimeout(() => {
      setResultIndex((i) => i + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [resultIndex, stage]);

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case "input": return Search;
      case "social": return Globe;
      case "breach": return Database;
      case "email": return Eye;
      case "ai": return Zap;
      case "complete": return Shield;
      default: return Search;
    }
  };

  const PhaseIcon = getPhaseIcon(stage.phase);

  return (
    <div className="rounded-[22px] border border-slate-700/60 bg-slate-900/95 overflow-hidden shadow-2xl shadow-black/30">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border-b border-slate-700/50">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-[11px] font-medium text-slate-400">Digital Footprint Analyzer — Live Demo</span>
        </div>
        <div className="w-12" />
      </div>

      {/* Content */}
      <div className="p-5 min-h-[320px] font-mono text-sm">
        {/* Progress bar */}
        <div className="mb-4 flex items-center gap-3">
          {SCAN_STAGES.map((s, i) => (
            <div
              key={s.phase}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                i < stageIndex
                  ? "bg-emerald-500"
                  : i === stageIndex
                  ? "bg-blue-500 animate-pulse"
                  : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Stage header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={stage.phase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${
                stage.phase === "complete" ? "bg-emerald-500/20" : "bg-blue-500/20"
              }`}>
                <PhaseIcon className={`h-5 w-5 ${
                  stage.phase === "complete" ? "text-emerald-400" : "text-blue-400"
                }`} />
              </div>
              <div>
                <p className={`font-bold ${
                  stage.phase === "complete" ? "text-emerald-400" : "text-white"
                }`}>
                  {stage.title}
                </p>
                <p className="text-xs text-slate-400">{stage.detail}</p>
              </div>
              {stage.phase !== "complete" && (
                <div className="ml-auto">
                  <div className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Results list */}
            {"results" in stage && stage.results && (
              <div className="space-y-2 ml-2">
                {stage.results.slice(0, resultIndex).map((result, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 text-xs"
                  >
                    <span>{result.icon}</span>
                    <span className="text-slate-300 w-28">{result.platform}</span>
                    <span className={`font-semibold ${result.color}`}>{result.status}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* AI text */}
            {stage.phase === "ai" && stage.aiText && (
              <div className="mt-2 ml-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 leading-relaxed">
                <TypingText text={stage.aiText} speed={18} />
              </div>
            )}

            {/* Summary */}
            {stage.phase === "complete" && stage.summary && (
              <div className="grid grid-cols-4 gap-3 mt-2">
                {[
                  { label: "Profiles", value: stage.summary.profiles, color: "text-blue-400" },
                  { label: "Breaches", value: stage.summary.breaches, color: "text-rose-400" },
                  { label: "Risk Score", value: `${stage.summary.riskScore}/100`, color: "text-amber-400" },
                  { label: "Risk Level", value: stage.summary.riskLevel, color: "text-rose-400" },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl bg-slate-800/60 border border-slate-700/40 p-3 text-center"
                  >
                    <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Terminal-style log lines */}
            <div className="mt-4 space-y-1 text-[11px] text-slate-500">
              {stage.phase === "input" && (
                <>
                  <p><span className="text-blue-400">$</span> Initializing scan engine...</p>
                  <p><span className="text-blue-400">$</span> Validating target: john.doe@example.com</p>
                  <p><span className="text-emerald-400">✓</span> Email format valid — starting parallel scan</p>
                </>
              )}
              {stage.phase === "social" && (
                <>
                  <p><span className="text-blue-400">$</span> HTTP HEAD → instagram.com/john.doe <span className="text-emerald-400">[200 OK]</span></p>
                  <p><span className="text-blue-400">$</span> HTTP HEAD → linkedin.com/in/john-doe <span className="text-emerald-400">[200 OK]</span></p>
                  <p><span className="text-blue-400">$</span> HTTP HEAD → github.com/johndoe <span className="text-emerald-400">[200 OK]</span></p>
                </>
              )}
              {stage.phase === "breach" && (
                <>
                  <p><span className="text-blue-400">$</span> Querying XposedOrNot breach DB...</p>
                  <p><span className="text-rose-400">!</span> 3 breaches found — severity analysis in progress</p>
                </>
              )}
              {stage.phase === "email" && (
                <>
                  <p><span className="text-blue-400">$</span> DNS MX lookup → gmail-smtp-in.l.google.com</p>
                  <p><span className="text-blue-400">$</span> Gravatar API → profile found (MD5 hash match)</p>
                </>
              )}
              {stage.phase === "ai" && (
                <p><span className="text-blue-400">$</span> Gemini AI model: gemini-2.0-flash — generating insights...</p>
              )}
              {stage.phase === "complete" && (
                <>
                  <p><span className="text-emerald-400">✓</span> All scanners completed successfully</p>
                  <p><span className="text-emerald-400">✓</span> Report ready — 4 profiles, 3 breaches, risk score 72/100</p>
                  <p className="text-slate-600">Restarting demo in 4s...</p>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
