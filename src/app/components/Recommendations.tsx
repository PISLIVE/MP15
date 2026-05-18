import * as React from "react";
import {
  Shield,
  Lock,
  Eye,
  UserX,
  Settings,
  AlertTriangle,
  CheckCircle2,
  Search,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion } from "motion/react";

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  icon: "shield" | "lock" | "eye" | "userx" | "settings" | "alert" | "search";
}

interface RecommendationsProps {
  recommendations: Recommendation[];
}

const iconMap = {
  shield: Shield,
  lock: Lock,
  eye: Eye,
  userx: UserX,
  settings: Settings,
  alert: AlertTriangle,
  search: Search,
};

function getPriorityStyles(priority: string) {
  switch (priority) {
    case "high":
      return {
        badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50",
        iconWrap: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-200/50 dark:shadow-rose-900/20",
        panel: "border-rose-200/70 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-950/10",
      };
    case "medium":
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50",
        iconWrap: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-200/50 dark:shadow-amber-900/20",
        panel: "border-amber-200/70 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10",
      };
    default:
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50",
        iconWrap: "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-emerald-200/50 dark:shadow-emerald-900/20",
        panel: "border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10",
      };
  }
}

export const Recommendations = React.forwardRef<HTMLDivElement, RecommendationsProps>(
  ({ recommendations }, ref) => {
    const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Card className="rounded-[28px] border border-slate-200/70 bg-white/95 dark:bg-slate-900/80 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:shadow-none sm:p-6 dark:border-slate-800 backdrop-blur-xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Recommended Actions
              </p>
              <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Security Recommendations
              </h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Suggested next steps based on the current scan findings
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {safeRecommendations.length} actions
            </div>
          </div>

          {safeRecommendations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shadow-sm">
                <Shield className="h-6 w-6 text-slate-400 dark:text-slate-500" />
              </div>
              <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                No recommendations available
              </h4>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                The system did not generate any follow-up actions for this scan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeRecommendations.map((rec, index) => {
                const Icon = iconMap[rec.icon as keyof typeof iconMap] || Shield;
                const styles = getPriorityStyles(rec.priority);

                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.05 }}
                    whileHover={{ y: -2 }}
                    className={`rounded-3xl border p-5 shadow-sm transition-all duration-300 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_14px_30px_rgba(0,0,0,0.2)] ${styles.panel}`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg ${styles.iconWrap}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {rec.title}
                          </h4>

                          <Badge
                            className={`w-fit border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles.badge}`}
                          >
                            {rec.priority}
                          </Badge>
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {rec.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>
    );
  }
);

Recommendations.displayName = "Recommendations";