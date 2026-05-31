import React, { useState, useEffect } from "react";
import { ScanData } from "../types/scan";
import { Card } from "./ui/card";
import { Globe, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { scanDomains } from "../services/scannerService";

interface DomainSpoofingProps {
  scanData: ScanData | null;
}

export function DomainSpoofing({ scanData }: DomainSpoofingProps) {
  const [spoofResults, setSpoofResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!scanData) {
      setSpoofResults([]);
      return;
    }

    const fetchDomains = async () => {
      setLoading(true);
      try {
        let baseName = scanData.input.email ? scanData.input.email.split("@")[0] : scanData.input.username || scanData.input.name || "target";
        const res = await scanDomains(baseName);
        if (res?.success && res.data) {
          setSpoofResults(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch domain spoofing data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, [scanData]);

  if (!scanData) {
    return <div className="text-center p-8 text-slate-500">Run a scan to analyze potential domain spoofing risks.</div>;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-4">
        <Globe className="w-8 h-8 animate-spin text-purple-500 opacity-50" />
        <p>Scanning global DNS registries for lookalike domains...</p>
      </div>
    );
  }

  const highRiskCount = spoofResults.filter(r => r.risk === "high").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Globe className="w-6 h-6 text-purple-500" />
            Typosquatting & Domain Spoofing
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Detect lookalike domains registered by malicious actors to impersonate your identity or brand.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 p-6 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[28px]">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className={`p-4 rounded-full ${highRiskCount > 0 ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
              {highRiskCount > 0 ? <ShieldAlert className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
            </div>
            <div>
              <h4 className="font-bold text-xl text-slate-900 dark:text-slate-100">{highRiskCount} High Risk Domains</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Found registered domains that closely mimic your identity.</p>
            </div>
            {highRiskCount > 0 && (
              <Button variant="destructive" className="w-full rounded-xl mt-4">
                Initiate Takedown
              </Button>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-3 p-6 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border-slate-200 dark:border-slate-800 rounded-[28px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-tl-xl">Lookalike Domain</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Threat Vector</th>
                  <th className="px-4 py-3 rounded-tr-xl text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {spoofResults.map((result, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b last:border-0 border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-4 py-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                      {result.domain}
                    </td>
                    <td className="px-4 py-4">
                      {result.status === "registered" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                          Registered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                          Available
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      {result.risk === "high" && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      {result.desc}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {result.status === "registered" ? (
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30">
                          Analyze <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="text-slate-500 hover:text-slate-700">
                          Register
                        </Button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
