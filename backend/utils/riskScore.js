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
  googleResults = []
}) => {
  let score = 0;

  const safeSocialResults = Array.isArray(socialResults) ? socialResults : [];
  const safeBreachResults = Array.isArray(breachResults) ? breachResults : [];
  const safeGoogleResults = Array.isArray(googleResults) ? googleResults : [];

  const foundSocialProfiles = safeSocialResults.filter(
    (profile) => profile?.found === true
  );

  let socialScore = 0;

  for (const profile of foundSocialProfiles) {
    const platform = profile?.platform || "";
    const source = profile?.source || "direct";

    let platformWeight = 6;

    if (HIGH_EXPOSURE_PLATFORMS.includes(platform)) {
      platformWeight = 12;
    } else if (MEDIUM_EXPOSURE_PLATFORMS.includes(platform)) {
      platformWeight = 8;
    } else if (LOW_EXPOSURE_PLATFORMS.includes(platform)) {
      platformWeight = 5;
    }

    const sourceWeight = source === "direct" ? 1.0 : 0.7;
    socialScore += platformWeight * sourceWeight;
  }

  let breachScore = 0;

  for (const breach of safeBreachResults) {
    const exposedFields = Array.isArray(breach?.dataExposed)
      ? breach.dataExposed.length
      : 0;

    let severityWeight = 18;

    if (exposedFields >= 5) {
      severityWeight = 30;
    } else if (exposedFields >= 3) {
      severityWeight = 24;
    }

    breachScore += severityWeight;
  }

  let googleScore = 0;

  const usefulGoogleResults = safeGoogleResults.filter(
    (item) =>
      item &&
      typeof item.title === "string" &&
      typeof item.link === "string"
  );

  googleScore = Math.min(usefulGoogleResults.length * 4, 20);

  score = socialScore + breachScore + googleScore;
  score = Math.min(Math.round(score), 100);

  let level = "Low";
  if (score >= 70) {
    level = "High";
  } else if (score >= 40) {
    level = "Medium";
  }

  return {
    score,
    level,
    breakdown: {
      social: foundSocialProfiles.length,
      breaches: safeBreachResults.length,
      mentions: usefulGoogleResults.length,
      socialScore: Math.round(socialScore),
      breachScore: Math.round(breachScore),
      googleScore: Math.round(googleScore)
    }
  };
};

module.exports = calculateRiskScore;