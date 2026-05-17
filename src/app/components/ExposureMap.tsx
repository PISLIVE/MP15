import { motion } from "motion/react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Globe,
} from "lucide-react";

// ─── Platform icon mapping ───────────────────────────────────────────────────
const PLATFORM_CONFIG: Record<string, { color: string; icon: string }> = {
  Instagram:    { color: "from-pink-500 to-purple-600",  icon: "📸" },
  Facebook:     { color: "from-blue-600 to-blue-700",    icon: "👤" },
  X:            { color: "from-slate-800 to-slate-900",  icon: "𝕏" },
  Twitter:      { color: "from-sky-400 to-sky-500",      icon: "🐦" },
  LinkedIn:     { color: "from-blue-700 to-blue-800",    icon: "💼" },
  GitHub:       { color: "from-slate-700 to-slate-900",  icon: "🐙" },
  Reddit:       { color: "from-orange-500 to-orange-600",icon: "🤖" },
  YouTube:      { color: "from-red-500 to-red-600",      icon: "▶️" },
  TikTok:       { color: "from-slate-900 to-pink-500",   icon: "🎵" },
  Telegram:     { color: "from-sky-400 to-sky-500",      icon: "✈️" },
  Snapchat:     { color: "from-yellow-300 to-yellow-400",icon: "👻" },
  Pinterest:    { color: "from-red-600 to-red-700",      icon: "📌" },
  Threads:      { color: "from-slate-800 to-slate-900",  icon: "🧵" },
  Twitch:       { color: "from-purple-500 to-purple-600",icon: "🎮" },
  Medium:       { color: "from-slate-700 to-slate-800",  icon: "✍️" },
  Spotify:      { color: "from-green-500 to-green-600",  icon: "🎧" },
  Steam:        { color: "from-slate-700 to-blue-800",   icon: "🎮" },
  GitLab:       { color: "from-orange-500 to-orange-600",icon: "🦊" },
  DevTo:        { color: "from-slate-800 to-slate-900",  icon: "👩‍💻" },
  SoundCloud:   { color: "from-orange-400 to-orange-500",icon: "🔊" },
  Vimeo:        { color: "from-sky-500 to-sky-600",      icon: "🎬" },
  Dribbble:     { color: "from-pink-400 to-pink-500",    icon: "🏀" },
  Behance:      { color: "from-blue-600 to-blue-700",    icon: "🎨" },
  HackerRank:   { color: "from-green-600 to-green-700",  icon: "💻" },
  CodePen:      { color: "from-slate-800 to-slate-900",  icon: "✏️" },
  Mastodon:     { color: "from-indigo-500 to-indigo-600",icon: "🐘" },
  Keybase:      { color: "from-blue-500 to-blue-600",    icon: "🔑" },
  Gravatar:     { color: "from-blue-400 to-blue-500",    icon: "🌐" },
  AboutMe:      { color: "from-teal-500 to-teal-600",    icon: "👋" },
};

type PlatformStatus = "found" | "breached" | "not_found" | "unknown";

interface ExposureItem {
  platform: string;
  status: PlatformStatus;
  url?: string;
  source?: string;
}

interface ExposureMapProps {
  socialResults: any[];
  breachResults: any[];
}

export function ExposureMap({ socialResults = [], breachResults = [] }: ExposureMapProps) {
  // Build the unified exposure map
  const breachPlatforms = new Set(
    breachResults.map((b: any) => (b.platform || "").toLowerCase())
  );

  const ALL_PLATFORMS = Object.keys(PLATFORM_CONFIG);

  const exposureItems: ExposureItem[] = ALL_PLATFORMS.map((platform) => {
    const found = socialResults.find(
      (s: any) => s.platform === platform && s.found
    );
    const isBreach = breachPlatforms.has(platform.toLowerCase());

    if (found && isBreach) {
      return { platform, status: "breached", url: found.url, source: found.source };
    }
    if (found) {
      return { platform, status: "found", url: found.url, source: found.source };
    }
    return { platform, status: "not_found" };
  });

  // Sort: breached first, found next, not_found last
  const sortOrder: Record<PlatformStatus, number> = { breached: 0, found: 1, unknown: 2, not_found: 3 };
  exposureItems.sort((a, b) => sortOrder[a.status] - sortOrder[b.status]);

  const foundCount = exposureItems.filter((i) => i.status === "found" || i.status === "breached").length;
  const breachedCount = exposureItems.filter((i) => i.status === "breached").length;
  const notFoundCount = exposureItems.filter((i) => i.status === "not_found").length;

  return (
    <div className="space-y-5">
      {/* Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-center">
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{foundCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">Found</p>
        </div>
        <div className="rounded-2xl border border-rose-200/50 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20 p-3 text-center">
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{breachedCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600/70 dark:text-rose-400/70 mt-0.5">Breached</p>
        </div>
        <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 p-3 text-center">
          <p className="text-2xl font-black text-slate-400 dark:text-slate-500">{notFoundCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400/70 dark:text-slate-500/70 mt-0.5">Clear</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
        {exposureItems.map((item, index) => {
          const config = PLATFORM_CONFIG[item.platform] || { color: "from-slate-500 to-slate-600", icon: "🌐" };
          const isFound = item.status === "found";
          const isBreached = item.status === "breached";
          const isNotFound = item.status === "not_found";

          return (
            <motion.div
              key={item.platform}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
              className={`relative group rounded-2xl border p-3 text-center transition-all cursor-default ${
                isBreached
                  ? "border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 ring-2 ring-rose-200 dark:ring-rose-900/50"
                  : isFound
                  ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "border-slate-200/50 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/20 opacity-50"
              }`}
              title={
                isBreached
                  ? `${item.platform}: Profile found + data breached!`
                  : isFound
                  ? `${item.platform}: Profile detected`
                  : `${item.platform}: Not found`
              }
            >
              {/* Status badge */}
              <div className="absolute -top-1.5 -right-1.5">
                {isBreached ? (
                  <div className="rounded-full bg-rose-500 p-0.5 shadow-lg shadow-rose-200 dark:shadow-none">
                    <ShieldAlert className="h-3 w-3 text-white" />
                  </div>
                ) : isFound ? (
                  <div className="rounded-full bg-emerald-500 p-0.5 shadow-lg shadow-emerald-200 dark:shadow-none">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                ) : null}
              </div>

              {/* Platform Icon */}
              <div className={`inline-flex items-center justify-center h-10 w-10 rounded-xl text-lg ${
                isNotFound
                  ? "bg-slate-200 dark:bg-slate-700"
                  : `bg-gradient-to-br ${config.color}`
              } mx-auto mb-2`}>
                <span className={isNotFound ? "opacity-40" : ""}>{config.icon}</span>
              </div>

              {/* Platform Name */}
              <p className={`text-[10px] font-semibold truncate ${
                isNotFound
                  ? "text-slate-400 dark:text-slate-600"
                  : "text-slate-700 dark:text-slate-300"
              }`}>
                {item.platform}
              </p>

              {/* Link on hover for found items */}
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute inset-0 rounded-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">View {item.platform} profile</span>
                </a>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>Profile Found</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
          <span>Breached</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
          <span>Not Found</span>
        </div>
      </div>
    </div>
  );
}
