const axios = require("axios");

const platforms = [
  { name: "Instagram", url: "https://www.instagram.com/", domain: "instagram.com", strategy: "hybrid" },
  { name: "Facebook", url: "https://www.facebook.com/", domain: "facebook.com", strategy: "search" },
  { name: "Threads", url: "https://www.threads.net/@", domain: "threads.net", strategy: "search" },
  { name: "X", url: "https://x.com/", domain: "x.com", strategy: "hybrid" },
  { name: "Twitter", url: "https://twitter.com/", domain: "twitter.com", strategy: "hybrid" },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/", domain: "linkedin.com", strategy: "search" },
  { name: "GitHub", url: "https://github.com/", domain: "github.com", strategy: "direct" },
  { name: "Reddit", url: "https://www.reddit.com/user/", domain: "reddit.com", strategy: "direct" },
  { name: "Pinterest", url: "https://www.pinterest.com/", domain: "pinterest.com", strategy: "hybrid" },
  { name: "YouTube", url: "https://www.youtube.com/@", domain: "youtube.com", strategy: "search" },
  { name: "TikTok", url: "https://www.tiktok.com/@", domain: "tiktok.com", strategy: "search" },
  { name: "Snapchat", url: "https://www.snapchat.com/add/", domain: "snapchat.com", strategy: "search" },
  { name: "Telegram", url: "https://t.me/", domain: "t.me", strategy: "direct" },
  { name: "Twitch", url: "https://www.twitch.tv/", domain: "twitch.tv", strategy: "search" },
  { name: "Spotify", url: "https://open.spotify.com/user/", domain: "spotify.com", strategy: "search" },
  { name: "Medium", url: "https://medium.com/@", domain: "medium.com", strategy: "hybrid" },
  { name: "GitLab", url: "https://gitlab.com/", domain: "gitlab.com", strategy: "direct" },
  { name: "Behance", url: "https://www.behance.net/", domain: "behance.net", strategy: "hybrid" },
  { name: "Dribbble", url: "https://dribbble.com/", domain: "dribbble.com", strategy: "hybrid" },
  { name: "CodePen", url: "https://codepen.io/", domain: "codepen.io", strategy: "direct" },
  { name: "SoundCloud", url: "https://soundcloud.com/", domain: "soundcloud.com", strategy: "hybrid" },
  { name: "Vimeo", url: "https://vimeo.com/", domain: "vimeo.com", strategy: "search" },
  { name: "Keybase", url: "https://keybase.io/", domain: "keybase.io", strategy: "direct" },
  { name: "DevTo", url: "https://dev.to/", domain: "dev.to", strategy: "direct" },
  { name: "AboutMe", url: "https://about.me/", domain: "about.me", strategy: "hybrid" },
  { name: "HackerRank", url: "https://www.hackerrank.com/", domain: "hackerrank.com", strategy: "direct" },
];

const negativePatterns = [
  "page not found", "user not found", "profile not found",
  "this account doesn't exist", "sorry, this page isn't available",
  "could not find that page", "not found", "404",
  "profile isn't available", "account not found",
  "link may be broken", "removed the profile"
];

const normalize = (value) => String(value || "").trim().toLowerCase();
const safeHtml = (data) => (typeof data === "string" ? data : "");
const isNegativePage = (html) => negativePatterns.some((pattern) => html.toLowerCase().includes(pattern));

// Helper to extract metadata from HTML using regular expressions
function extractMetadata(html) {
  const result = {};
  
  // Extract og:image
  const imageMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);
  if (imageMatch) result.avatar = imageMatch[1];
  
  // Extract og:description
  const descMatch = html.match(/property="og:description"\s+content="([^"]+)"/i) || 
                    html.match(/name="description"\s+content="([^"]+)"/i);
  if (descMatch) result.bio = descMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  
  // Extract og:title or generic title
  const titleMatch = html.match(/property="og:title"\s+content="([^"]+)"/i) || 
                     html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) result.name = titleMatch[1].trim();

  return result;
}

// Estimate visibility risk level based on how much data is found
function computeVisibilityScore(metadata) {
  let scorePoints = 0;
  if (metadata.avatar) scorePoints += 2;
  if (metadata.bio) scorePoints += 2;
  if (metadata.name) scorePoints += 1;
  
  if (scorePoints >= 4) return "high";
  if (scorePoints >= 2) return "medium";
  return "low";
}

const buildSearchQuery = (platform, username, fallback = false) => {
  if (fallback) {
    return `${platform.name} "${username}" profile`;
  }

  if (platform.name === "LinkedIn") return `site:linkedin.com/in "${username}"`;
  if (platform.name === "YouTube") return `site:youtube.com "${username}"`;
  if (platform.name === "Snapchat") return `site:snapchat.com/add "${username}"`;
  if (platform.name === "Instagram") return `instagram.com/${username}`;
  return `site:${platform.domain} "${username}"`;
};

const directCheck = async (platform, username) => {
  const profileUrl = platform.url + encodeURIComponent(username);

  try {
    const response = await axios.get(profileUrl, {
      timeout: 8000,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" }
    });

    const finalUrl = normalize(response?.request?.res?.responseUrl || profileUrl);
    const html = safeHtml(response.data);
    
    // Check if we hit a login wall (common for Instagram/X/FB)
    const isLoginWall = finalUrl.includes("/login") || finalUrl.includes("/accounts/login");
    const hasUsernameInUrl = finalUrl.includes(username);
    const hasNegativePattern = isNegativePage(html);

    // If it's a login wall but the URL targets the username, it's a "soft" find
    if (isLoginWall && hasUsernameInUrl) {
      return {
        platform: platform.name,
        url: profileUrl,
        found: true,
        source: "direct-redirect",
        profileData: {
          name: `${username}`,
          visibilityScore: "low",
          note: "Profile exists but content is restricted"
        }
      };
    }

    if (response.status !== 200 || !hasUsernameInUrl || hasNegativePattern) return null;

    const metadata = extractMetadata(html);
    
    return {
      platform: platform.name,
      url: profileUrl,
      found: true,
      source: "direct",
      profileData: {
        ...metadata,
        visibilityScore: computeVisibilityScore(metadata)
      }
    };
  } catch {
    return null;
  }
};

const serpApiFallback = async (platform, username) => {
  if (!process.env.SERPAPI_KEY) return null;

  const trySearch = async (query) => {
    try {
      const response = await axios.get("https://serpapi.com/search.json", {
        params: { engine: "google", q: query, api_key: process.env.SERPAPI_KEY, num: 3, safe: "active" },
        timeout: 10000
      });
      return response.data?.organic_results || [];
    } catch {
      return [];
    }
  };

  // Primary search: exact site match
  let organicResults = await trySearch(buildSearchQuery(platform, username));
  
  // Secondary search: broader query if nothing found
  if (organicResults.length === 0) {
    organicResults = await trySearch(buildSearchQuery(platform, username, true));
  }

  const match = organicResults.find((item) => normalize(item.link).includes(platform.domain));

  if (!match) return null;

  const metadata = {
    name: match.title,
    bio: match.snippet,
    avatar: match.thumbnail || null
  };

  return {
    platform: platform.name,
    url: match.link,
    found: true,
    source: "search",
    profileData: {
      ...metadata,
      visibilityScore: computeVisibilityScore(metadata)
    }
  };
};

const checkPlatform = async (platform, username) => {
  if (platform.strategy === "direct") return await directCheck(platform, username);
  if (platform.strategy === "search") return await serpApiFallback(platform, username);

  const directResult = await directCheck(platform, username);
  if (directResult) return directResult;

  return await serpApiFallback(platform, username);
};

const deduplicateResults = (results) => {
  const seen = new Set();
  return results.filter((item) => {
    const key = `${item.platform}|${normalize(item.url)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const socialScanner = async (username) => {
  if (!username) return [];
  const cleanUsername = normalize(username);
  if (!cleanUsername) return [];

  const checks = platforms.map((platform) => checkPlatform(platform, cleanUsername));
  const results = await Promise.all(checks);
  return deduplicateResults(results.filter(Boolean));
};

module.exports = socialScanner;