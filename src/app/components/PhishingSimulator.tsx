import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Crosshair, AlertTriangle, ShieldAlert, User } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { generatePhishingSimulation } from "../services/scannerService";
import type { ScanData } from "../types/scan";

interface PhishingSimulatorProps {
  scanData: ScanData | null;
}

export function PhishingSimulator({ scanData }: PhishingSimulatorProps) {
  const [simulationText, setSimulationText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!scanData) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await generatePhishingSimulation(scanData);
      if (response && response.success) {
        setSimulationText(response.data);
      } else {
        setError("Failed to generate simulation. The AI might be temporarily unavailable.");
      }
    } catch (err) {
      setError("An error occurred while communicating with the threat simulator.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 }}
      className="mt-8"
    >
      <Card className="rounded-[28px] border border-rose-200/70 bg-white/80 dark:bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl dark:border-rose-900/40 overflow-hidden relative">
        
        {/* Background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-rose-500/5 dark:bg-rose-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/50 shadow-sm border border-rose-200 dark:border-rose-900/50">
                <Crosshair className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Spear-Phishing Simulator
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    AI Red Team
                  </span>
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-lg">
                  See exactly how hackers use your digital footprint to craft highly convincing, personalized phishing attacks.
                </p>
              </div>
            </div>

            {!simulationText && !isLoading && (
              <Button
                onClick={handleGenerate}
                disabled={!scanData}
                className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-xl px-6 h-11 font-bold whitespace-nowrap shadow-md"
              >
                Generate Threat Simulation
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center overflow-hidden"
              >
                <div className="relative">
                  <div className="absolute inset-0 border-t-2 border-rose-500 rounded-full animate-spin" />
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-lg">
                    <AlertTriangle className="h-6 w-6 text-rose-500 animate-pulse" />
                  </div>
                </div>
                <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">AI is analyzing your footprint...</p>
                <p className="text-sm text-slate-500 mt-1">Crafting a targeted payload based on OSINT data.</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-6 flex items-start gap-3"
              >
                <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-800 dark:text-rose-300">{error}</p>
              </motion.div>
            )}

            {simulationText && !isLoading && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm overflow-hidden"
              >
                {/* Email Header Mockup */}
                <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                      <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Security Team</span>
                        <span className="text-xs text-slate-500">&lt;urgent-security-update@mail-auth-system.com&gt;</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">To: {scanData?.target || "You"}</p>
                    </div>
                  </div>
                  
                  {/* Subject extraction hack (assuming AI might include "Subject: ") */}
                  {simulationText.includes("Subject:") ? (
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {simulationText.split('\n').find(line => line.includes("Subject:"))?.replace("Subject:", "").trim()}
                    </h4>
                  ) : (
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      Action Required: Account Security Notice
                    </h4>
                  )}
                </div>

                {/* Email Body */}
                <div className="p-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
                    {/* Clean up the text if it includes the subject line we already extracted */}
                    {simulationText.replace(/^Subject:.*$/m, '').trim()}
                  </div>
                  
                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                        <span className="font-bold text-slate-700 dark:text-slate-300">Why this works: </span> 
                        Hackers use details from your data breaches and social profiles to establish false trust. Never click links in unexpected emails.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSimulationText(null)}
                      className="shrink-0"
                    >
                      Reset Simulator
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
