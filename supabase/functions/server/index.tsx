import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-ID"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ── Mock Scanning Logic (Moved from Frontend) ───────────────────────────────
const profiles = [
  {
    query: "twitter",
    result: {
      profileInfo: {
        name: "Sarah Mitchell",
        email: "sarah.mitchell@email.com",
        username: "@sarahmitchell",
        profileUrl: "https://twitter.com/sarahmitchell",
      },
      privacyScore: 58,
      onlineAccounts: 28,
      dataPoints: 1243,
      publicVisibility: "Very High",
      weakPasswords: 9,
      twoFactorEnabled: "43%",
      activityData: [
        { date: "Jan", posts: 18, searches: 62, interactions: 124 },
        { date: "Feb", posts: 24, searches: 71, interactions: 142 },
        { date: "Mar", posts: 21, searches: 58, interactions: 118 },
        { date: "Apr", posts: 29, searches: 84, interactions: 156 },
        { date: "May", posts: 35, searches: 92, interactions: 178 },
        { date: "Jun", posts: 31, searches: 88, interactions: 165 },
      ],
      socialMediaData: [
        { platform: "Twitter", followers: 2840, posts: 567, engagement: 6.8 },
        { platform: "LinkedIn", followers: 1420, posts: 234, engagement: 8.2 },
        { platform: "Instagram", followers: 4230, posts: 892, engagement: 7.4 },
        { platform: "Facebook", followers: 2156, posts: 445, engagement: 4.9 },
        { platform: "TikTok", followers: 5670, posts: 789, engagement: 9.1 },
      ],
      breachData: [
        {
          id: "1",
          platform: "LinkedIn Data Leak",
          date: "February 2026",
          severity: "high",
          dataExposed: ["Email", "Phone number", "Job title", "Location"],
        },
        {
          id: "2",
          platform: "Facebook Security Incident",
          date: "December 2025",
          severity: "high",
          dataExposed: ["Email", "Phone number", "Friend list"],
        },
        {
          id: "3",
          platform: "Twitter API Breach",
          date: "November 2025",
          severity: "medium",
          dataExposed: ["Email", "Username", "Profile data"],
        },
        {
          id: "4",
          platform: "Forum Database",
          date: "September 2025",
          severity: "low",
          dataExposed: ["Username", "Email"],
        },
      ],
      recommendationsData: [
        {
          id: "1",
          title: "Enable Two-Factor Authentication",
          description: "16 accounts detected without 2FA. Add an extra layer of security immediately.",
          priority: "high",
          icon: "lock",
        },
        {
          id: "2",
          title: "Review Public Profiles",
          description: "Your profiles are visible on 178 websites. Consider restricting access to sensitive information.",
          priority: "high",
          icon: "eye",
        },
        {
          id: "3",
          title: "Change Compromised Passwords",
          description: "3 of your passwords appear in known data breaches. Update them immediately.",
          priority: "high",
          icon: "alert",
        },
        {
          id: "4",
          title: "Update Password Policy",
          description: "9 accounts use weak or repeated passwords. Consider using a password manager.",
          priority: "high",
          icon: "shield",
        },
      ],
    },
  },
  {
    query: "email",
    result: {
      profileInfo: {
        name: "Alex Thompson",
        email: "alex.thompson@email.com",
        username: "alexthompson",
        profileUrl: "N/A",
      },
      privacyScore: 72,
      onlineAccounts: 15,
      dataPoints: 542,
      publicVisibility: "Moderate",
      weakPasswords: 4,
      twoFactorEnabled: "73%",
      activityData: [
        { date: "Jan", posts: 8, searches: 32, interactions: 65 },
        { date: "Feb", posts: 12, searches: 41, interactions: 78 },
        { date: "Mar", posts: 10, searches: 38, interactions: 72 },
        { date: "Apr", posts: 15, searches: 48, interactions: 89 },
        { date: "May", posts: 18, searches: 55, interactions: 102 },
        { date: "Jun", posts: 16, searches: 52, interactions: 95 },
      ],
      socialMediaData: [
        { platform: "Twitter", followers: 856, posts: 178, engagement: 5.2 },
        { platform: "LinkedIn", followers: 1240, posts: 289, engagement: 7.8 },
        { platform: "Instagram", followers: 1450, posts: 312, engagement: 6.1 },
        { platform: "GitHub", followers: 432, posts: 567, engagement: 8.9 },
      ],
      breachData: [
        {
          id: "1",
          platform: "Dropbox Data Breach",
          date: "January 2026",
          severity: "medium",
          dataExposed: ["Email", "Encrypted password"],
        },
        {
          id: "2",
          platform: "Adobe Security Incident",
          date: "October 2025",
          severity: "low",
          dataExposed: ["Email", "Username"],
        },
      ],
      recommendationsData: [
        {
          id: "1",
          title: "Enable 2FA on Remaining Accounts",
          description: "4 accounts still need two-factor authentication enabled.",
          priority: "high",
          icon: "lock",
        },
        {
          id: "2",
          title: "Update Weak Passwords",
          description: "4 accounts use weak passwords. Strengthen them with a password manager.",
          priority: "medium",
          icon: "shield",
        },
      ],
    },
  },
];

// ── Endpoints ────────────────────────────────────────────────────────────────

// Health check
app.get("/make-server-c52f06ae/health", (c: { json: (arg0: { status: string; }) => any; }) => {
  return c.json({ status: "ok" });
});

// GET Scan History
app.get("/make-server-c52f06ae/scan/history", async (c: { req: { header: (arg0: string) => string; }; json: (arg0: any[], arg1: number | undefined) => any; }) => {
  const userId = c.req.header("X-User-ID") || "anonymous";
  try {
    const history = await kv.getByPrefix(`scan_history:${userId}:`);
    // Sort by timestamp (descending)
    const sortedHistory = history.sort((a: any, b: any) => 
      new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime()
    );
    return c.json(sortedHistory);
  } catch (err) {
    console.error("Error fetching history:", err);
    return c.json([], 500);
  }
});

// POST Scan Profile
app.post("/make-server-c52f06ae/scan", async (c: { req: { header: (arg0: string) => string; json: () => PromiseLike<{ query: any; }> | { query: any; }; }; json: (arg0: { error?: string; id?: string; scannedAt?: string; query?: any; profileInfo?: { name: string; email: string; username: string; profileUrl: string; }; privacyScore?: number; onlineAccounts?: number; dataPoints?: number; publicVisibility?: string; weakPasswords?: number; twoFactorEnabled?: string; activityData?: { date: string; posts: number; searches: number; interactions: number; }[]; socialMediaData?: { platform: string; followers: number; posts: number; engagement: number; }[]; breachData?: { id: string; platform: string; date: string; severity: string; dataExposed: string[]; }[]; recommendationsData?: { id: string; title: string; description: string; priority: string; icon: string; }[]; }, arg1: number | undefined) => any; }) => {
  const userId = c.req.header("X-User-ID") || "anonymous";
  const { query } = await c.req.json();

  if (!query) {
    return c.json({ error: "Query is required" }, 400);
  }

  // Simulate scanning logic
  let profile = profiles[0]; // default
  if (query.includes("@") && !query.includes("http")) {
    profile = profiles[1];
  } else if (query.includes("twitter") || query.includes("@")) {
    profile = profiles[0];
  }

  const result = {
    ...profile.result,
    id: `scan_${Date.now()}`,
    scannedAt: new Date().toISOString(),
    query,
  };

  // Save to history
  try {
    await kv.set(`scan_history:${userId}:${result.id}`, result);
  } catch (err) {
    console.error("Error saving history:", err);
  }

  return c.json(result);
});

// GET Monitored Profiles
app.get("/make-server-c52f06ae/monitor", async (c) => {
  const userId = c.req.header("X-User-ID") || "anonymous";
  try {
    const monitored = await kv.getByPrefix(`monitored:${userId}:`);
    return c.json(monitored);
  } catch (err) {
    console.error("Error fetching monitored:", err);
    return c.json([], 500);
  }
});

// POST Toggle Monitor
app.post("/make-server-c52f06ae/monitor/toggle", async (c) => {
  const userId = c.req.header("X-User-ID") || "anonymous";
  const { query, profileInfo } = await c.req.json();

  if (!query) return c.json({ error: "Query is required" }, 400);

  const key = `monitored:${userId}:${query}`;
  try {
    const existing = await kv.get(key);
    if (existing) {
      await kv.del(key);
      return c.json({ monitored: false });
    } else {
      await kv.set(key, { query, profileInfo, monitoredAt: new Date().toISOString() });
      return c.json({ monitored: true });
    }
  } catch (err) {
    console.error("Error toggling monitor:", err);
    return c.json({ error: "Failed to toggle monitor" }, 500);
  }
});

Deno.serve(app.fetch);
