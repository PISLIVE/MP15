import { useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Circle,
  Shield,
  Key,
  Eye,
  Lock,
  AlertTriangle,
  Globe,
  Mail,
  Smartphone,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  icon: typeof Shield;
  category: string;
}

interface SecurityChecklistProps {
  scanData: any;
}

function generateChecklist(scanData: any): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const breaches = scanData?.breachResults || [];
  const socials = scanData?.socialResults || [];
  const googleResults = scanData?.googleResults || [];
  const emailResults = scanData?.emailResults;
  const riskScore = scanData?.riskScore?.score || 0;

  // ─── Breach-based actions ──────────────────────────────────────────────────
  if (breaches.length > 0) {
    const breachPlatforms = breaches.map((b: any) => b.platform).filter(Boolean);
    const hasPasswordLeak = breaches.some((b: any) =>
      b.dataExposed?.some((d: string) => d.toLowerCase().includes("password"))
    );

    if (hasPasswordLeak) {
      items.push({
        id: "breach-password",
        title: "Change leaked passwords immediately",
        description: `Passwords were exposed in breaches on: ${breachPlatforms.slice(0, 3).join(", ")}${breachPlatforms.length > 3 ? ` and ${breachPlatforms.length - 3} more` : ""}. Use unique passwords for each service.`,
        priority: "critical",
        icon: Key,
        category: "Breach Response",
      });
    }

    items.push({
      id: "breach-2fa",
      title: "Enable 2FA on breached platforms",
      description: `Your data was found in ${breaches.length} breach${breaches.length > 1 ? "es" : ""}. Enable two-factor authentication to prevent unauthorized access.`,
      priority: "critical",
      icon: Smartphone,
      category: "Breach Response",
    });

    if (breaches.some((b: any) => b.dataExposed?.some((d: string) => d.toLowerCase().includes("email")))) {
      items.push({
        id: "breach-phishing",
        title: "Watch for phishing emails",
        description: "Your email was exposed in breaches. Be extra cautious of suspicious emails requesting personal information or login credentials.",
        priority: "high",
        icon: Mail,
        category: "Breach Response",
      });
    }
  }

  // ─── Social profile actions ────────────────────────────────────────────────
  if (socials.length > 0) {
    const highExposure = socials.filter((s: any) =>
      ["Instagram", "Facebook", "LinkedIn", "Twitter", "X", "TikTok"].includes(s.platform)
    );

    if (highExposure.length > 0) {
      items.push({
        id: "social-privacy",
        title: "Review privacy settings on social accounts",
        description: `${highExposure.length} high-exposure profile${highExposure.length > 1 ? "s" : ""} detected (${highExposure.map((s: any) => s.platform).join(", ")}). Review who can see your posts, photos, and personal details.`,
        priority: "high",
        icon: Eye,
        category: "Privacy Settings",
      });
    }

    if (socials.length >= 5) {
      items.push({
        id: "social-audit",
        title: "Audit and remove unused accounts",
        description: `You have ${socials.length} online profiles. Inactive accounts can be hijacked. Delete accounts you no longer use.`,
        priority: "medium",
        icon: Globe,
        category: "Account Management",
      });
    }
  }

  // ─── Search visibility actions ─────────────────────────────────────────────
  if (googleResults.length > 0) {
    items.push({
      id: "google-review",
      title: "Review your public search footprint",
      description: `${googleResults.length} result${googleResults.length > 1 ? "s" : ""} found about you in search engines. Check if any expose sensitive personal information.`,
      priority: "medium",
      icon: Globe,
      category: "Search Visibility",
    });

    if (googleResults.length >= 5) {
      items.push({
        id: "google-removal",
        title: "Request removal of unwanted results",
        description: "Use Google's result removal tool to request deletion of pages that expose personal data like phone numbers or addresses.",
        priority: "medium",
        icon: Shield,
        category: "Search Visibility",
      });
    }
  }

  // ─── Email actions ─────────────────────────────────────────────────────────
  if (emailResults) {
    const holeheCount = emailResults.holehe
      ? Object.values(emailResults.holehe).filter((v: any) => v?.exists).length
      : 0;

    if (holeheCount > 5) {
      items.push({
        id: "email-registrations",
        title: "Use email aliases for new signups",
        description: `Your email is registered on ${holeheCount}+ platforms. Use email aliases (e.g., Gmail's +tag feature) to limit exposure.`,
        priority: "medium",
        icon: Mail,
        category: "Email Security",
      });
    }

    if (emailResults.gravatar?.hasProfile) {
      items.push({
        id: "gravatar-review",
        title: "Review your Gravatar profile data",
        description: "Your Gravatar profile is publicly accessible and may contain your real name, location, and linked accounts.",
        priority: "low",
        icon: Eye,
        category: "Email Security",
      });
    }
  }

  // ─── General security actions ──────────────────────────────────────────────
  items.push({
    id: "password-manager",
    title: "Use a password manager",
    description: "Tools like Bitwarden (free) or 1Password generate and store unique passwords for every account, preventing credential reuse.",
    priority: riskScore >= 40 ? "high" : "low",
    icon: Lock,
    category: "General Security",
  });

  if (riskScore >= 50) {
    items.push({
      id: "identity-monitoring",
      title: "Set up identity monitoring",
      description: "Your exposure is significant. Consider setting up alerts for new breaches involving your email or personal data.",
      priority: "high",
      icon: Shield,
      category: "General Security",
    });
  }

  // Sort: critical first, then high, medium, low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return items;
}

const priorityColors = {
  critical: {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-900/40",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
    icon: "bg-rose-500",
  },
  high: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-900/40",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
    icon: "bg-amber-500",
  },
  medium: {
    bg: "bg-blue-50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-900/40",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    icon: "bg-blue-500",
  },
  low: {
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-200 dark:border-slate-800/50",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
    icon: "bg-slate-400",
  },
};

export function SecurityChecklist({ scanData }: SecurityChecklistProps) {
  const items = generateChecklist(scanData);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedCount = completed.size;
  const totalCount = items.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <Shield className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">No action items generated. Your exposure is minimal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/60 dark:bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Security Progress</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {completedCount} of {totalCount} actions completed
            </p>
          </div>
          <span className={`text-2xl font-black ${
            progress === 100 ? "text-emerald-600" : progress >= 50 ? "text-blue-600" : "text-slate-400"
          }`}>
            {progress}%
          </span>
        </div>
        <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              progress === 100
                ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                : "bg-gradient-to-r from-blue-600 to-indigo-600"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const isDone = completed.has(item.id);
          const colors = priorityColors[item.priority];
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleItem(item.id)}
              className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                isDone
                  ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200/50 dark:border-emerald-900/30 opacity-60"
                  : `${colors.bg} ${colors.border}`
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-semibold ${isDone ? "line-through text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
                    {item.title}
                  </p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${colors.badge}`}>
                    {item.priority}
                  </span>
                </div>
                <p className={`text-xs mt-1 ${isDone ? "text-slate-400" : "text-slate-600 dark:text-slate-400"}`}>
                  {item.description}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-2">
                  {item.category}
                </p>
              </div>
              <div className={`p-2 rounded-xl ${isDone ? "bg-emerald-500" : colors.icon} shrink-0`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
