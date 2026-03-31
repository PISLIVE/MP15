import { Card } from "./ui/card";
import { motion } from "motion/react";
import { 
  MessageSquare, 
  Share2, 
  ExternalLink, 
  Clock, 
  ShieldAlert,
  Hash,
  Activity,
  ArrowRight
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { MentionResult } from "../types/scan";

interface SocialMentionsProps {
  mentions: MentionResult[];
}

function getPlatformColor(platform: string) {
  const p = platform.toLowerCase();
  if (p.includes("reddit")) return "bg-orange-500/10 text-orange-600 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900";
  if (p.includes("x") || p.includes("twitter")) return "bg-slate-900/10 text-slate-900 border-slate-200 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700";
  if (p.includes("facebook")) return "bg-blue-600/10 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900";
  if (p.includes("instagram")) return "bg-pink-600/10 text-pink-600 border-pink-200 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900";
  return "bg-indigo-600/10 text-indigo-600 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900";
}

export function SocialMentions({ mentions }: SocialMentionsProps) {
  const safeMentions = Array.isArray(mentions) ? mentions : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.2 }}
    >
      <Card className="rounded-[28px] border border-slate-200/70 bg-white/80 dark:bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl sm:p-6 dark:border-slate-800">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-600 dark:text-orange-400">
              Activity Tracking
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 italic">
              Social Mentions
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Public posts and comments referencing this identity across social networks
            </p>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 dark:border-slate-900 dark:bg-slate-800 flex items-center justify-center">
                    <Activity className="h-3 w-3 text-slate-400" />
                  </div>
                ))}
             </div>
             <Badge variant="outline" className="rounded-full bg-orange-50 text-orange-600 border-orange-200 px-3 py-1 font-bold">
               {safeMentions.length} Detected
             </Badge>
          </div>
        </div>

        {safeMentions.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-950 shadow-sm">
              <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-700" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              No recent social mentions
            </h4>
            <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
              Our scan found no recent public posts or comments mentioning this name or handle.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {safeMentions.map((mention, index) => (
              <motion.div
                key={mention.id || index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
                className="group relative flex flex-col sm:flex-row sm:items-start gap-4 rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50"
              >
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-bold text-xs ${getPlatformColor(mention.platform)}`}>
                  {mention.platform[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{mention.platform}</span>
                       <span className="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
                       <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                         <Clock className="h-3 w-3" /> {mention.date || "Just now"}
                       </span>
                    </div>
                  </div>

                  <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {mention.title}
                  </h5>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                    "{mention.snippet}"
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-3 text-[10px] font-bold uppercase text-slate-500 hover:text-orange-600 dark:hover:text-orange-400"
                      onClick={() => window.open(mention.link, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1.5" />
                      View Post
                    </Button>
                    
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                       <Hash className="h-3 w-3" /> mention_detected
                    </div>
                  </div>
                </div>
                
                <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                   <ArrowRight className="h-4 w-4 text-slate-200" />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-8 flex items-center gap-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 p-4 border border-slate-100 dark:border-slate-800">
          <ShieldAlert className="h-5 w-5 text-slate-400 shrink-0" />
          <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-600 font-medium">
            <span className="font-bold text-slate-700 dark:text-slate-400">Context Warning:</span> Mentions are gathered from publicly indexed content. Not all mentions necessarily belong to the target individual.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}
