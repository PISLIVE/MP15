import React, { useMemo } from "react";
import { ScanData } from "../types/scan";
import { Card } from "./ui/card";
import { DollarSign, TrendingUp, AlertCircle, ShieldAlert } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTheme } from "next-themes";

interface DataValuationProps {
  scanData: ScanData | null;
}

const DATA_VALUES: Record<string, number> = {
  email: 1.5,
  password: 15,
  phone: 10,
  address: 8,
  ssn: 50,
  credit_card: 25,
  dob: 5,
  ip_address: 2,
  username: 1
};

export function DataValuation({ scanData }: DataValuationProps) {
  const { theme } = useTheme();

  const valuation = useMemo(() => {
    let total = 0;
    const breakdown = {
      credentials: 0,
      personal: 0,
      financial: 0,
      tracking: 0
    };

    if (!scanData || !scanData.breachResults) return { total, breakdown, chartData: [] };

    // Base value just for having public social profiles
    if (scanData.socialResults && scanData.socialResults.length > 0) {
        total += scanData.socialResults.filter(s => s.found).length * DATA_VALUES.username;
        breakdown.tracking += scanData.socialResults.filter(s => s.found).length * DATA_VALUES.username;
    }

    scanData.breachResults.forEach(breach => {
      // Very naive value assignment based on string matching in dataExposed or descriptions
      const dataStr = (breach.dataExposed?.join(" ") || breach.description || "").toLowerCase();
      
      if (dataStr.includes("email")) { total += DATA_VALUES.email; breakdown.personal += DATA_VALUES.email; }
      if (dataStr.includes("password") || breach.passwordType) { total += DATA_VALUES.password; breakdown.credentials += DATA_VALUES.password; }
      if (dataStr.includes("phone")) { total += DATA_VALUES.phone; breakdown.personal += DATA_VALUES.phone; }
      if (dataStr.includes("address") || dataStr.includes("location")) { total += DATA_VALUES.address; breakdown.personal += DATA_VALUES.address; }
      if (dataStr.includes("ssn") || dataStr.includes("social security")) { total += DATA_VALUES.ssn; breakdown.personal += DATA_VALUES.ssn; }
      if (dataStr.includes("credit") || dataStr.includes("card") || dataStr.includes("bank")) { total += DATA_VALUES.credit_card; breakdown.financial += DATA_VALUES.credit_card; }
      if (dataStr.includes("dob") || dataStr.includes("date of birth")) { total += DATA_VALUES.dob; breakdown.personal += DATA_VALUES.dob; }
      if (dataStr.includes("ip")) { total += DATA_VALUES.ip_address; breakdown.tracking += DATA_VALUES.ip_address; }
    });

    // If they have no breaches but exist, give a baseline low value
    if (total === 0 && scanData.input) {
      total = 2.5;
      breakdown.personal = 2.5;
    }

    const chartData = [
      { name: "Credentials (Passwords)", value: breakdown.credentials, color: "#ef4444" },
      { name: "Personal ID (DOB, SSN)", value: breakdown.personal, color: "#f59e0b" },
      { name: "Financial Data", value: breakdown.financial, color: "#10b981" },
      { name: "Tracking/Social", value: breakdown.tracking, color: "#3b82f6" }
    ].filter(d => d.value > 0);

    return { total, breakdown, chartData };
  }, [scanData]);

  if (!scanData) {
    return <div className="text-center p-8 text-slate-500">Run a scan to see your data valuation.</div>;
  }

  const isHighValue = valuation.total > 50;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-500" />
            Dark Web Valuation
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Estimated financial value of your exposed data on illicit marketplaces.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 p-6 relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-[28px] border-0 shadow-xl shadow-emerald-900/20">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 p-8 bg-white/10 rounded-full blur-2xl"></div>
          
          <h4 className="text-emerald-100 font-semibold mb-2 uppercase tracking-wider text-xs flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Total Estimated Value
          </h4>
          <div className="text-5xl font-black mb-1">${valuation.total.toFixed(2)}</div>
          <p className="text-emerald-100/80 text-sm mb-6">Based on {scanData.breachResults.length} known breaches and {scanData.socialResults.length} public profiles.</p>

          {isHighValue ? (
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 flex items-start gap-3 backdrop-blur-md">
              <ShieldAlert className="w-5 h-5 text-red-200 shrink-0 mt-0.5" />
              <p className="text-xs text-red-100 leading-relaxed">
                <strong>High Value Target.</strong> Your exposed credentials and personal info make you a lucrative target for identity theft. Immediate remediation advised.
              </p>
            </div>
          ) : (
            <div className="bg-emerald-900/40 border border-emerald-400/30 rounded-xl p-3 flex items-start gap-3 backdrop-blur-md">
              <AlertCircle className="w-5 h-5 text-emerald-200 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-100 leading-relaxed">
                <strong>Low Market Value.</strong> Your current exposure is minimal or contains low-value tracking data. Maintain your security posture.
              </p>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 p-6 rounded-[28px] bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl border-slate-200 dark:border-slate-800">
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Value Breakdown by Category</h4>
          <div className="h-[250px] w-full flex items-center justify-center">
            {valuation.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={valuation.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {valuation.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Estimated Value']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 text-sm">No significant data exposure detected to calculate breakdown.</p>
            )}
          </div>
        </Card>
      </div>
      
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        <strong>Disclaimer:</strong> This is a simulated valuation based on average black market prices for different classes of personal data. Actual values fluctuate based on the freshness of the breach, the specific platform compromised, and current dark web market dynamics.
      </div>
    </div>
  );
}
