import { Search, Shield, TrendingUp } from "lucide-react";
import { Card } from "./ui/card";
import { motion } from "motion/react";

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="p-12 text-center bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl border border-white/40 dark:border-slate-800/50 shadow-[0_8px_32px_rgba(31,38,135,0.07)] dark:shadow-none">
        <motion.div
          className="inline-flex p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Search className="w-12 h-12 text-blue-600" />
        </motion.div>
        <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Start Your Digital Footprint Analysis
        </h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Enter a profile URL, email, or username above to discover online presence, security risks, and privacy insights
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl shadow-sm border border-white/40 dark:border-slate-800/50"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-semibold mb-1 text-gray-900">Discover</h4>
            <p className="text-sm text-gray-600">Find all online accounts and profiles</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl shadow-sm border border-white/40 dark:border-slate-800/50"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-semibold mb-1 text-gray-900">Protect</h4>
            <p className="text-sm text-gray-600">Identify security vulnerabilities</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-xl shadow-sm border border-white/40 dark:border-slate-800/50"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-semibold mb-1 text-gray-900">Improve</h4>
            <p className="text-sm text-gray-600">Get actionable recommendations</p>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}
