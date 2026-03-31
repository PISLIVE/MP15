import * as React from "react";
import { useEffect } from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { motion, useMotionValue, useTransform, animate } from "motion/react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  gradient?: string;
  delay?: number;
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {
      title,
      value,
      icon: Icon,
      trend,
      description,
      gradient = "from-blue-600 to-indigo-600",
      delay = 0,
    },
    ref
  ) => {
    
    // Animate numbers
    const isNumber = typeof value === "number";
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
      if (isNumber) {
        animate(count, value, { duration: 1.5, delay: delay + 0.2, ease: "easeOut" });
      }
    }, [isNumber, value, count, delay]);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay }}
        whileHover={{ y: -2 }}
        className="h-full"
      >
        <Card className="group relative h-full overflow-hidden rounded-3xl border border-white/40 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl p-5 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-300 hover:shadow-[0_18px_42px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_18px_42px_rgba(99,102,241,0.2)]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-slate-50/10 dark:from-white/5 dark:to-transparent opacity-100" />
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient} opacity-90`}
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                {title}
              </p>

              <motion.p
                className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-[2rem]"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay + 0.15, type: "spring", stiffness: 220 }}
              >
                {isNumber ? <motion.span>{rounded}</motion.span> : value}
              </motion.p>

              {description && (
                <p className="mt-2 text-sm leading-5 text-slate-600 dark:text-slate-400">
                  {description}
                </p>
              )}

              {trend && (
                <motion.div
                  className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    trend.isPositive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.28 }}
                >
                  <span>{trend.isPositive ? "↗" : "↘"}</span>
                  <span>{Math.abs(trend.value)}%</span>
                </motion.div>
              )}
            </div>

            <motion.div
              className={`relative shrink-0 rounded-2xl bg-gradient-to-br ${gradient} p-3.5 shadow-[0_10px_24px_rgba(37,99,235,0.22)]`}
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
            >
              <div className="absolute inset-0 rounded-2xl bg-white/10" />
              <Icon className="relative z-10 h-5 w-5 text-white sm:h-6 sm:w-6" />
            </motion.div>
          </div>
        </Card>
      </motion.div>
    );
  }
);

MetricCard.displayName = "MetricCard";