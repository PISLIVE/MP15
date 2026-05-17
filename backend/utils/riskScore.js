const HIGH_EXPOSURE_PLATFORMS = [
  "Instagram",
  "Facebook",
  "X",
  "Twitter",
  "LinkedIn",
  "Threads",
  "Snapchat",
  "Pinterest",
  "YouTube",
  "Telegram",
  "ShareChat",
  "Moj",
  "Josh"
];

const MEDIUM_EXPOSURE_PLATFORMS = [
  "Reddit",
  "Medium",
  "Behance",
  "Dribbble",
  "SoundCloud",
  "Vimeo",
  "AboutMe"
];

const LOW_EXPOSURE_PLATFORMS = [
  "GitHub",
  "GitLab",
  "Keybase",
  "DevTo",
  "HackerRank"
];

const calculateRiskScore = ({
  socialResults = [],
  breachResults = [],
  googleResults = [],
  emailResults = null
}) => {
  const safeSocialResults = Array.isArray(socialResults) ? socialResults : [];
  const safeBreachResults = Array.isArray(breachResults) ? breachResults : [];
  const safeGoogleResults = Array.isArray(googleResults) ? googleResults : [];

  const foundSocialProfiles = safeSocialResults.filter(
    (profile) => profile?.found === true
  );

  // ─── Category 1: Account Exposure (0-100, weight 25%) ─────────────────────
  let accountRaw = 0;
  for (const profile of foundSocialProfiles) {
    const platform = profile?.platform || "";
    const source = profile?.source || "direct";
    let platformWeight = 6;
    if (HIGH_EXPOSURE_PLATFORMS.includes(platform)) platformWeight = 12;
    else if (MEDIUM_EXPOSURE_PLATFORMS.includes(platform)) platformWeight = 8;
    else if (LOW_EXPOSURE_PLATFORMS.includes(platform)) platformWeight = 5;
    const sourceWeight = source === "direct" ? 1.0 : 0.7;
    accountRaw += platformWeight * sourceWeight;
  }
  const accountScore = Math.min(Math.round(accountRaw), 100);

  // ─── Category 2: Breach Severity (0-100, weight 30%) ──────────────────────
  let breachRaw = 0;
  let hasHighSeverity = false;
  let hasPasswordLeak = false;
  for (const breach of safeBreachResults) {
    const exposedFields = Array.isArray(breach?.dataExposed) ? breach.dataExposed : [];
    const fieldCount = exposedFields.length;
    let severityWeight = 18;
    if (fieldCount >= 5) severityWeight = 30;
    else if (fieldCount >= 3) severityWeight = 24;
    breachRaw += severityWeight;
    if (breach?.severity === "high") hasHighSeverity = true;
    if (exposedFields.some(f => f?.toLowerCase()?.includes("password"))) hasPasswordLeak = true;
  }
  const breachScore = Math.min(Math.round(breachRaw), 100);

  // ─── Category 3: Search Visibility (0-100, weight 15%) ────────────────────
  const usefulGoogleResults = safeGoogleResults.filter(
    (item) => item && typeof item.title === "string" && typeof item.link === "string"
  );
  const searchScore = Math.min(usefulGoogleResults.length * 10, 100);

  // ─── Category 4: Email Exposure (0-100, weight 20%) ───────────────────────
  let emailScore = 0;
  if (emailResults) {
    // Gravatar profile found
    if (emailResults.gravatar?.hasProfile) emailScore += 25;
    // Holehe registrations
    const holeheData = emailResults.holehe || {};
    const registeredCount = Object.values(holeheData).filter(v => v && v.exists).length;
    emailScore += Math.min(registeredCount * 8, 50);
    // Deliverability
    if (emailResults.deliverability?.canReceive) emailScore += 15;
    // Gravatar accounts
    if (emailResults.gravatar?.accounts?.length > 0) emailScore += 10;
  }
  emailScore = Math.min(emailScore, 100);

  // ─── Category 5: Overall Assessment (weighted combination) ────────────────
  const weightedScore = Math.round(
    (accountScore * 0.25) +
    (breachScore * 0.30) +
    (searchScore * 0.15) +
    (emailScore * 0.20) +
    // Bonus penalty for critical findings
    (hasPasswordLeak ? 10 : 0)
  );
  const score = Math.min(weightedScore, 100);

  let level = "Low";
  if (score >= 70) level = "Critical";
  else if (score >= 50) level = "High";
  else if (score >= 25) level = "Medium";

  return {
    score,
    level,
    breakdown: {
      social: foundSocialProfiles.length,
      breaches: safeBreachResults.length,
      mentions: usefulGoogleResults.length,
      socialScore: accountScore,
      breachScore: breachScore,
      googleScore: searchScore,
      emailScore: emailScore,
      hasPasswordLeak,
      hasHighSeverity,
      categories: [
        {
          name: "Account Exposure",
          score: accountScore,
          level: accountScore >= 70 ? "Critical" : accountScore >= 40 ? "High" : accountScore >= 15 ? "Medium" : "Low",
          detail: `${foundSocialProfiles.length} profile${foundSocialProfiles.length !== 1 ? "s" : ""} found across social platforms`
        },
        {
          name: "Breach Severity",
          score: breachScore,
          level: breachScore >= 70 ? "Critical" : breachScore >= 40 ? "High" : breachScore >= 15 ? "Medium" : "Low",
          detail: safeBreachResults.length > 0
            ? `${safeBreachResults.length} breach${safeBreachResults.length !== 1 ? "es" : ""} detected${hasPasswordLeak ? " — passwords exposed!" : ""}`
            : "No breaches found"
        },
        {
          name: "Search Visibility",
          score: searchScore,
          level: searchScore >= 70 ? "Critical" : searchScore >= 40 ? "High" : searchScore >= 15 ? "Medium" : "Low",
          detail: `${usefulGoogleResults.length} public mention${usefulGoogleResults.length !== 1 ? "s" : ""} found in search results`
        },
        {
          name: "Email Exposure",
          score: emailScore,
          level: emailScore >= 70 ? "Critical" : emailScore >= 40 ? "High" : emailScore >= 15 ? "Medium" : "Low",
          detail: emailResults ? `Email verified on multiple platforms` : "No email data available"
        }
      ]
    }
  };
};

module.exports = calculateRiskScore;