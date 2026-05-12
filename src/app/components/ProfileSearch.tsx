import { Search, Mail, User, AtSign, Loader2, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

interface ProfileSearchProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function ProfileSearch({ onSearch, isLoading }: ProfileSearchProps) {
  const [expanded, setExpanded] = useState(false);
  const [quick, setQuick] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const buildQuery = () => {
    if (!expanded) return quick.trim();
    const parts: string[] = [];
    if (username.trim()) parts.push(`u:${username.trim()}`);
    if (email.trim()) parts.push(`e:${email.trim()}`);
    if (name.trim()) parts.push(`n:${name.trim()}`);
    return parts.join(" | ");
  };

  const canSearch = () => {
    if (!expanded) return quick.trim().length > 0;
    return !!(username.trim() || email.trim() || name.trim());
  };

  const handleSearch = () => { if (canSearch() && !isLoading) onSearch(buildQuery()); };
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter") handleSearch(); };

  const toggleAdvanced = () => {
    setExpanded(v => {
      if (!v && quick.trim()) {
        const t = quick.trim();
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
        const isUsername = !t.includes(" ") && /^[\w.\-]+$/.test(t); // \w includes _
        if (isEmail) { setEmail(t); setUsername(""); setName(""); }
        else if (isUsername) { setUsername(t); setEmail(""); setName(""); }
        else { setName(t); setEmail(""); setUsername(""); }
        setQuick("");
      }
      return !v;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="space-y-3">

        {/* ── Simple quick search bar ── */}
        <AnimatePresence>
          {!expanded && (
            <motion.div
              key="simple"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2"
            >
              <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <Input
                  type="text"
                  placeholder="username, email, or full name…"
                  value={quick}
                  onChange={(e) => setQuick(e.target.value)}
                  onKeyPress={handleKey}
                  disabled={isLoading}
                  className="pl-9 py-5 text-sm bg-white/10 border border-white/20 text-white placeholder:text-slate-400 focus:border-blue-400 rounded-xl transition-all"
                  autoComplete="off"
                />
              </div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !canSearch()}
                  className="px-5 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Scanning…</>
                    : <><Search className="w-4 h-4 mr-1.5" />Scan Profile</>}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Advanced multi-field mode ── */}
        <button
          type="button"
          onClick={toggleAdvanced}
          className="flex items-center gap-1.5 text-[11px] font-medium text-blue-200/80 hover:text-blue-100 transition-colors ml-1"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Simple search" : "Advanced — combine username + email + name for full coverage"}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              key="advanced"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid gap-2 pt-1">

                {/* Username field */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400">
                    <AtSign className="w-3.5 h-3.5" />
                  </div>
                  <Input
                    type="text"
                    name="scan-username"
                    placeholder="@username — scans GitHub, TikTok, Facebook, Reddit…"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKey}
                    disabled={isLoading}
                    autoComplete="off"
                    className="pl-8 py-4 text-xs bg-white/10 border border-emerald-500/30 text-white placeholder:text-slate-500 focus:border-emerald-400 rounded-xl"
                  />
                </div>

                {/* Email field */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <Input
                    type="email"
                    name="scan-email"
                    placeholder="email@example.com — checks data breach & password leak databases"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKey}
                    disabled={isLoading}
                    autoComplete="off"
                    className="pl-8 py-4 text-xs bg-white/10 border border-rose-500/30 text-white placeholder:text-slate-500 focus:border-rose-400 rounded-xl"
                  />
                </div>

                {/* Full name field */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <Input
                    type="text"
                    name="scan-name"
                    placeholder="Full Name — searches public web, news, and social mentions"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={handleKey}
                    disabled={isLoading}
                    autoComplete="off"
                    className="pl-8 py-4 text-xs bg-white/10 border border-blue-500/30 text-white placeholder:text-slate-500 focus:border-blue-400 rounded-xl"
                  />
                </div>

                {/* Scan button (advanced mode) */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleSearch}
                    disabled={isLoading || !canSearch()}
                    className="w-full py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all"
                  >
                    {isLoading
                      ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Scanning…</>
                      : <><Search className="w-4 h-4 mr-1.5" />Scan Profile</>}
                  </Button>
                </motion.div>

                {/* Hint */}
                <div className="flex items-start gap-1.5 ml-1">
                  <Info className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Fill any combination. <span className="text-emerald-400/80">Username</span> scans social profiles ·{" "}
                    <span className="text-rose-400/80">Email</span> checks breaches ·{" "}
                    <span className="text-blue-400/80">Name</span> searches public web.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
