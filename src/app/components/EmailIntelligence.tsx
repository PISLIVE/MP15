import {
  Mail,
  User,
  Image as ImageIcon,
  MapPin,
  Link2,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Github,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react";

export function EmailIntelligence({
  emailResults,
  breaches,
}: {
  emailResults: any;
  breaches: any[];
}) {
  if (!emailResults) return null;

  const { email, deliverability, gravatar } = emailResults;

  // Infer First Seen / Last Seen from breaches (if any)
  let firstSeen = "Unknown";
  let lastSeen = "Unknown";
  if (breaches && breaches.length > 0) {
    const dates = breaches
      .map((b) => b.date)
      .filter((d) => d && d !== "Unknown")
      .map((d) => new Date(d).getTime())
      .sort((a, b) => a - b);
    if (dates.length > 0) {
      firstSeen = new Date(dates[0]).toLocaleDateString();
      lastSeen = new Date(dates[dates.length - 1]).toLocaleDateString();
    }
  }

  // Build registrations from Holehe results (real data) + Gravatar + Breaches
  const holeheData = emailResults?.holehe || {};
  const holeheEntries = Object.entries(holeheData);
  const hasHoleheData = holeheEntries.length > 0;

  // Build a combined set of platform registrations
  const allRegistrations: { name: string; exists: boolean; rateLimit: boolean; source: string }[] = [];

  // Add Holehe verified platforms
  for (const [name, info] of holeheEntries) {
    const data = info as any;
    allRegistrations.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      exists: data.exists === true,
      rateLimit: data.rateLimit === true,
      source: "holehe",
    });
  }

  // Add Gravatar linked accounts (if not already in holehe results)
  if (gravatar?.accounts) {
    for (const acc of gravatar.accounts) {
      const existing = allRegistrations.find(
        (r) => r.name.toLowerCase() === (acc.shortname || acc.domain || "").toLowerCase()
      );
      if (!existing) {
        allRegistrations.push({
          name: acc.shortname || acc.domain,
          exists: true,
          rateLimit: false,
          source: "gravatar",
        });
      }
    }
  }

  // Add breach-inferred registrations
  if (breaches && breaches.length > 0) {
    for (const b of breaches) {
      const bName = b.platform || "";
      const existing = allRegistrations.find(
        (r) => r.name.toLowerCase() === bName.toLowerCase()
      );
      if (!existing) {
        allRegistrations.push({
          name: bName,
          exists: true,
          rateLimit: false,
          source: "breach",
        });
      } else if (!existing.exists) {
        existing.exists = true; // breach proves registration
      }
    }
  }

  // Sort: registered first, then alphabetically
  allRegistrations.sort((a, b) => {
    if (a.exists !== b.exists) return a.exists ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  const registeredCount = allRegistrations.filter((r) => r.exists).length;


  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-2xl border border-slate-200/50 bg-white/40 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-950/40">
        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white truncate">
              {email}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              First Seen
            </p>
            <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">
              {firstSeen}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Last Seen
            </p>
            <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">
              {lastSeen}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Can Receive Email
            </p>
            <p className="mt-1 font-medium flex items-center gap-2 text-slate-900 dark:text-slate-200">
              {deliverability?.canReceive ? (
                <span className="text-green-500 font-bold flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Yes</span>
              ) : (
                <span className="text-red-500 font-bold flex items-center gap-1"><XCircle className="h-4 w-4" /> No</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email Provider
            </p>
            <p className="mt-1 font-medium text-slate-900 dark:text-slate-200">
              {deliverability?.provider || "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Summary</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Names Found */}
          <div className="rounded-2xl border border-slate-200/50 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 mb-3 text-slate-500">
              <User className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">Names Found</span>
            </div>
            {gravatar?.name ? (
              <p className="font-medium text-slate-900 dark:text-white">{gravatar.name}</p>
            ) : gravatar?.displayName ? (
              <p className="font-medium text-slate-900 dark:text-white">{gravatar.displayName}</p>
            ) : (
              <p className="text-sm text-slate-500 italic">No names found</p>
            )}
          </div>

          {/* Usernames */}
          <div className="rounded-2xl border border-slate-200/50 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 mb-3 text-slate-500">
              <User className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">Usernames</span>
            </div>
            {gravatar?.username ? (
              <p className="font-medium text-slate-900 dark:text-white">{gravatar.username}</p>
            ) : (
              <p className="text-sm text-slate-500 italic">No usernames found</p>
            )}
          </div>

          {/* Profile Pictures */}
          <div className="rounded-2xl border border-slate-200/50 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 mb-3 text-slate-500">
              <ImageIcon className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">Profile Pictures</span>
            </div>
            <div className="flex gap-2">
              {gravatar?.hasProfile ? (
                <img
                  src={gravatar.avatarUrl}
                  alt="Profile"
                  className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <p className="text-sm text-slate-500 italic">No profile pictures found</p>
              )}
            </div>
          </div>

          {/* Locations */}
          <div className="rounded-2xl border border-slate-200/50 bg-slate-50 p-4 dark:border-slate-800/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2 mb-3 text-slate-500">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-semibold uppercase tracking-wider">Locations</span>
            </div>
            {gravatar?.currentLocation ? (
              <p className="font-medium text-slate-900 dark:text-white">{gravatar.currentLocation}</p>
            ) : (
              <p className="text-sm text-slate-500 italic">No locations found</p>
            )}
          </div>
        </div>
      </div>

      {/* REGISTRATIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registrations</h3>
          {hasHoleheData && (
            <span className="text-xs font-bold text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-lg">
              {registeredCount} accounts found across {allRegistrations.length} sites checked
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-2">
          {hasHoleheData
            ? "Verified by checking account recovery endpoints on each platform."
            : "Inferred from connected accounts and breach intelligence. Install Holehe for live verification."}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {allRegistrations.map((reg) => (
            <div
              key={reg.name}
              className={`flex items-center justify-between rounded-xl border p-3 ${
                reg.exists
                  ? "border-green-200/50 bg-green-50/50 dark:border-green-900/30 dark:bg-green-950/20"
                  : reg.rateLimit
                  ? "border-yellow-200/50 bg-yellow-50/50 dark:border-yellow-900/30 dark:bg-yellow-950/20"
                  : "border-slate-200/50 bg-slate-50 dark:border-slate-800/50 dark:bg-slate-900/50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {reg.name}
                </span>
              </div>
              {reg.exists ? (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-500">
                  <CheckCircle2 className="h-3 w-3" /> Registered
                </span>
              ) : reg.rateLimit ? (
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 dark:text-yellow-500">
                  <AlertTriangle className="h-3 w-3" /> Rate Limited
                </span>
              ) : (
                <span className="text-xs font-medium text-slate-400">
                  Not found
                </span>
              )}
            </div>
          ))}
        </div>
        {allRegistrations.length === 0 && (
          <p className="text-sm text-slate-500 italic">No registration data available.</p>
        )}
      </div>

      {/* ACCOUNTS DETAIL (Gravatar) */}
      {gravatar?.hasProfile && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Global Avatar Account</h3>
          <div className="rounded-2xl border border-slate-200/50 bg-slate-50 p-5 dark:border-slate-800/50 dark:bg-slate-900/50">
            <div className="flex items-start gap-4">
              <img
                src={gravatar.avatarUrl}
                alt="Gravatar"
                className="h-16 w-16 rounded-xl border border-slate-200 dark:border-slate-700 object-cover"
              />
              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white">Gravatar Profile</h4>
                  {gravatar.aboutMe && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{gravatar.aboutMe}</p>
                  )}
                </div>
                
                {gravatar.profileLinks && gravatar.profileLinks.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Connected Links</p>
                    <div className="flex flex-wrap gap-2">
                      {gravatar.profileLinks.map((link: any, i: number) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900/70"
                        >
                          <Link2 className="h-3 w-3" /> {link.title || link.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BREACH INTELLIGENCE */}
      {breaches && breaches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Breach Intelligence</h3>
          <div className="rounded-2xl border border-red-200/50 bg-red-50/50 p-5 dark:border-red-900/30 dark:bg-red-950/20">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-red-200/50 dark:border-red-900/30">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">Breaches</p>
                <p className="text-2xl font-black text-red-700 dark:text-red-400">{breaches.length}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-red-500">Exposure Risk</p>
                <span className="inline-block mt-1 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800 dark:bg-red-900/50 dark:text-red-300">
                  High Exposure
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              {breaches.slice(0, 5).map((b: any, i: number) => (
                <div key={i} className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{b.platform}</p>
                    <p className="text-xs text-slate-500 mt-1">{b.dataExposed?.join(', ')}</p>
                  </div>
                  <p className="text-xs font-medium text-slate-500">{b.date}</p>
                </div>
              ))}
              {breaches.length > 5 && (
                <p className="text-xs font-medium text-slate-500 italic mt-2 text-center">
                  + {breaches.length - 5} more breaches... (See Security Tab)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
