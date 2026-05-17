import { Search, Shield, TrendingUp, Globe, Lock, Eye, Fingerprint, Database, Zap } from "lucide-react";
import { Card } from "./ui/card";
import { motion } from "motion/react";
import { DemoPreview } from "./DemoPreview";

const features = [
  {
    icon: Globe,
    title: "Social Discovery",
    description: "Scan 25+ platforms including Instagram, GitHub, LinkedIn, Reddit, and more",
    gradient: "from-blue-500 to-indigo-600",
    shadowColor: "shadow-blue-200/50 dark:shadow-blue-900/20",
  },
  {
    icon: Database,
    title: "Breach Detection",
    description: "Check if your email appears in known data breaches and leaked databases",
    gradient: "from-rose-500 to-red-600",
    shadowColor: "shadow-rose-200/50 dark:shadow-rose-900/20",
  },
  {
    icon: Lock,
    title: "Password Audit",
    description: "Verify if your passwords have been exposed using HIBP k-Anonymity",
    gradient: "from-amber-500 to-orange-600",
    shadowColor: "shadow-amber-200/50 dark:shadow-amber-900/20",
  },
  {
    icon: Eye,
    title: "Search Visibility",
    description: "Discover your public mentions and digital trace across search engines",
    gradient: "from-violet-500 to-purple-600",
    shadowColor: "shadow-violet-200/50 dark:shadow-violet-900/20",
  },
  {
    icon: Fingerprint,
    title: "Email Intelligence",
    description: "Verify email deliverability, Gravatar profiles, and platform registrations",
    gradient: "from-emerald-500 to-teal-600",
    shadowColor: "shadow-emerald-200/50 dark:shadow-emerald-900/20",
  },
  {
    icon: Zap,
    title: "AI Threat Analysis",
    description: "Get AI-powered security insights and personalized action plans",
    gradient: "from-cyan-500 to-blue-600",
    shadowColor: "shadow-cyan-200/50 dark:shadow-cyan-900/20",
  },
];

const stats = [
  { value: "25+", label: "Platforms Scanned" },
  { value: "100%", label: "Client-Side Privacy" },
  { value: "Real-time", label: "Breach Monitoring" },
  { value: "AI", label: "Security Insights" },
];

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Hero Section */}
      <Card className="relative overflow-hidden rounded-[28px] border border-amber-200/30 dark:border-slate-800/50 bg-[#FAF7F2]/60 dark:bg-slate-950/40 backdrop-blur-3xl p-8 sm:p-12 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-none">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-400/10 dark:bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-2xl mx-auto">
          {/* Animated icon */}
          <motion.div
            className="inline-flex p-5 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 mb-6 shadow-xl shadow-blue-200/50 dark:shadow-blue-900/30"
            animate={{
              boxShadow: [
                "0 20px 40px rgba(59,130,246,0.3)",
                "0 20px 60px rgba(99,102,241,0.4)",
                "0 20px 40px rgba(59,130,246,0.3)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Search className="w-10 h-10 text-white" />
          </motion.div>

          <motion.h3
            className="text-3xl sm:text-4xl font-black mb-4 bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent leading-tight"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Start Your Digital Footprint Analysis
          </motion.h3>

          <motion.p
            className="text-slate-500 dark:text-slate-400 mb-8 max-w-lg mx-auto text-sm sm:text-base leading-relaxed"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Enter a profile URL, email, or username above to discover your
            online presence, security risks, and privacy insights across the entire web.
          </motion.p>

          {/* Stats strip */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="rounded-2xl border border-amber-200/40 dark:border-slate-800/50 bg-[#FBF8F3]/70 dark:bg-slate-900/40 backdrop-blur-md px-3 py-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.08 }}
              >
                <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-0.5">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Card>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group"
            >
              <Card className="h-full rounded-[22px] border border-amber-200/30 dark:border-slate-800/50 bg-[#FAF7F2]/60 dark:bg-slate-950/40 backdrop-blur-xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative">
                {/* Hover glow */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${feature.gradient} blur-3xl pointer-events-none`} style={{ opacity: 0 }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 bg-gradient-to-br from-current to-transparent pointer-events-none" />

                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-br ${feature.gradient} shadow-lg ${feature.shadowColor} mb-4 transition-transform duration-300 group-hover:scale-110`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 text-base">
                    {feature.title}
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* How it works */}
      <Card className="rounded-[28px] border border-amber-200/30 dark:border-slate-800/50 bg-[#FAF7F2]/60 dark:bg-slate-950/40 backdrop-blur-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-none">
        <div className="text-center mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-2">
            How It Works
          </p>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
            Three Steps to Complete Visibility
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {[
            {
              step: "01",
              title: "Enter Your Identity",
              description: "Provide a username, email address, or full name to begin the scan",
              icon: Search,
            },
            {
              step: "02",
              title: "AI Analyzes Everything",
              description: "Our scanners check social platforms, breach databases, and search engines simultaneously",
              icon: Shield,
            },
            {
              step: "03",
              title: "Get Your Report",
              description: "Receive a detailed exposure report with risk scores, breach alerts, and actionable security steps",
              icon: TrendingUp,
            },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.12 }}
              className="relative text-center"
            >
              {/* Connection line */}
              {index < 2 && (
                <div className="hidden md:block absolute top-8 -right-3 w-6 border-t-2 border-dashed border-slate-200 dark:border-slate-700" />
              )}

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200/50 dark:border-slate-700/50 mb-4 shadow-sm">
                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {item.step}
                </span>
              </div>

              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                {item.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Live Demo Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="text-center mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400 mb-2">
            Live Demo
          </p>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
            See How It Works
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Watch a simulated scan in real-time — this is exactly what happens when you analyze a digital footprint
          </p>
        </div>
        <DemoPreview />
      </motion.div>
    </motion.div>
  );
}
