import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from "lucide-react";

// ─── SHA-1 hash in browser (Web Crypto API) ──────────────────────────────────
async function sha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

// ─── Password Strength Calculator ────────────────────────────────────────────
function calculateStrength(password: string) {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    longLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^A-Za-z0-9]/.test(password),
    noCommon: !/^(password|123456|qwerty|admin|letmein|welcome|monkey|dragon)/i.test(password),
  };

  if (checks.length) score += 1;
  if (checks.longLength) score += 1;
  if (checks.uppercase) score += 1;
  if (checks.lowercase) score += 1;
  if (checks.numbers) score += 1;
  if (checks.symbols) score += 1;
  if (checks.noCommon) score += 1;

  let level: "weak" | "fair" | "good" | "strong" = "weak";
  if (score >= 6) level = "strong";
  else if (score >= 4) level = "good";
  else if (score >= 3) level = "fair";

  return { score, level, checks, maxScore: 7 };
}

interface BreachResult {
  checked: boolean;
  breachCount: number;
  loading: boolean;
  error: string | null;
}

export function PasswordBreachChecker() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [breach, setBreach] = useState<BreachResult>({
    checked: false,
    breachCount: 0,
    loading: false,
    error: null,
  });

  const strength = password ? calculateStrength(password) : null;

  const checkBreach = async () => {
    if (!password) return;
    setBreach({ checked: false, breachCount: 0, loading: true, error: null });

    try {
      const hash = await sha1(password);
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // k-Anonymity: only first 5 chars of hash are sent. Password never leaves browser.
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: { "Add-Padding": "true" },
      });

      if (!response.ok) throw new Error("HIBP API unavailable");

      const text = await response.text();
      const lines = text.split("\n");
      let count = 0;

      for (const line of lines) {
        const [hashSuffix, freq] = line.split(":");
        if (hashSuffix.trim() === suffix) {
          count = parseInt(freq.trim(), 10);
          break;
        }
      }

      setBreach({ checked: true, breachCount: count, loading: false, error: null });
    } catch (err: any) {
      setBreach({ checked: false, breachCount: 0, loading: false, error: err.message });
    }
  };

  const getStrengthColor = (level: string) => {
    switch (level) {
      case "strong": return "bg-emerald-500";
      case "good": return "bg-blue-500";
      case "fair": return "bg-amber-500";
      default: return "bg-rose-500";
    }
  };

  const getStrengthLabel = (level: string) => {
    switch (level) {
      case "strong": return "Strong";
      case "good": return "Good";
      case "fair": return "Fair";
      default: return "Weak";
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200/50 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 px-4 py-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">Your password never leaves your browser</p>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            We use the <span className="font-semibold">Have I Been Pwned</span> k-Anonymity API — only the first 5 characters of the SHA-1 hash are sent. Your actual password is never transmitted or stored.
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Enter a password to check</label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setBreach({ checked: false, breachCount: 0, loading: false, error: null });
            }}
            placeholder="Type a password to analyze..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-12 pr-24 py-3.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
            onKeyDown={(e) => e.key === "Enter" && checkBreach()}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          onClick={checkBreach}
          disabled={!password || breach.loading}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 text-white font-semibold py-3 text-sm transition-all shadow-lg shadow-blue-200/50 dark:shadow-none disabled:shadow-none flex items-center justify-center gap-2"
        >
          {breach.loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking breach databases...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Check Password Security
            </>
          )}
        </button>
      </div>

      {/* Strength Meter */}
      <AnimatePresence>
        {strength && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password Strength</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                  strength.level === "strong" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  strength.level === "good" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                  strength.level === "fair" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                }`}>
                  {getStrengthLabel(strength.level)}
                </span>
              </div>

              {/* Strength Bar */}
              <div className="flex gap-1.5 mb-4">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <motion.div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      i <= strength.score ? getStrengthColor(strength.level) : "bg-slate-200 dark:bg-slate-700"
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.05 }}
                  />
                ))}
              </div>

              {/* Criteria Checklist */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "length", label: "8+ characters" },
                  { key: "longLength", label: "12+ characters" },
                  { key: "uppercase", label: "Uppercase letter" },
                  { key: "lowercase", label: "Lowercase letter" },
                  { key: "numbers", label: "Number" },
                  { key: "symbols", label: "Special character" },
                  { key: "noCommon", label: "Not common" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    {(strength.checks as any)[key] ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                    )}
                    <span className={`text-xs ${
                      (strength.checks as any)[key]
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-500"
                    }`}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Breach Result */}
      <AnimatePresence>
        {breach.checked && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {breach.breachCount > 0 ? (
              <div className="rounded-2xl border-2 border-rose-200 dark:border-rose-900/50 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/20 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-rose-500 p-3 shadow-lg shadow-rose-200 dark:shadow-none">
                    <ShieldAlert className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-rose-900 dark:text-rose-200">Password Compromised!</h4>
                    <p className="mt-1 text-sm text-rose-700 dark:text-rose-400">
                      This password has appeared in <span className="font-black text-rose-900 dark:text-rose-200">{breach.breachCount.toLocaleString()}</span> known data breaches.
                    </p>
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Immediate Actions Required:</p>
                      <ul className="space-y-1.5">
                        {[
                          "Change this password immediately on all accounts",
                          "Use a unique password for every service",
                          "Enable two-factor authentication (2FA)",
                          "Consider using a password manager",
                        ].map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-rose-800 dark:text-rose-300">
                            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-rose-500" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-emerald-500 p-3 shadow-lg shadow-emerald-200 dark:shadow-none">
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">Password Not Found in Breaches</h4>
                    <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-400">
                      This password hasn't appeared in any known data breaches. Keep it strong and unique.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {breach.error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Unable to check: {breach.error}
        </div>
      )}
    </div>
  );
}
