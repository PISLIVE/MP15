import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  Calendar, 
  Shield, 
  Clock, 
  ChevronRight,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  X,
  Database,
  Globe,
  Activity,
  Map,
  Mail,
  CheckSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { getScanHistory, deleteScan, getScanById } from "../services/scannerService";
import type { ScanData, ScanHistoryItem } from "../types/scan";
import { SocialMediaPresence } from "../components/SocialMediaPresence";
import { DataBreaches } from "../components/DataBreaches";
import { SocialMentions } from "../components/SocialMentions";
import { PrivacyScore } from "../components/PrivacyScore";
import { ExposureMap } from "../components/ExposureMap";
import { EmailIntelligence } from "../components/EmailIntelligence";
import { SecurityChecklist } from "../components/SecurityChecklist";
import { generatePDFReport } from "../utils/pdfReportGenerator";
import type { Recommendation } from "../types/scan";

export function History() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  
  const [selectedScan, setSelectedScan] = useState<ScanData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await getScanHistory();
      setHistory(res.data || []);
    } catch (error) {
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.query.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = !filterLevel || 
        (filterLevel === "High" && item.risk_score >= 70) ||
        (filterLevel === "Medium" && item.risk_score >= 40 && item.risk_score < 70) ||
        (filterLevel === "Low" && item.risk_score < 40);
      return matchesSearch && matchesFilter;
    });
  }, [history, searchQuery, filterLevel]);

  const handleViewReport = async (id: string) => {
    setSelectedId(id);
    setIsDetailLoading(true);
    try {
      const res = await getScanById(id);
      if (res.data) {
        // Map backend history item back to ScanData-like structure for components
        const data = res.data;
        setSelectedScan({
          input: { name: data.query, username: data.query, email: data.query.includes("@") ? data.query : undefined }, // Approximation
          socialResults: data.social_results || [],
          breachResults: data.breach_results || [],
          googleResults: data.google_results || [],
          mentionResults: data.mention_results || [],
          emailResults: data.email_results || null,
          whoisResults: data.whois_results || null,
          riskScore: { score: data.risk_score, level: data.risk_score >= 70 ? "High" : data.risk_score >= 40 ? "Medium" : "Low" }
        });
      }
    } catch (error) {
      toast.error("Failed to load report details");
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this scan record?")) return;
    
    try {
      await deleteScan(id);
      setHistory(history.filter(item => item.id !== id));
      toast.success("Record deleted");
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  const handleExportPDF = async () => {
    if (!selectedScan) return;

    try {
      setIsExporting(true);
      toast.info("Generating professional report...");

      // Build basic recommendations for the PDF
      const recommendations: Recommendation[] = [];
      if ((selectedScan.breachResults?.length || 0) > 0) {
        recommendations.push({ id: "b1", title: "Change exposed passwords immediately", description: "Breach records were detected. Update passwords and avoid reusing them across services.", priority: "high", icon: "shield" });
      }
      if ((selectedScan.socialResults?.length || 0) > 0) {
        recommendations.push({ id: "s1", title: "Review public profile visibility", description: "Public-facing accounts were detected. Check bio details, contact info, and profile visibility settings.", priority: "medium", icon: "userx" });
      }

      generatePDFReport(selectedScan, recommendations, selectedScan.input?.name || selectedId || "report");

      toast.success("Report Exported!");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Forensic History</h1>
              <p className="text-xs text-slate-500">Track and revisit your past digital footprints</p>
            </div>
          </div>
          
          <Badge variant="outline" className="rounded-full bg-blue-50 text-blue-600 border-blue-200 px-3 py-1 font-bold">
            {history.length} Total Scans
          </Badge>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        
        {/* Filters */}
        <section className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or handle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-blue-500/20 focus:ring-4 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Filter className="h-4 w-4 text-slate-400 shrink-0" />
            {(["High", "Medium", "Low"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(filterLevel === level ? null : level)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  filterLevel === level
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                }`}
              >
                {level} Risk
              </button>
            ))}
          </div>
        </section>

        {/* Timeline List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-4 text-sm text-slate-500">Recovering forensic records...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="rounded-[40px] border border-dashed border-slate-200 bg-slate-50/50 py-24 text-center dark:border-slate-800 dark:bg-slate-900/30">
             <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-slate-950">
                <Clock className="h-10 w-10 text-slate-300" />
             </div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">No history found</h3>
             <p className="mt-2 text-slate-500 max-w-xs mx-auto">
                {searchQuery ? "No records match your current search criteria." : "Run your first scan from the dashboard to start building your forensic timeline."}
             </p>
             {!searchQuery && (
               <Button className="mt-8 rounded-2xl px-8" onClick={() => navigate("/dashboard")}>
                 Go to Dashboard
               </Button>
             )}
          </div>
        ) : (
          <div className="grid gap-4">
             {filteredHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleViewReport(item.id)}
                  className="group relative flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[32px] border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-blue-900/50"
                >
                  <div className="flex items-center gap-5">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm ${
                      item.risk_score >= 70 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30" :
                      item.risk_score >= 40 ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30" :
                      "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                    }`}>
                       <Shield className="h-6 w-6" />
                    </div>
                    
                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {item.query}
                      </h4>
                      <div className="mt-1.5 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                         <span className="flex items-center gap-1.5">
                           <Calendar className="h-3.5 w-3.5" />
                           {new Date(item.created_at).toLocaleDateString()}
                         </span>
                         <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                         <Badge variant="outline" className="border-slate-100 dark:border-slate-800 text-[10px]">
                            {item.risk_score >= 70 ? "Critical" : item.risk_score >= 40 ? "Elevated" : "Standard"}
                         </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-slate-50 pt-4 sm:border-0 sm:pt-0">
                     <div className="text-right sm:mr-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Risk Score</p>
                        <p className={`text-xl font-black ${
                          item.risk_score >= 70 ? "text-rose-600" :
                          item.risk_score >= 40 ? "text-amber-600" :
                          "text-emerald-600"
                        }`}>
                          {item.risk_score}
                        </p>
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDelete(e, item.id)}
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800">
                           <ChevronRight className="h-5 w-5" />
                        </div>
                     </div>
                  </div>
                </motion.div>
             ))}
          </div>
        )}
      </main>

      {/* Report Modal */}
      <AnimatePresence>
        {selectedScan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:p-10"
          >
             <motion.div
               initial={{ scale: 0.95, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="relative h-full w-full max-w-6xl overflow-hidden rounded-[40px] bg-white shadow-2xl dark:bg-slate-950"
             >
                {/* Modal Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
                   <div className="flex items-center gap-4">
                      <div className="rounded-2xl bg-indigo-600 p-2 text-white shadow-lg shadow-indigo-200">
                         <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Historical Forensic Report</h2>
                        <p className="text-xs text-slate-500">Frozen results for {selectedScan.input.name}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleExportPDF} 
                        disabled={isExporting}
                        className="rounded-xl"
                      >
                         {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                         Export Report
                      </Button>
                      <button
                        onClick={() => setSelectedScan(null)}
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
                      >
                        <X className="h-5 w-5" />
                      </button>
                   </div>
                </div>

                {/* Modal Content */}
                <div className="h-[calc(100%-74px)] overflow-y-auto p-6 sm:p-10" id="history-report-content">
                    <div className="mx-auto max-w-4xl space-y-12">
                       
                       {/* Top Section: Overview */}
                       <div className="grid gap-6 sm:grid-cols-2">
                          <PrivacyScore score={selectedScan.riskScore.score} level={selectedScan.riskScore.level} />
                          <div className="rounded-[32px] border border-slate-100 bg-slate-50/50 p-8 dark:border-slate-800 dark:bg-slate-900/30">
                             <h4 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Scan Context</h4>
                             <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                   <span className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                     <Globe className="h-4 w-4" /> Identity
                                   </span>
                                   <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{selectedScan.input.name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                   <span className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                     <Database className="h-4 w-4" /> Result Volume
                                   </span>
                                   <span className="text-sm font-bold text-slate-900 dark:text-white">
                                     {selectedScan.socialResults.length + selectedScan.breachResults.length + selectedScan.mentionResults.length} records
                                   </span>
                                </div>
                                <div className="flex items-center justify-between">
                                   <span className="text-sm text-slate-500 font-medium flex items-center gap-2">
                                     <Clock className="h-4 w-4" /> Forensics Status
                                   </span>
                                   <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]">VERIFIED ARCHIVE</Badge>
                                </div>
                             </div>
                             
                             <Button 
                               variant="outline" 
                               className="mt-10 w-full rounded-2xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-950/30"
                               onClick={() => {
                                 // Close history and run fresh scan on dashboard
                                 const query = selectedScan.input.name || "";
                                 setSelectedScan(null);
                                 navigate(`/dashboard?q=${encodeURIComponent(query)}`);
                               }}
                             >
                               Run Fresh Scan
                             </Button>
                          </div>
                       </div>

                       {/* Detailed forensic sections */}
                       <div className="space-y-12">
                          
                          <div>
                             <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                                <Map className="h-5 w-5 text-emerald-600" />
                                1. Global Exposure Map
                             </h3>
                             <ExposureMap socialResults={selectedScan.socialResults} breachResults={selectedScan.breachResults} />
                          </div>

                          <div>
                             <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                                <Shield className="h-5 w-5 text-indigo-600" />
                                2. Identity & Breaches
                             </h3>
                             <DataBreaches breaches={selectedScan.breachResults} />
                          </div>

                          {selectedScan.emailResults && (
                            <div>
                               <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                                  <Mail className="h-5 w-5 text-blue-500" />
                                  3. Email Intelligence
                               </h3>
                               <EmailIntelligence data={selectedScan.emailResults} />
                            </div>
                          )}

                          <div>
                             <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-orange-600" />
                                {selectedScan.emailResults ? "4" : "3"}. Social Activity Mentions
                             </h3>
                             <SocialMentions mentions={selectedScan.mentionResults} />
                          </div>

                          <div>
                             <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-600" />
                                {selectedScan.emailResults ? "5" : "4"}. Social Footprint
                             </h3>
                             <SocialMediaPresence data={selectedScan.socialResults} />
                          </div>

                          <div>
                             <h3 className="mb-6 text-xl font-bold flex items-center gap-2">
                                <CheckSquare className="h-5 w-5 text-purple-600" />
                                {selectedScan.emailResults ? "6" : "5"}. Security Action Plan
                             </h3>
                             <SecurityChecklist scanData={selectedScan} />
                          </div>

                       </div>
                       
                       <div className="border-t border-slate-100 pt-10 pb-10 text-center dark:border-slate-800">
                          <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">End of Forensic Report</p>
                       </div>
                    </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Loading Detail Overlay */}
      <AnimatePresence>
        {isDetailLoading && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 backdrop-blur-md dark:bg-slate-950/80">
            <div className="text-center">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
              <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">Decrypting Archive...</p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
