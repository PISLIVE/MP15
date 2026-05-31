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
  Share2,
  Copy,
  Check,
  Loader2,
  Activity,
  Lock,
} from "lucide-react";

import { generatePDFReport } from "../utils/pdfReportGenerator";

import { PrivacyScore } from "../components/PrivacyScore";
import { MetricCard } from "../components/MetricCard";
import { DataBreaches } from "../components/DataBreaches";
import { SocialMediaPresence } from "../components/SocialMediaPresence";
import { Recommendations } from "../components/Recommendations";
import { ProfileSearch } from "../components/ProfileSearch";
import { ScanningProgress } from "../components/ScanningProgress";
import { EmptyState } from "../components/EmptyState";
import { ActivityChart } from "../components/ActivityChart";
import { PrivacyScoreChart } from "../components/PrivacyScoreChart";
import { ThreatIntelligenceFeed } from "../components/ThreatIntelligenceFeed";
import { ParticleBackground } from "../components/ParticleBackground";
import { settingsService } from "../services/settingsService";
import { SocialMentions } from "../components/SocialMentions";
import { EmailIntelligence } from "../components/EmailIntelligence";
import { PasswordBreachChecker } from "../components/PasswordBreachChecker";
import { SecurityChecklist } from "../components/SecurityChecklist";
import { ExposureMap } from "../components/ExposureMap";
import { ScanComparison } from "../components/ScanComparison";
import { PhishingSimulator } from "../components/PhishingSimulator";
import { DataGraphVisualization } from "../components/DataGraphVisualization";
import { ReverseImageSearch } from "../components/ReverseImageSearch";
import { DataValuation } from "../components/DataValuation";
import { DomainSpoofing } from "../components/DomainSpoofing";
import { GlobalGlobe } from "../components/GlobalGlobe";

import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";

import { AnimatePresence } from "motion/react";

import { scanProfile, getScanHistory, getScanById } from "../services/scannerService";
import { createSharedReport } from "../services/reportService";
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
      if (part.startsWith("u:")) {
        let u = part.slice(2).trim();
        if (u.startsWith("@")) u = u.slice(1);
        result.username = u;
      }
      if (part.startsWith("e:")) result.email = part.slice(2).trim();
      if (part.startsWith("n:")) result.name = part.slice(2).trim();
    }
    return result;
  }

  // ── Simple single-field detection ──
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { email: trimmed };
  }

  // Handle handles starting with @ (e.g. @username)
  if (trimmed.startsWith("@")) {
    const stripped = trimmed.slice(1);
    if (!stripped.includes(" ") && /^[\w.\-]+$/.test(stripped)) {
      return { username: stripped };
    }
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
  const [hasScanned, setHasScanned] = useState(() => !!sessionStorage.getItem("dashboard_scanData"));
  const [scanData, setScanData] = useState<ScanData | null>(() => {
    try {
      const saved = sessionStorage.getItem("dashboard_scanData");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanWarnings, setScanWarnings] = useState<string[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [previousScanData, setPreviousScanData] = useState<ScanData | null>(null);
  const [previousScanDate, setPreviousScanDate] = useState<string | null>(null);
  const [showDemoLimitModal, setShowDemoLimitModal] = useState(false);

  const isDemo = user?.email === "demo@footprintanalyzer.com";

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

  const handleLoadHistoryItem = async (id: string) => {
    try {
      setIsScanning(true);
      const res = await getScanById(id);
      if (res?.data) {
        const record = res.data;
        const mappedData: ScanData = {
          input: { name: record.query, username: record.query },
          socialResults: record.social_results || [],
          breachResults: record.breach_results || [],
          googleResults: record.google_results || [],
          mentionResults: record.mention_results || [],
          emailResults: record.email_results || null,
          whoisResults: record.whois_results || null,
          riskScore: { 
             score: record.risk_score || 0, 
             level: record.risk_score >= 70 ? "High" : record.risk_score >= 40 ? "Medium" : "Low" 
          },
          aiSummary: record.ai_summary || undefined
        };
        
        setScanData(mappedData);
        setCurrentQuery(record.query);
        setHasScanned(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.success("Loaded previous scan results");
      }
    } catch (error) {
      toast.error("Failed to load history item");
    } finally {
      setIsScanning(false);
    }
  };

  const handleShare = async () => {
    if (!scanData) return;
    setSharing(true);
    try {
      const res = await createSharedReport(scanData, currentQuery);
      if (res.success) {
        const url = `${window.location.origin}/report/${res.id}`;
        setShareLink(url);
        setIsShareModalOpen(true);
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        toast.success("Report link copied to clipboard!");
      } else {
        toast.error(res.message || "Failed to create share link");
      }
    } catch {
      toast.error("Failed to generate share link");
    } finally {
      setSharing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (scanData) {
      sessionStorage.setItem("dashboard_scanData", JSON.stringify(scanData));
    } else {
      sessionStorage.removeItem("dashboard_scanData");
    }
  }, [scanData]);

  const handleSearch = async (query: string) => {
    if (isDemo) {
      const demoScans = parseInt(localStorage.getItem("demoScanCount") || "0");
      if (demoScans >= 2) {
        setShowDemoLimitModal(true);
        return;
      }
      localStorage.setItem("demoScanCount", (demoScans + 1).toString());
    }

    setIsScanning(true);
    setHasScanned(false);
    setScanError(null);
    setScanWarnings([]);
    setShareLink(null); // reset share link on new scan
    setCurrentQuery(query);

    try {
      const settings = await settingsService.getSettings().catch(() => null);
      const payload = parseQuery(query) as ScanInput;
      if (settings?.strict_mode) {
        payload.strictMode = true;
      }
      const result = await scanProfile(payload);

      setScanData(result?.data ?? null);
      if (result?.errors && Array.isArray(result.errors)) {
        setScanWarnings(result.errors);
        toast.warning("Scan completed, but some search limitations were reached.");
      }
      setHasScanned(true);
      await loadHistory();

      // Find previous scan for the same query (for comparison)
      try {
        const histRes = await getScanHistory();
        const allHistory: ScanHistoryItem[] = histRes?.data || [];
        const normalizedQuery = query.trim().toLowerCase();
        // Find the second-most-recent scan matching this query (skip the one we just created)
        const previousMatch = allHistory
          .filter(h => h.query?.trim().toLowerCase() === normalizedQuery)
          .slice(1) // skip the newest (the one we just saved)
          [0];
        if (previousMatch) {
          setPreviousScanData({
            input: { name: previousMatch.query, username: previousMatch.query },
            socialResults: previousMatch.social_results || [],
            breachResults: previousMatch.breach_results || [],
            googleResults: previousMatch.google_results || [],
            mentionResults: previousMatch.mention_results || [],
            riskScore: {
              score: previousMatch.risk_score,
              level: previousMatch.risk_score >= 70 ? "High" : previousMatch.risk_score >= 40 ? "Medium" : "Low"
            },
            aiSummary: previousMatch.ai_summary || undefined,
          });
          setPreviousScanDate(previousMatch.created_at);
        } else {
          setPreviousScanData(null);
          setPreviousScanDate(null);
        }
      } catch {
        setPreviousScanData(null);
        setPreviousScanDate(null);
      }
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
    if (!scanData) return;
    if (isDemo) {
      toast.error("PDF Export is locked in Demo Mode. Please register for full access.", {
        action: { label: "Register", onClick: handleLogout },
      });
      return;
    }

    try {
      setIsExporting(true);
      toast.info("Generating professional PDF report...");

      generatePDFReport(scanData, recommendations, currentQuery || displayName);

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
            ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + new Date(item.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
            : "—",
          posts: Array.isArray(item.social_results) ? item.social_results.length : 0,
          searches: Array.isArray(item.google_results) ? item.google_results.length : 0,
          interactions: Array.isArray(item.breach_results) ? item.breach_results.length : 0,
        })),
    [scanHistory]
  );

  const scoreTrendData = useMemo(
    () =>
      [...scanHistory]
        .reverse()
        .slice(-8)
        .map((item) => ({
          date: item.created_at
            ? new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—",
          score: item.risk_score || 0,
        })),
    [scanHistory]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(180,140,80,0.08),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(160,120,60,0.08),_transparent_22%),linear-gradient(to_bottom,_#FBF8F3,_#F5F0E8)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.05),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.05),_transparent_22%),linear-gradient(to_bottom,_#030712,_#0f172a)] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <ParticleBackground />
      <AnimatePresence mode="wait">
        {isScanning && (
          <ScanningProgress isBackendComplete={hasScanned || !!scanError} />
        )}
      </AnimatePresence>

      {isDemo && (
        <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 px-4 py-2 text-center text-sm font-medium border-b border-amber-200 dark:border-amber-800/50 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          You are exploring in Demo Mode. Some results are locked.
          <button onClick={handleLogout} className="ml-2 underline font-bold hover:text-amber-700 dark:hover:text-amber-100">
            Register for free
          </button>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-amber-200/40 dark:border-slate-800/80 bg-[#FAF7F2]/80 dark:bg-slate-950/75 backdrop-blur-xl">
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
        <section className="mb-6 overflow-hidden rounded-[28px] border border-slate-700/50 dark:border-slate-800/50 bg-slate-900/90 dark:bg-slate-950/80 backdrop-blur-3xl p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.25)] sm:p-8 relative">
          {/* Animated gradient mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-indigo-600/15 to-purple-700/20 pointer-events-none" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-full blur-3xl pointer-events-none" />

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }} />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-blue-200 shadow-lg shadow-blue-900/20">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"></span>
                </span>
                Real-time scan dashboard
              </div>

              <h2 className="max-w-2xl text-3xl font-black tracking-tight sm:text-4xl lg:text-[2.75rem] leading-[1.15]">
                <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  Scan public exposure across social presence, breach records, and search visibility
                </span>
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300/90 sm:text-base">
                Enter a username, email, or public profile URL. The dashboard will render the latest backend scan output and keep your recent scan history visible.
              </p>

              {/* Mini trust badges */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {[
                  { label: "25+ Platforms", icon: "🌐" },
                  { label: "AI-Powered", icon: "🤖" },
                  { label: "Zero-Cost", icon: "💚" },
                ].map((badge) => (
                  <span key={badge.label} className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.07] border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-slate-300">
                    <span>{badge.icon}</span>
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-xl shadow-2xl shadow-black/10 sm:p-5">
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

                {/* AI SECURITY INSIGHT */}
                {scanData?.aiSummary && (
                  <section className="rounded-[28px] border border-blue-200/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 backdrop-blur-3xl p-6 shadow-xl shadow-blue-900/5 dark:shadow-none">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 text-white shadow-lg shadow-blue-200 dark:shadow-none">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">AI Security Analysis</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Expert insight generated from your latest scan results</p>
                      </div>
                    </div>
                    <div className="relative rounded-2xl bg-white/60 dark:bg-slate-900/60 p-5 border border-white/40 dark:border-slate-800/50">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Shield className="h-12 w-12 text-blue-600" />
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: scanData.aiSummary
                            .replace(/</g, "&lt;")
                            .replace(/>/g, "&gt;")
                            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.+?)\*/g, '<em>$1</em>')
                        }}
                      />
                    </div>
                  </section>
                )}

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

                <section id="report-content" className="rounded-[28px] border border-white/40 dark:border-slate-800/50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl p-4 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] sm:p-6">

                  <Tabs defaultValue="overview" className="w-full">

                    <div className="mb-6 space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Detailed Results</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Browse the latest scan output by category
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">

                          <Button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"
                          >
                            {isExporting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Download className="h-4 w-4 mr-1.5" />}
                            Export PDF
                          </Button>
                        </div>
                      </div>

                      <TabsList className="h-auto flex-wrap rounded-2xl bg-slate-100 dark:bg-slate-800/50 p-1">
                        <TabsTrigger value="overview" className="rounded-xl px-4 py-2">Overview</TabsTrigger>
                        <TabsTrigger value="exposure" className="rounded-xl px-4 py-2">Exposure Map</TabsTrigger>
                        <TabsTrigger value="social" className="rounded-xl px-4 py-2">Social Profiles</TabsTrigger>
                        <TabsTrigger value="mentions" className="rounded-xl px-4 py-2">Activity Feed</TabsTrigger>
                        <TabsTrigger value="security" className="rounded-xl px-4 py-2">Security</TabsTrigger>
                        <TabsTrigger value="search" className="rounded-xl px-4 py-2">Search Results</TabsTrigger>
                        {scanData?.input?.email && (
                          <TabsTrigger value="email" className="rounded-xl px-4 py-2 text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30">Email Intelligence</TabsTrigger>
                        )}
                        <TabsTrigger value="password" className="rounded-xl px-4 py-2 text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/30">Password Check</TabsTrigger>
                        <TabsTrigger value="checklist" className="rounded-xl px-4 py-2">Action Plan</TabsTrigger>
                        <TabsTrigger value="recommendations" className="rounded-xl px-4 py-2">Recommendations</TabsTrigger>
                        <TabsTrigger value="simulator" className="rounded-xl px-4 py-2 text-rose-600 font-bold bg-rose-50 dark:bg-rose-900/30">
                          Threat Simulator
                        </TabsTrigger>
                        <TabsTrigger value="compare" className="rounded-xl px-4 py-2 text-purple-600 font-bold bg-purple-50 dark:bg-purple-900/30">
                          <Activity className="h-3.5 w-3.5 mr-1.5" />
                          Compare
                        </TabsTrigger>
                        <TabsTrigger value="graph" className="rounded-xl px-4 py-2 text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/30">
                          Link Graph
                        </TabsTrigger>
                        <TabsTrigger value="image_search" className="rounded-xl px-4 py-2 text-pink-600 font-bold bg-pink-50 dark:bg-pink-900/30">
                          Image Search
                        </TabsTrigger>
                        <TabsTrigger value="valuation" className="rounded-xl px-4 py-2 text-teal-600 font-bold bg-teal-50 dark:bg-teal-900/30">
                          Financial Risk
                        </TabsTrigger>
                        <TabsTrigger value="spoofing" className="rounded-xl px-4 py-2 text-cyan-600 font-bold bg-cyan-50 dark:bg-cyan-900/30">
                          Domain Risk
                        </TabsTrigger>
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

                    <TabsContent value="exposure" className="mt-0">
                      <div className="grid lg:grid-cols-2 gap-6">
                        <SectionCard title="Cross-Platform Exposure Map" icon={Globe}>
                          <ExposureMap
                            socialResults={scanData?.socialResults ?? []}
                            breachResults={scanData?.breachResults ?? []}
                          />
                        </SectionCard>
                        <SectionCard title="Global Threat Vectors" icon={Globe}>
                          <div className="h-[400px]">
                            <GlobalGlobe scanData={scanData} />
                          </div>
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

                    {scanData?.input?.email && (
                      <TabsContent value="email" className="mt-0">
                        <EmailIntelligence 
                          emailResults={scanData.emailResults} 
                          breaches={scanData?.breachResults ?? []} 
                        />
                      </TabsContent>
                    )}

                    <TabsContent value="password" className="mt-0">
                      <SectionCard title="Password Breach Checker" icon={Shield}>
                        <PasswordBreachChecker />
                      </SectionCard>
                    </TabsContent>

                    <TabsContent value="checklist" className="mt-0">
                      <SectionCard title="Security Action Plan" icon={Shield}>
                        <SecurityChecklist scanData={scanData} />
                      </SectionCard>
                    </TabsContent>

                    <TabsContent value="recommendations" className="mt-0">
                      <Recommendations recommendations={recommendations} />
                    </TabsContent>

                    <TabsContent value="simulator" className="mt-0">
                      <PhishingSimulator scanData={scanData} />
                    </TabsContent>

                    <TabsContent value="compare" className="mt-0">
                      <SectionCard title="Scan Comparison" icon={Activity}>
                        <ScanComparison
                          currentScan={scanData}
                          previousScan={previousScanData}
                          previousDate={previousScanDate || undefined}
                        />
                      </SectionCard>
                    </TabsContent>

                    <TabsContent value="graph" className="mt-0">
                      <DataGraphVisualization scanData={scanData} />
                    </TabsContent>

                    <TabsContent value="image_search" className="mt-0">
                      <ReverseImageSearch />
                    </TabsContent>

                    <TabsContent value="valuation" className="mt-0">
                      <DataValuation scanData={scanData} />
                    </TabsContent>

                    <TabsContent value="spoofing" className="mt-0">
                      <DomainSpoofing scanData={scanData} />
                    </TabsContent>
                  </Tabs>
                </section>
              </>
            )}
          </div>

          {/* Bottom strip: History, Tips, Chart */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {!isDemo && (
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
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4 cursor-pointer hover:bg-slate-100 transition-colors dark:bg-slate-900/50 dark:border-slate-800 dark:hover:bg-slate-800/80"
                      onClick={() => handleLoadHistoryItem(item.id)}
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
            )}

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

            {!isDemo && chartData.length > 0 && (
              <ActivityChart data={chartData} />
            )}
            
            {!isDemo && scoreTrendData.length > 0 && (
              <PrivacyScoreChart data={scoreTrendData} />
            )}

            <ThreatIntelligenceFeed />
          </div>
        </div>
      </main>

      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Share Report</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Anyone with this link or QR code can view this report.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            {shareLink && (
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareLink)}`} 
                  alt="QR Code" 
                  className="w-[200px] h-[200px]"
                />
              </div>
            )}
            <div className="flex w-full items-center gap-2">
              <input
                className="flex h-10 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:text-slate-100"
                value={shareLink || ""}
                readOnly
              />
              <Button
                size="sm"
                onClick={() => {
                  if (shareLink) {
                    navigator.clipboard.writeText(shareLink);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 3000);
                    toast.success("Copied!");
                  }
                }}
                className="px-3 rounded-xl"
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDemoLimitModal} onOpenChange={setShowDemoLimitModal}>
        <DialogContent className="sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Demo Limit Reached
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              You've used all of your free demo scans! Create a free account to run unlimited deep scans, track your exposure over time, and unlock all advanced features.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={handleLogout}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg shadow-blue-200 dark:shadow-none"
            >
              Create Free Account
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDemoLimitModal(false)}
              className="w-full border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
