import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Database,
  ShieldAlert,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Key,
  Mail,
  Smartphone,
  MapPin,
  User,
  Globe,
  CreditCard,
  Fingerprint,
  Users,
  BadgeCheck,
  Link,
} from "lucide-react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "motion/react";
import type { BreachResult } from "../types/scan";

interface DataBreachesProps {
  breaches: BreachResult[];
}

// Map friendly field names back to icons
function getFieldIcon(field: string) {
  const f = field.toLowerCase();
  if (f.includes("password") || f.includes("hash")) return <Key className="h-3 w-3" />;
  if (f.includes("email")) return <Mail className="h-3 w-3" />;
  if (f.includes("phone")) return <Smartphone className="h-3 w-3" />;
  if (f.includes("address") || f.includes("location") || f.includes("country")) return <MapPin className="h-3 w-3" />;
  if (f.includes("name") || f.includes("username") || f.includes("gender")) return <User className="h-3 w-3" />;
  if (f.includes("ip")) return <Globe className="h-3 w-3" />;
  if (f.includes("card") || f.includes("cvv") || f.includes("cc")) return <CreditCard className="h-3 w-3" />;
  if (f.includes("ssn") || f.includes("national") || f.includes("passport") || f.includes("id")) return <Fingerprint className="h-3 w-3" />;
  return <Database className="h-3 w-3" />;
}

function getRemediationSteps(breach: BreachResult) {
  const steps = [];
  const fields = (breach.dataExposed || []).map(f => f.toLowerCase());
  
  if (fields.some(f => f.includes("password"))) {
    steps.push("Change your password on this service immediately.");
    steps.push("Update any other accounts where you reused this password.");
  }
  
  if (fields.some(f => f.includes("email"))) {
    steps.push("Enable Multi-Factor Authentication (MFA) on your email account.");
    steps.push("Be alert for phishing emails claiming to be from " + (breach.platform || "this service") + ".");
  }
  
  if (fields.some(f => f.includes("phone"))) {
    steps.push("Consider using an authenticator app instead of SMS for 2FA.");
    steps.push("Watch for 'SIM swap' attempts or suspicious account recovery texts.");
  }

  if (fields.some(f => f.includes("card") || f.includes("credit"))) {
    steps.push("Contact your bank to freeze or replace the compromised card.");
    steps.push("Monitor your statements for unauthorized transactions.");
  }

  if (steps.length === 0) {
    steps.push("Monitor your accounts for any suspicious activity.");
  }

  return steps;
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case "high":
      return {
        badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900",
        iconWrap: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-200 dark:shadow-none",
        panel: "border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20",
        text: "text-rose-700 dark:text-rose-400",
      };
    case "medium":
      return {
        badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
        iconWrap: "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-amber-200 dark:shadow-none",
        panel: "border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20",
        text: "text-amber-700 dark:text-amber-400",
      };
    default:
      return {
        badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
        iconWrap: "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-blue-200 dark:shadow-none",
        panel: "border-blue-200 bg-blue-50/60 dark:border-blue-900/50 dark:bg-blue-950/20",
        text: "text-blue-700 dark:text-blue-400",
      };
  }
}

function BreachCard({ breach, index }: { breach: BreachResult; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = getSeverityStyles(breach.severity || "low");
  const remediationSteps = getRemediationSteps(breach);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className={`group rounded-3xl border p-5 transition-all duration-300 ${styles.panel} hover:shadow-lg`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md ${styles.iconWrap}`}>
            <Database className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {breach.platform}
              </h4>
              <Badge className={`border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}>
                {breach.severity} Risk
              </Badge>
              {breach.passwordType && (
                <Badge variant="outline" className="border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400 text-[10px]">
                  {breach.passwordType === "plaintext" ? "⚠️ Plaintext" : `✓ ${breach.passwordType}`}
                </Badge>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{breach.date || "Unknown date"}</span>
              </div>
              {breach.recordCount && (
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  <span>{(breach.recordCount / 1000000).toFixed(1)}M records</span>
                </div>
              )}
              {breach.verified !== false && (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  <span className="font-medium">Verified Breach</span>
                </div>
              )}
            </div>
            {breach.description && (
              <p className="mt-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-3">
                {breach.description}
              </p>
            )}
          </div>
        </div>

          <div className="flex items-center gap-2 flex-wrap">
           <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400"
            onClick={() => window.open(`https://haveibeenpwned.com/PwnedWebsites#${breach.platform?.replace(/\s+/g, '')}`, '_blank')}
           >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Verify on HIBP
          </Button>
          {breach.domain && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400"
              onClick={() => window.open(`https://${breach.domain}`, '_blank')}
            >
              <Link className="h-3.5 w-3.5 mr-1.5" />
              {breach.domain}
            </Button>
          )}
          </div>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
          Compromised Data Fields
        </p>
        <div className="flex flex-wrap gap-2">
          {breach.dataExposed?.map((field, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200/50 bg-white/50 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700/50 dark:bg-slate-900/50 dark:text-slate-300"
            >
              {getFieldIcon(field)}
              {field}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-slate-200/50 dark:border-slate-700/50 pt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            REMEDIATION STEPS
          </span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ul className="mt-3 space-y-2">
                {remediationSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                    {step}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function DataBreaches({ breaches }: DataBreachesProps) {
  const safeBreaches = Array.isArray(breaches) ? breaches : [];
  const totalExposed = safeBreaches.reduce((acc, curr) => acc + (curr.recordCount || 0), 0);
  const highRiskCount = safeBreaches.filter(b => b.severity === "high").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <Card className="rounded-[28px] border border-slate-200/70 bg-white/80 dark:bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl sm:p-6 dark:border-slate-800">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
              Security Forensics
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Breach Intelligence
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Confirmed digital evidence detections from non-public data dumps
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-950/50 min-w-[120px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Breaches</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{safeBreaches.length}</span>
            </div>
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/50 p-3 dark:border-slate-800 dark:bg-slate-950/50 min-w-[120px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Records</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {totalExposed > 0 ? (totalExposed / 1000000).toFixed(1) + "M" : "—"}
              </span>
            </div>
            {highRiskCount > 0 && (
               <div className="flex flex-col rounded-2xl border border-rose-100 bg-rose-50/50 p-3 dark:border-rose-900/30 dark:bg-rose-950/20 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">High Risk</span>
                <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{highRiskCount}</span>
              </div>
            )}
          </div>
        </div>

        {safeBreaches.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-950 shadow-sm">
              <ShieldAlert className="h-8 w-8 text-slate-300 dark:text-slate-700" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Identity Profile is Clean
            </h4>
            <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
              No confirmed breaches found for this identity in our current threat databases.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {safeBreaches.map((breach, index) => (
              <BreachCard key={breach.id || index} breach={breach} index={index} />
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl bg-blue-600/5 dark:bg-blue-400/5 p-4 border border-blue-100/50 dark:border-blue-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Proactive Identity Protection</p>
              <p className="mt-1 text-xs text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                Breaches often happen months before they are discovered. We recommend changing passwords routinely and using 2FA even if your account wasn't in this specific scan.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}