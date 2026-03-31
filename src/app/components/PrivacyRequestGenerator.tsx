import React, { useState } from "react";
import { Mail, Send, FileText, CheckCircle2, Copy, ExternalLink, ShieldAlert } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "./ui/badge";

interface DataBroker {
  id: string;
  name: string;
  type: string;
  optOutUrl: string;
  status: "pending" | "sent" | "completed";
}

const initialBrokers: DataBroker[] = [
  { id: "1", name: "Acxiom", type: "Marketing Data", optOutUrl: "https://www.acxiom.com/privacy/opt-out/", status: "pending" },
  { id: "2", name: "Epsilon", type: "Consumer Insights", optOutUrl: "https://www.epsilon.com/us/consumer-information", status: "pending" },
  { id: "3", name: "Whitepages", type: "People Search", optOutUrl: "https://www.whitepages.com/suppression-requests", status: "pending" },
  { id: "4", name: "Spokeo", type: "People Search", optOutUrl: "https://www.spokeo.com/optout", status: "pending" },
  { id: "5", name: "BeenVerified", type: "Background Check", optOutUrl: "https://www.beenverified.com/app/optout/search", status: "pending" },
];

export const PrivacyRequestGenerator = React.forwardRef<
  HTMLDivElement, 
  { userEmail?: string, userName?: string }
>(({ userEmail, userName }, ref) => {
  const [brokers, setBrokers] = useState<DataBroker[]>(initialBrokers);
  const [selectedBroker, setSelectedBroker] = useState<DataBroker | null>(null);

  const generateTemplate = (broker: string) => {
    return `Subject: Data Deletion and Opt-Out Request - ${userName || "Privacy Conscious User"}

To the Privacy Officer at ${broker},

I am writing to formally request the deletion of all personal data you hold regarding me, and to opt-out of any future data collection, processing, or sale of my information under applicable privacy laws (CCPA/GDPR).

My Information:
Name: ${userName || "[My Full Name]"}
Email: ${userEmail || "[My Email Address]"}

Please confirm once my data has been removed from your systems and third-party distributions.

Sincerely,
${userName || "[My Name]"}`;
  };

  const handleSendRequest = (id: string) => {
    setBrokers(prev => prev.map(b => b.id === id ? { ...b, status: "sent" } : b));
    toast.success("Privacy request marked as sent!");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Request template copied to clipboard!");
  };

  return (
    <div className="space-y-6" ref={ref}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Broker List */}
        <Card className="lg:col-span-1 p-6 bg-white border-gray-200 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <ShieldAlert className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Data Brokers</h3>
          </div>
          <div className="space-y-3">
            {brokers.map((broker) => (
              <motion.div
                key={broker.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedBroker(broker)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedBroker?.id === broker.id
                    ? "border-blue-600 bg-blue-50/50 shadow-md"
                    : "border-gray-100 hover:border-blue-200 bg-gray-50/30"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-gray-900">{broker.name}</h4>
                  <Badge variant={broker.status === "sent" ? "default" : "secondary"} className="text-[10px] uppercase px-1.5 h-4">
                    {broker.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">{broker.type}</p>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Request Generator */}
        <Card className="lg:col-span-2 p-6 bg-white border-gray-200 shadow-lg">
          <AnimatePresence mode="wait">
            {selectedBroker ? (
              <motion.div
                key={selectedBroker.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Request for {selectedBroker.name}</h3>
                    <p className="text-sm text-gray-500">Generate a formal opt-out request for this data broker.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => window.open(selectedBroker.optOutUrl, "_blank")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Visit Opt-Out Page
                  </Button>
                </div>

                <div className="relative group">
                  <div className="absolute top-4 right-4 flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-white/80 backdrop-blur hover:bg-white shadow-sm"
                      onClick={() => copyToClipboard(generateTemplate(selectedBroker.name))}
                    >
                      <Copy className="w-4 h-4 text-gray-600" />
                    </Button>
                  </div>
                  <pre className="p-6 bg-gray-900 text-gray-300 rounded-xl text-sm font-mono whitespace-pre-wrap border-2 border-gray-800 shadow-inner max-h-[400px] overflow-y-auto leading-relaxed">
                    {generateTemplate(selectedBroker.name)}
                  </pre>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                  <Button
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg hover:shadow-xl py-6 rounded-xl font-bold group"
                    onClick={() => handleSendRequest(selectedBroker.id)}
                  >
                    <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Mark as Sent
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-2 py-6 rounded-xl font-bold"
                    onClick={() => window.location.href = `mailto:privacy@${selectedBroker.name.toLowerCase().replace(/\s/g, '')}.com?body=${encodeURIComponent(generateTemplate(selectedBroker.name))}`}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send via Email
                  </Button>
                </div>

                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Note:</strong> Most data brokers are required by law to process these requests within 30-45 days. Keep a copy of your sent emails for your records.
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <div className="p-4 bg-white rounded-2xl shadow-md mb-4">
                  <FileText className="w-12 h-12 text-blue-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Data Broker</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Choose a company from the list to generate a customized data deletion and opt-out request.
                </p>
              </div>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  );
});

PrivacyRequestGenerator.displayName = "PrivacyRequestGenerator";
