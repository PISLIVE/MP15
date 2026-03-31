// Mock scanner that simulates analyzing a profile

interface ScanResult {
  profileInfo: {
    name: string;
    email: string;
    username: string;
    profileUrl: string;
  };
  privacyScore: number;
  onlineAccounts: number;
  dataPoints: number;
  publicVisibility: string;
  weakPasswords: number;
  twoFactorEnabled: string;
  activityData: Array<{
    date: string;
    posts: number;
    searches: number;
    interactions: number;
  }>;
  socialMediaData: Array<{
    platform: string;
    followers: number;
    posts: number;
    engagement: number;
  }>;
  breachData: Array<{
    id: string;
    platform: string;
    date: string;
    severity: "high" | "medium" | "low";
    dataExposed: string[];
  }>;
  recommendationsData: Array<{
    id: string;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    icon: "shield" | "lock" | "eye" | "userx" | "settings" | "alert";
  }>;
}

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
          severity: "high" as const,
          dataExposed: ["Email", "Phone number", "Job title", "Location"],
        },
        {
          id: "2",
          platform: "Facebook Security Incident",
          date: "December 2025",
          severity: "high" as const,
          dataExposed: ["Email", "Phone number", "Friend list"],
        },
        {
          id: "3",
          platform: "Twitter API Breach",
          date: "November 2025",
          severity: "medium" as const,
          dataExposed: ["Email", "Username", "Profile data"],
        },
        {
          id: "4",
          platform: "Forum Database",
          date: "September 2025",
          severity: "low" as const,
          dataExposed: ["Username", "Email"],
        },
      ],
      recommendationsData: [
        {
          id: "1",
          title: "Enable Two-Factor Authentication",
          description: "16 accounts detected without 2FA. Add an extra layer of security immediately.",
          priority: "high" as const,
          icon: "lock" as const,
        },
        {
          id: "2",
          title: "Review Public Profiles",
          description: "Your profiles are visible on 178 websites. Consider restricting access to sensitive information.",
          priority: "high" as const,
          icon: "eye" as const,
        },
        {
          id: "3",
          title: "Change Compromised Passwords",
          description: "3 of your passwords appear in known data breaches. Update them immediately.",
          priority: "high" as const,
          icon: "alert" as const,
        },
        {
          id: "4",
          title: "Update Password Policy",
          description: "9 accounts use weak or repeated passwords. Consider using a password manager.",
          priority: "high" as const,
          icon: "shield" as const,
        },
        {
          id: "5",
          title: "Remove Unused Apps",
          description: "You have 23 third-party apps with access to your data. Revoke unnecessary permissions.",
          priority: "medium" as const,
          icon: "settings" as const,
        },
        {
          id: "6",
          title: "Monitor Data Broker Sites",
          description: "Your information appears on 14 data broker websites. Consider opting out.",
          priority: "medium" as const,
          icon: "userx" as const,
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
          severity: "medium" as const,
          dataExposed: ["Email", "Encrypted password"],
        },
        {
          id: "2",
          platform: "Adobe Security Incident",
          date: "October 2025",
          severity: "low" as const,
          dataExposed: ["Email", "Username"],
        },
      ],
      recommendationsData: [
        {
          id: "1",
          title: "Enable 2FA on Remaining Accounts",
          description: "4 accounts still need two-factor authentication enabled.",
          priority: "high" as const,
          icon: "lock" as const,
        },
        {
          id: "2",
          title: "Update Weak Passwords",
          description: "4 accounts use weak passwords. Strengthen them with a password manager.",
          priority: "medium" as const,
          icon: "shield" as const,
        },
        {
          id: "3",
          title: "Review Privacy Settings",
          description: "Some social media profiles have public settings. Consider making them private.",
          priority: "medium" as const,
          icon: "eye" as const,
        },
        {
          id: "4",
          title: "Remove Old Accounts",
          description: "3 inactive accounts detected. Consider deleting them to reduce exposure.",
          priority: "low" as const,
          icon: "userx" as const,
        },
      ],
    },
  },
];

export async function mockScanProfile(query: string): Promise<ScanResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Determine which profile to return based on query
  let profile = profiles[0]; // default

  if (query.includes("@") && !query.includes("http")) {
    // Email query
    profile = profiles[1];
  } else if (query.includes("twitter") || query.includes("@")) {
    profile = profiles[0];
  }

  return profile.result;
}
