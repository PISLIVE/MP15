import * as React from "react";
import { useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "./ui/card";
import { motion, useMotionValue, useTransform, animate } from "motion/react";

interface PrivacyScoreProps {
  score: number;
  level?: string;
}

export const PrivacyScore = React.forwardRef<HTMLDivElement, PrivacyScoreProps>(
  ({ score, level }, ref) => {
    const normalizedScore = Math.max(0, Math.min(100, score));

    // Animate the numeric score
    const count = useMotionValue(0);
    const roundedScore = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
      animate(count, normalizedScore, { duration: 1.5, ease: "easeOut", delay: 0.1 });
    }, [normalizedScore, count]);

    const getRiskColor = (value: number) => {
      if (value >= 70) return "text-rose-600";
      if (value >= 40) return "text-amber-500";
      return "text-emerald-600 dark:text-emerald-400";
    };

    const getRiskGradient = (value: number) => {
      if (value >= 70) return "from-rose-500 to-red-600";
      if (value >= 40) return "from-amber-400 to-orange-500";
      return "from-emerald-500 to-teal-500";
    };

    const getRiskLabel = (value: number) => {
      if (level) return level;
      if (value >= 70) return "High Risk";
      if (value >= 40) return "Medium Risk";
      return "Low Risk";
    };

    const getRiskIcon = (value: number) => {
      if (value >= 70) return <AlertTriangle className="h-6 w-6" />;
      if (value >= 40) return <Shield className="h-6 w-6" />;
      return <CheckCircle2 className="h-6 w-6" />;
    };

    const radius = 42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (normalizedScore / 100) * circumference;

    return (
      <Card
        ref={ref}
        className="relative overflow-hidden rounded-3xl border border-white/40 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl p-5 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-900 via-blue-600 to-indigo-600 opacity-90" />

        <div className="mb-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Privacy Score
          </p>
          <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Exposure Overview
          </h3>
        </div>

        <div className="flex items-center justify-center">
          <motion.div
            className="relative h-36 w-36"
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, type: "spring", stiffness: 220 }}
          >
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
              <defs>
                <linearGradient
                  id={`score-gradient-${normalizedScore}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    className={
                      normalizedScore >= 70
                        ? "text-rose-500"
                        : normalizedScore >= 40
                        ? "text-amber-400"
                        : "text-emerald-500"
                    }
                    stopColor="currentColor"
                  />
                  <stop
                    offset="100%"
                    className={
                      normalizedScore >= 70
                        ? "text-red-600"
                        : normalizedScore >= 40
                        ? "text-orange-500"
                        : "text-teal-500"
                    }
                    stopColor="currentColor"
                  />
                </linearGradient>
              </defs>

              <circle
                cx="60"
                cy="60"
                r={radius}
                stroke="currentColor"
                strokeWidth="9"
                fill="none"
                className="text-slate-200"
              />

              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                stroke={`url(#score-gradient-${normalizedScore})`}
                strokeWidth="9"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1.2, ease: "easeOut", delay: 0.15 }}
              />
            </svg>

            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <div className={getRiskColor(normalizedScore)}>
                {getRiskIcon(normalizedScore)}
              </div>

              <motion.div
                className={`mt-2 text-3xl font-bold tracking-tight bg-gradient-to-r ${getRiskGradient(
                  normalizedScore
                )} bg-clip-text text-transparent`}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.55, type: "spring", stiffness: 220 }}
              >
                <motion.span>{roundedScore}</motion.span>
              </motion.div>

              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {getRiskLabel(normalizedScore)}
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md px-4 py-3 text-center border border-white/20 dark:border-slate-800/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
            Higher score indicates higher public exposure risk
          </p>
        </div>
      </Card>
    );
  }
);

PrivacyScore.displayName = "PrivacyScore";