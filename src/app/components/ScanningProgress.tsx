import { Card } from "./ui/card";
import { motion } from "motion/react";
import { Loader2, Search, Database, Shield, Globe, Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface ScanStep {
  id: string;
  label: string;
  icon: typeof Search;
  duration: number;
}

const scanSteps: ScanStep[] = [
  { id: "search", label: "Searching online presence", icon: Search, duration: 2000 },
  { id: "social", label: "Analyzing social media accounts", icon: Globe, duration: 2500 },
  { id: "data", label: "Checking data breaches", icon: Database, duration: 2000 },
  { id: "security", label: "Evaluating security measures", icon: Shield, duration: 2500 },
];

interface ScanningProgressProps {
  isBackendComplete: boolean;
}

export function ScanningProgress({ isBackendComplete }: ScanningProgressProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    if (currentStep < scanSteps.length) {
      const timer = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, scanSteps[currentStep].id]);
        setCurrentStep((prev) => prev + 1);
      }, scanSteps[currentStep].duration);

      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const isWaiting = currentStep === scanSteps.length && !isBackendComplete;
  const progress = isWaiting ? 95 : ((currentStep) / scanSteps.length) * 100;

  return (
    <motion.div
      key="scanning-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-8 max-w-md w-full mx-4 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700">
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {isWaiting ? "Finalizing Report" : "Scanning Digital Footprint"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isWaiting ? "Generating AI security insights..." : "Analyzing online presence and security..."}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {scanSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.includes(step.id);

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700" : ""
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      isCompleted
                        ? "bg-green-500"
                        : isActive
                        ? "bg-blue-600"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-white" : "text-slate-400 dark:text-slate-500"
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        isActive || isCompleted ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {isActive && (
                    <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  )}
                </motion.div>
              );
            })}
            {isWaiting && (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700"
               >
                 <div className="p-2 rounded-lg bg-indigo-600">
                   <Sparkles className="w-4 h-4 text-white" />
                 </div>
                 <div className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                   Generating AI Insights
                 </div>
                 <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
               </motion.div>
            )}
          </div>

          <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-2">
            {isWaiting ? "Almost there..." : `${Math.round(progress)}% Complete`}
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
