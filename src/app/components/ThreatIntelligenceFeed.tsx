import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { ExternalLink, ShieldAlert, Wifi, Clock, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "./ui/button";

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail?: string;
}

export function ThreatIntelligenceFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        // Using rss2json to convert The Hacker News RSS feed to JSON
        const response = await fetch("https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/TheHackersNews");
        if (!response.ok) throw new Error("Failed to fetch feed");
        
        const data = await response.json();
        if (data.status === "ok" && data.items) {
          setItems(data.items.slice(0, 4));
        } else {
          throw new Error("Invalid feed data");
        }
      } catch (err) {
        setError("Could not load threat intelligence feed.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  return (
    <div className="rounded-[28px] border border-slate-200/50 bg-white/40 p-5 shadow-[0_8px_32px_rgba(31,38,135,0.07)] backdrop-blur-3xl dark:border-slate-800/50 dark:bg-slate-950/40 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] sm:p-6 flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-200 dark:shadow-none">
            <Wifi className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Live Threat Feed</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Powered by The Hacker News</p>
          </div>
        </div>
        <div className="flex h-2 w-2 items-center justify-center">
          <span className="absolute inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500"></span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex gap-3 rounded-2xl bg-slate-50/50 p-3 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800">
                <div className="h-16 w-16 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-2 w-1/4 rounded bg-slate-200 dark:bg-slate-800 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShieldAlert className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{error}</p>
          </div>
        ) : (
          items.map((item, index) => (
            <motion.a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group flex gap-3 rounded-2xl border border-slate-200/60 bg-white/60 p-3 transition-all hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/60 dark:hover:border-blue-900/50 dark:hover:bg-blue-900/20"
            >
              {item.thumbnail ? (
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                  <img src={item.thumbnail} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <ShieldAlert className="h-6 w-6" />
                </div>
              )}
              <div className="flex flex-col justify-between min-w-0">
                <h4 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                  {item.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  <Clock className="h-3 w-3" />
                  {new Date(item.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
              </div>
            </motion.a>
          ))
        )}
      </div>
      
      {!loading && !error && (
        <Button 
          variant="ghost" 
          className="mt-4 w-full h-9 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
          onClick={() => window.open('https://thehackernews.com/', '_blank')}
        >
          View all updates <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
