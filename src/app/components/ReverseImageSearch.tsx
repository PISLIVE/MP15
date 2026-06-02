import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, CheckCircle2, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import { Card } from "./ui/card";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { scanImage } from "../services/scannerService";

export function ReverseImageSearch() {
  const [isUploading, setIsUploading] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setIsUploading(true);
    setHasScanned(false);
    
    // Preview
    const reader = new FileReader();
    reader.onload = (event) => setUploadedImage(event.target?.result as string);
    reader.readAsDataURL(file);

    try {
      const res = await scanImage(file);
      if (res?.success && res.data) {
        setResults(res.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Image scan failed:", err);
      setResults([]);
    } finally {
      setIsUploading(false);
      setHasScanned(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) processFile(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-500" />
            Reverse Image Search
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Detect impersonation and profiles using facial recognition analysis.</p>
        </div>
      </div>

      {!hasScanned && !isUploading && (
        <Card 
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors rounded-[28px] p-12 text-center cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            accept="image/jpeg, image/png, image/webp" 
            onChange={handleFileUpload} 
          />
          <div className="mx-auto w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-4">
            <UploadCloud className="w-8 h-8 text-indigo-500" />
          </div>
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">Upload Profile Picture</h4>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Drag and drop an image here, or click to browse. We will scan the web to find where this face appears.
          </p>
        </Card>
      )}

      {isUploading && (
        <Card className="rounded-[28px] p-12 text-center border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 backdrop-blur-xl">
          <div className="relative mx-auto w-32 h-32 mb-6">
            {uploadedImage ? (
              <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover rounded-2xl shadow-lg border-2 border-indigo-500 opacity-50" />
            ) : (
              <div className="w-full h-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            )}
            <motion.div 
              className="absolute inset-0 border-t-4 border-indigo-500 rounded-2xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
            Scanning Facial Biometrics...
          </h4>
          <p className="text-sm text-slate-500">Cross-referencing against public images.</p>
        </Card>
      )}

      <AnimatePresence>
        {hasScanned && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-6"
          >
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50">
               {uploadedImage && (
                 <img src={uploadedImage} alt="Target" className="w-16 h-16 object-cover rounded-xl shadow-md border-2 border-white dark:border-slate-800" />
               )}
               <div>
                 <h4 className="font-bold text-slate-900 dark:text-slate-100">Scan Complete</h4>
                 <p className="text-sm text-slate-600 dark:text-slate-400">Found {results.length} potential matches for this identity.</p>
               </div>
               <Button onClick={() => { setHasScanned(false); setUploadedImage(null); }} variant="outline" className="ml-auto rounded-xl">New Scan</Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {results.length === 0 && (
                <div className="col-span-2 text-center text-slate-500 p-8">No results found or scan failed.</div>
              )}
              {results.map((result, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="p-5 border-l-4 rounded-2xl hover:shadow-lg transition-shadow bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg"
                    style={{ borderLeftColor: result.status === 'high_risk' ? '#ef4444' : result.status === 'medium_risk' ? '#f59e0b' : '#10b981' }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        {result.status === 'high_risk' ? <ShieldAlert className="w-5 h-5 text-red-500" /> : 
                         result.status === 'medium_risk' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> :
                         <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        <h5 className="font-bold text-slate-900 dark:text-slate-100">{result.platform}</h5>
                      </div>
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300">
                        {result.match} Match
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{result.description}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">{result.date}</span>
                      {result.sourceUrl ? (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                          onClick={() => window.open(result.sourceUrl, '_blank', 'noopener,noreferrer')}
                        >
                          View Source ↗
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">No source URL</span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
