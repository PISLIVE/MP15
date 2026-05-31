import { Card } from "./ui/card";
import { motion } from "motion/react";
import {
  Globe,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Search,
  Users,
  Eye,
  AlertCircle,
  ShieldAlert,
  ShieldQuestion,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { SocialResult } from "../types/scan";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface SocialMediaPresenceProps {
  data: SocialResult[];
}

function getPlatformAccent(platform: string) {
  const name = platform.toLowerCase();
  if (name.includes("instagram")) return "from-pink-500 via-purple-500 to-orange-500";
  if (name.includes("facebook")) return "from-blue-600 to-blue-700";
  if (name.includes("x") || name.includes("twitter")) return "from-slate-900 to-black";
  if (name.includes("linkedin")) return "from-blue-700 to-sky-700";
  if (name.includes("github")) return "from-slate-800 to-slate-950";
  if (name.includes("reddit")) return "from-orange-600 to-red-600";
  if (name.includes("youtube")) return "from-red-600 to-red-700";
  if (name.includes("threads")) return "from-slate-900 to-slate-800";
  return "from-blue-500 to-indigo-600";
}



function VisibilityBadge({ score }: { score?: "low" | "medium" | "high" }) {
  switch (score) {
    case "high":
      return (
        <Badge className="bg-rose-500/10 text-rose-600 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-900 flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5">
          <ShieldAlert className="h-3 w-3" /> High Visibility
        </Badge>
      );
    case "medium":
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-900 flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5">
          <ShieldQuestion className="h-3 w-3" /> Moderate Exposure
        </Badge>
      );
    default:
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-900 flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5">
          <ShieldCheck className="h-3 w-3" /> Low Exposure
        </Badge>
      );
  }
}

function ProfileCard({ item, index }: { item: SocialResult; index: number }) {
  const accent = getPlatformAccent(item.platform);
  const metadata = item.profileData || {};
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative flex flex-col overflow-hidden rounded-[32px] border border-slate-200/60 bg-white shadow-sm transition-all duration-300 hover:shadow-xl dark:border-slate-800/60 dark:bg-slate-950"
    >
      {/* Platform Banner */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${accent}`} />
      
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            {metadata.avatar ? (
              <img 
                src={metadata.avatar} 
                alt={item.platform} 
                className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            ) : (
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${accent} text-white shadow-lg`}>
                <span className="text-xl font-black uppercase">{item.platform[0]}</span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow-sm dark:bg-slate-900">
               {item.source === "direct" ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Search className="h-3.5 w-3.5 text-blue-500" />}
            </div>
          </div>
          
          <VisibilityBadge score={metadata.visibilityScore} />
        </div>

        <div className="mb-3">
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {item.platform}
            {item.source === "direct" && <CheckCircle2 className="h-4 w-4 text-emerald-500" fill="currentColor" />}
          </h4>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {metadata.name || `@${item.url?.split('/').pop() || item.platform}`}
          </p>
        </div>

        {metadata.bio && (
          <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3 italic">
            "{metadata.bio}"
          </p>
        )}

        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Public Profile</span>
             <span className={`flex items-center gap-1 ${
               item.source === "direct" ? "text-emerald-500" : "text-amber-500"
             }`}>
               {item.source === "direct" || item.source === "direct-login-wall"
                 ? "✓ Verified"
                 : "⚡ Search-inferred"}
             </span>
          </div>

          <Button 
              variant="outline" 
              className="w-full h-9 rounded-xl border-slate-200 bg-slate-50 hover:bg-white hover:text-blue-600 transition-all dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
              onClick={() => window.open(item.url, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Live Profile
            </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function SocialMediaPresence({ data }: SocialMediaPresenceProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDemo = user?.email === "demo@footprintanalyzer.com";

  const safeData = Array.isArray(data) ? data.filter((item) => item?.found) : [];
  const displayData = isDemo ? safeData.slice(0, 2) : safeData;
  const hiddenCount = isDemo ? Math.max(0, safeData.length - 2) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
    >
      <Card className="rounded-[28px] border border-slate-200/70 bg-white/80 dark:bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl sm:p-6 dark:border-slate-800">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
              Identity Graph
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Social Presence
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Correlated public social profiles identified across the surface web
            </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Profiles Found</p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{safeData.length}</p>
             </div>
             <div className="h-10 w-px bg-slate-200 dark:bg-slate-800" />
             <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 p-3 text-indigo-600 dark:text-indigo-400">
               <Users className="h-6 w-6" />
             </div>
          </div>
        </div>

        {safeData.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-950 shadow-sm">
              <Globe className="h-8 w-8 text-slate-300 dark:text-slate-700" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Digital Ghost Protocol
            </h4>
            <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
              No public social profiles were confirmed for this identity. This indicates a high level of social media privacy or minimal footprint.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 relative">
            {displayData.map((item, index) => (
              <ProfileCard key={index} item={item} index={index} />
            ))}

            {hiddenCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-5 overflow-hidden flex flex-col justify-between min-h-[220px]"
              >
                <div className="absolute inset-0 backdrop-blur-[6px] z-10 flex flex-col items-center justify-center bg-white/30 dark:bg-slate-950/50 p-4 text-center">
                  <Lock className="w-8 h-8 text-indigo-500 mb-2" />
                  <p className="font-bold text-slate-900 dark:text-slate-100">
                    {hiddenCount} More Profiles Found
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Register a free account to unlock full identity mapping.
                  </p>
                  <Button
                    onClick={() => {
                      navigate("/login");
                    }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                  >
                    Register Now
                  </Button>
                </div>
                {/* Dummy blurred content underneath */}
                <div className="opacity-40 blur-sm pointer-events-none select-none">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    <div>
                      <div className="h-3 w-20 bg-slate-300 dark:bg-slate-700 rounded mb-1" />
                      <div className="h-2 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                  <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </motion.div>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-amber-50 dark:bg-amber-900/10 p-4 border border-amber-100 dark:border-amber-900/20">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0" />
          <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
            <span className="font-bold">Privacy Note:</span> Detected profiles are publicly accessible. We recommend auditing your privacy settings on these platforms to minimize public visibility.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}