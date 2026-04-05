import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Globe,
  Search,
  User,
  LogOut,
  Shield,
  Mail,
  Clock3,
  Sparkles,
  AlertTriangle,
  Link2,
  Sun,
  Moon,
  Settings,
  Download,
  Bell,
} from "lucide-react";

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { PrivacyScore } from "../components/PrivacyScore";
import { MetricCard } from "../components/MetricCard";
import { DataBreaches } from "../components/DataBreaches";
import { SocialMediaPresence } from "../components/SocialMediaPresence";
import { Recommendations } from "../components/Recommendations";
import { ProfileSearch } from "../components/ProfileSearch";
import { ScanningProgress } from "../components/ScanningProgress";
import { EmptyState } from "../components/EmptyState";
import { ActivityChart } from "../components/ActivityChart";
import { ParticleBackground } from "../components/ParticleBackground";
import { SocialMentions } from "../components/SocialMentions";

import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

import { AnimatePresence } from "motion/react";

import { scanProfile, getScanHistory } from "../services/scannerService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

import { toast } from "sonner";
import type { ScanData, ScanHistoryItem, Recommendation } from "../types/scan";

function getUserInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(" ").filter(Boolean);

    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return name.slice(0, 2).toUpperCase();
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "??";
}

function parseQuery(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return {};

  // ── Advanced multi-field format from ProfileSearch: "u:username | e:email | n:name" ──
  if (trimmed.includes(" | ") || /^[une]:/.test(trimmed)) {
    const parts = trimmed.split(" | ").map(p => p.trim()).filter(Boolean);
    const result: { username?: string; email?: string; name?: string } = {};
    for (const part of parts) {
      if (part.startsWith("u:")) result.username = part.slice(2).trim();
      if (part.startsWith("e:")) result.email = part.slice(2).trim();
      if (part.startsWith("n:")) result.name = part.slice(2).trim();
    }
    return result;
  }

  // ── Simple single-field detection ──
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { email: trimmed };
  }

  if (trimmed.includes("linkedin.com/in/")) {
    const match = trimmed.match(/linkedin\.com\/in\/([^/?#]+)/i);
    return { username: match?.[1] || trimmed, name: trimmed };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const parts = trimmed.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    return { username: lastPart || trimmed, name: trimmed };
  }

  // No spaces + only URL-safe chars (including underscore) → treat as username
  if (!trimmed.includes(" ") && /^[\w.\-]+$/.test(trimmed)) {
    return { username: trimmed };
  }

  // Has spaces → full name
  return { name: trimmed };
}


function buildRecommendations(scanData: ScanData | null): Recommendation[] {
  const recommendations = [];

  const socialCount = scanData?.socialResults?.length || 0;
  const breachCount = scanData?.breachResults?.length || 0;
  const googleCount = scanData?.googleResults?.length || 0;
  const riskScore = scanData?.riskScore?.score || 0;

  if (breachCount > 0) {
    recommendations.push({
      id: "breach-1",
      title: "Change exposed passwords immediately",
      description:
        "Breach records were detected. Update passwords and avoid reusing them across services.",
      priority: "high",
      icon: "shield",
    });
  }

  if (socialCount > 0) {
    recommendations.push({
      id: "social-1",
      title: "Review public profile visibility",
      description:
        "Public-facing accounts were detected. Check bio details, contact info, and profile visibility settings.",
      priority: "medium",
      icon: "userx",
    });
  }

  if (googleCount > 0) {
    recommendations.push({
      id: "google-1",
      title: "Audit public search visibility",
      description:
        "Search results were found for this identity. Review what is publicly visible and whether it is intended.",
      priority: "medium",
      icon: "search",
    });
  }

  if (riskScore >= 70) {
    recommendations.push({
      id: "risk-1",
      title: "Enable multi-factor authentication",
      description:
        "Your exposure score is high. Protect primary email, social, and work accounts with MFA.",
      priority: "high",
      icon: "shield",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: "default-1",
      title: "Maintain healthy privacy posture",
      description:
        "No major signals were detected in this scan. Continue reviewing public data and account security regularly.",
      priority: "low",
      icon: "shield",
    });
  }

  return recommendations;
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-slate-200/50 dark:border-slate-800/50 px-5 py-4">
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 p-2 text-blue-600 dark:text-blue-400">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const res = await getScanHistory();
      if (res?.data) {
        setScanHistory(res.data);
      }
    } catch (error) {
      // Silently ignore — backend may not be running on first visit
      console.error("Failed to load history", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSearch = async (query: string) => {
    setIsScanning(true);
    setHasScanned(false);
    setScanError(null);
    setScanWarnings([]);

    try {
      const payload = parseQuery(query);
      const result = await scanProfile(payload);

      setScanData(result?.data ?? null);
      if (result?.errors && Array.isArray(result.errors)) {
        setScanWarnings(result.errors);
        toast.warning("Scan completed, but some search limitations were reached.");
      }
      setHasScanned(true);
      await loadHistory();
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Scan failed";

      setScanError(msg);
      toast.error(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportPDF = async () => {
    const element = document.getElementById("report-content");
    if (!element) return;

    try {
      setIsExporting(true);
      toast.info("Generating PDF report...");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`DigitalFootprint_${displayName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast.success("PDF Report Exported!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const authEmail = user?.email || "";

  const username =
    user?.user_metadata?.username ||
    user?.user_metadata?.user_name ||
    user?.user_metadata?.preferred_username ||
    "";

  const displayName = username || authEmail || "User";

  const displaySubtext = authEmail || username || "Authenticated session";

  const initials = getUserInitials(displayName, authEmail);

  const socialCount = scanData?.socialResults?.length || 0;
  const breachCount = scanData?.breachResults?.length || 0;
  const googleCount = scanData?.googleResults?.length || 0;
  const mentionCount = scanData?.mentionResults?.length || 0;
  const riskScore = scanData?.riskScore?.score || 0;
  const riskLevel = scanData?.riskScore?.level || "Low";

  const recommendations = useMemo(
    () => buildRecommendations(scanData),
    [scanData]
  );

  const chartData = useMemo(
    () =>
      [...scanHistory]
        .reverse()
        .slice(-8)
        .map((item) => ({
          date: item.created_at
            ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—",
          posts: Array.isArray(item.social_results) ? item.social_results.length : 0,
          searches: Array.isArray(item.google_results) ? item.google_results.length : 0,
          interactions: Array.isArray(item.breach_results) ? item.breach_results.length : 0,
        })),
    [scanHistory]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_22%),linear-gradient(to_bottom,_#f8fbff,_#eef4ff)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.05),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.05),_transparent_22%),linear-gradient(to_bottom,_#030712,_#0f172a)] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <ParticleBackground />
      <AnimatePresence>
        {isScanning && (
          <ScanningProgress onComplete={() => setIsScanning(false)} />
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 border-b border-white/40 dark:border-slate-800/80 bg-white/75 dark:bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 p-3 shadow-lg shadow-blue-200 dark:shadow-none">
              <Globe className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
                Digital Footprint Analyzer
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Live visibility, breach, and public presence monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-3 py-2 shadow-sm sm:flex">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="leading-tight">
                <p className="break-all text-sm font-medium text-slate-900 dark:text-slate-100">
                  {displayName}
                </p>
                <p className="break-all text-xs text-slate-500 dark:text-slate-400">
                  {displaySubtext}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/monitor")}
              className="rounded-xl border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80 relative"
              title="Breach Monitor"
            >
              <Bell className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/settings")}
              className="rounded-xl border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>


            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-xl border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80"
              title="Toggle dark mode"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="rounded-xl border-slate-300 bg-white/80 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
            >
              <LogOut className="mr-1 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6 overflow-hidden rounded-[28px] border border-slate-700/50 dark:border-slate-800/50 bg-slate-900/85 dark:bg-slate-950/60 backdrop-blur-3xl p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:p-8 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/25 via-indigo-600/25 to-purple-600/25 pointer-events-none mix-blend-overlay" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                <Sparkles className="h-3.5 w-3.5" />
                Real-time scan dashboard
              </div>

              <h2 className="max-w-2xl text-2xl font-bold tracking-tight sm:text-4xl">
                Scan public exposure across social presence, breach records, and search visibility
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Enter a username, email, or public profile URL. The dashboard will render the latest backend scan output and keep your recent scan history visible.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:p-5">
              <ProfileSearch onSearch={handleSearch} isLoading={isScanning} />
            </div>
          </div>
        </section>

        {scanError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-red-700 shadow-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Scan failed</p>
              <p className="text-sm">{scanError}</p>
            </div>
          </div>
        )}

        {scanWarnings.length > 0 && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4 text-yellow-800 shadow-sm">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">API Limits Reached</p>
              <ul className="text-sm list-disc list-inside mt-1">
                {scanWarnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
              <p className="text-xs mt-2 text-yellow-700">The rest of the scan completed successfully with available data.</p>
            </div>
          </div>
        )}

        {!hasScanned && (
          <div className="mb-6">
            <EmptyState />
          </div>
        )}

        {/* Mobile sidebar toggle */}
        <div className="mb-4 flex justify-end xl:hidden">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Clock3 className="h-4 w-4" />
            {showSidebar ? "Hide" : "Show"} History & Tips
          </button>
        </div>

        <div className="grid gap-6">
          <div className="space-y-6">
            {hasScanned && scanData && (
              <>
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="aspect-square sm:aspect-auto">
                    <PrivacyScore score={riskScore} level={riskLevel} />
                  </div>

                  <div className="h-full">
                    <MetricCard title="Online Accounts" value={socialCount} icon={User} />
                  </div>

                  <div className="h-full">
                    <MetricCard title="Breaches Found" value={breachCount} icon={Shield} />
                  </div>

                  <div className="h-full">
                    <MetricCard title="Activity Mentions" value={mentionCount} icon={Search} />
                  </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                  <SectionCard title="Risk Summary" icon={Shield}>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Risk level</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{riskLevel}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Privacy score</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{riskScore}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Profiles found</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{socialCount}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Public mentions</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900">{googleCount}</p>
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Scanned Input" icon={Link2}>
                    <div className="space-y-3 text-sm text-slate-700">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</p>
                        <p className="mt-1 break-all font-medium text-slate-900">{scanData?.input?.name || "—"}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
                        <p className="mt-1 break-all font-medium text-slate-900">{scanData?.input?.email || "—"}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Username / Domain</p>
                        <p className="mt-1 break-all font-medium text-slate-900">{scanData?.input?.username || "—"}</p>
                      </div>
                    </div>
                  </SectionCard>
                </section>

                {/* WHOIS DOMAIN RESULTS */}
                {scanData?.whoisResults && (
                  <section className="rounded-[28px] border border-white/40 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl p-4 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] sm:p-6 mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-indigo-600" />
                      Domain Registry (WHOIS)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100/50">
                        <span className="block text-xs font-semibold uppercase text-indigo-500 mb-1">Domain</span>
                        <span className="text-sm font-medium text-slate-800">{scanData.whoisResults.domainName}</span>
                      </div>
                      <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100/50">
                        <span className="block text-xs font-semibold uppercase text-indigo-500 mb-1">Registrar</span>
                        <span className="text-sm font-medium text-slate-800 truncate block">{scanData.whoisResults.registrar}</span>
                      </div>
                      <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100/50">
                        <span className="block text-xs font-semibold uppercase text-indigo-500 mb-1">Registered On</span>
                        <span className="text-sm font-medium text-slate-800">{new Date(scanData.whoisResults.creationDate).toLocaleDateString()}</span>
                      </div>
                      <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100/50">
                        <span className="block text-xs font-semibold uppercase text-indigo-500 mb-1">Country</span>
                        <span className="text-sm font-medium text-slate-800">{scanData.whoisResults.registrantCountry}</span>
                      </div>
                    </div>
                  </section>
                )}

                <section id="report-content" className="rounded-[28px] border border-white/40 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl p-4 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] sm:p-6 relative">

                  {/* EXPORT BUTTON */}
                  <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
                    <Button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200"
                    >
                      {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                      Export PDF
                    </Button>
                  </div>

                  <Tabs defaultValue="overview" className="w-full">

                    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">Detailed Results</h3>
                        <p className="text-sm text-slate-500">
                          Browse the latest scan output by category
                        </p>
                      </div>

                      <TabsList className="h-auto flex-wrap rounded-2xl bg-slate-100 p-1">
                        <TabsTrigger value="overview" className="rounded-xl px-4 py-2">Overview</TabsTrigger>
                        <TabsTrigger value="social" className="rounded-xl px-4 py-2">Social Profiles</TabsTrigger>
                        <TabsTrigger value="mentions" className="rounded-xl px-4 py-2">Activity Feed</TabsTrigger>
                        <TabsTrigger value="security" className="rounded-xl px-4 py-2">Security</TabsTrigger>
                        <TabsTrigger value="search" className="rounded-xl px-4 py-2">Search Results</TabsTrigger>
                        <TabsTrigger value="recommendations" className="rounded-xl px-4 py-2">Recommendations</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="overview" className="mt-0">
                      <div className="grid gap-6 lg:grid-cols-3">
                        <SectionCard title="Account Exposure" icon={User}>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="text-sm text-slate-600">Detected accounts</span>
                              <span className="text-lg font-semibold text-slate-900">{socialCount}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="text-sm text-slate-600">Breach entries</span>
                              <span className="text-lg font-semibold text-slate-900">{breachCount}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                              <span className="text-sm text-slate-600">Search mentions</span>
                              <span className="text-lg font-semibold text-slate-900">{googleCount}</span>
                            </div>
                          </div>
                        </SectionCard>

                        <SectionCard title="Public Mentions Snapshot" icon={Search} className="lg:col-span-2">
                          {googleCount > 0 ? (
                            <div className="space-y-3">
                              {scanData.googleResults.slice(0, 3).map((item: any, index: number) => (
                                <div
                                  key={item.id || index}
                                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                                >
                                  <p className="font-semibold text-slate-900">{item.title}</p>
                                  <p className="mt-1 text-sm text-slate-600">{item.snippet}</p>
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-2 inline-block break-all text-sm font-medium text-blue-600 hover:text-blue-700"
                                  >
                                    {item.link}
                                  </a>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">No public mentions found.</p>
                          )}
                        </SectionCard>
                      </div>
                    </TabsContent>

                    <TabsContent value="social" className="mt-0">
                      <SocialMediaPresence data={scanData?.socialResults ?? []} />
                    </TabsContent>

                    <TabsContent value="mentions" className="mt-0">
                      <SocialMentions mentions={scanData?.mentionResults ?? []} />
                    </TabsContent>

                    <TabsContent value="search" className="mt-0">
                      <SectionCard title="Google Search Results" icon={Mail}>
                        {googleCount > 0 ? (
                          <div className="space-y-4">
                            {scanData.googleResults.map((item: any, index: number) => (
                              <div
                                key={item.id || index}
                                className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                              >
                                <p className="font-semibold text-slate-900">{item.title}</p>
                                <p className="mt-2 text-sm text-slate-600">{item.snippet}</p>
                                <a
                                  href={item.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-3 inline-block break-all text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                  {item.link}
                                </a>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">No public search results found.</p>
                        )}
                      </SectionCard>
                    </TabsContent>

                    <TabsContent value="security" className="mt-0">
                      <DataBreaches breaches={scanData?.breachResults ?? []} />
                    </TabsContent>

                    <TabsContent value="recommendations" className="mt-0">
                      <Recommendations recommendations={recommendations} />
                    </TabsContent>
                  </Tabs>
                </section>
              </>
            )}
          </div>

          {/* Bottom strip: History, Tips, Chart */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SectionCard
              title="Recent Scan History"
              icon={Clock3}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recent Activity</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/history")}
                  className="h-7 text-[10px] font-bold uppercase text-blue-600 hover:text-blue-700"
                >
                  View Full History
                </Button>
              </div>
              {isHistoryLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="animate-pulse rounded-2xl bg-slate-100 p-4">
                      <div className="h-3 w-3/4 rounded bg-slate-200" />
                      <div className="mt-3 h-2 w-1/2 rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : scanHistory.length > 0 ? (
                <div className="space-y-3">
                  {scanHistory.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <p className="break-all text-sm font-semibold text-slate-900">
                        {item.query}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Risk score</span>
                        <span className="font-semibold text-slate-900">{item.risk_score}</span>
                      </div>
                      {item.created_at && (
                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No scan history yet.</p>
              )}
            </SectionCard>

            <SectionCard title="How to read this dashboard" icon={Sparkles}>
              <div className="space-y-3 text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">Online Accounts</span> shows matched public profiles detected by the scanner.
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Public Mentions</span> shows search-discovered references and visible public pages.
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Breaches</span> lists exposed records returned by the breach lookup service.
                </p>
              </div>
            </SectionCard>

            {chartData.length > 0 && (
              <ActivityChart data={chartData} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
