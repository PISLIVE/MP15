// Scan result types for the Digital Footprint Analyzer

export interface SocialResult {
  platform: string;
  username?: string;
  url?: string;
  found: boolean;
  source?: "direct" | "search" | "hybrid";
  profileData?: {
    name?: string;
    bio?: string;
    followers?: number;
    following?: number;
    posts?: number;
    avatar?: string;
    visibilityScore?: "low" | "medium" | "high";
    [key: string]: unknown;
  };
}

export interface BreachResult {
  id?: string;
  platform?: string;
  date?: string;
  severity?: "high" | "medium" | "low";
  dataExposed?: string[];
  recordCount?: number;
  passwordType?: string;
  // XposedOrNot fields
  description?: string;
  domain?: string;
  verified?: boolean;
  source?: "xposedornot" | "leakcheck" | string;
  // Legacy / future fields
  name?: string;
  title?: string;
  breachDate?: string;
  addedDate?: string;
  dataClasses?: string[];
  isVerified?: boolean;
  [key: string]: unknown;
}

export interface GoogleResult {
  id?: string;
  title?: string;
  snippet?: string;
  link?: string;
  displayLink?: string;
  [key: string]: unknown;
}

export interface MentionResult {
  id: string;
  platform: string;
  title: string;
  snippet: string;
  link: string;
  date?: string;
}

export interface RiskScore {
  score: number;
  level: string;
}

export interface ScanInput {
  name?: string;
  email?: string;
  username?: string;
}

export interface WhoisResult {
  domainName: string;
  registrar: string;
  creationDate: string;
  expirationDate: string;
  nameServers: string[];
  registrantCountry: string;
  [key: string]: unknown;
}

export interface ScanData {
  input: ScanInput;
  whoisResults?: WhoisResult | null;
  socialResults: SocialResult[];
  breachResults: BreachResult[];
  googleResults: GoogleResult[];
  mentionResults: MentionResult[];
  riskScore: RiskScore;
}

export interface ScanHistoryItem {
  id: string;
  query: string;
  risk_score: number;
  created_at: string;
  social_results: SocialResult[] | null;
  breach_results: BreachResult[] | null;
  google_results: GoogleResult[] | null;
  mention_results: MentionResult[] | null;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  icon: string;
}

export interface ChartDataPoint {
  date: string;
  posts: number;
  searches: number;
  interactions: number;
}
