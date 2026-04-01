const axios = require("axios");

// ─── Platform registry ────────────────────────────────────────────────────────
// strategy:
//   "direct"  → HTTP HEAD/GET to the profile URL
//   "search"  → SerpAPI (falls back to direct if no key)
//   "hybrid"  → try direct first, then SerpAPI
const platforms = [
  { name: "Instagram",   url: "https://www.instagram.com/",         domain: "instagram.com",    strategy: "search" },
  { name: "Facebook",    url: "https://www.facebook.com/",          domain: "facebook.com",     strategy: "search" },
  { name: "Threads",     url: "https://www.threads.net/@",          domain: "threads.net",      strategy: "search" },
  { name: "X",           url: "https://x.com/",                    domain: "x.com",            strategy: "direct" },
  { name: "Twitter",     url: "https://twitter.com/",               domain: "twitter.com",      strategy: "direct" },
  { name: "LinkedIn",    url: "https://www.linkedin.com/in/",       domain: "linkedin.com",     strategy: "search" },
  { name: "GitHub",      url: "https://github.com/",               domain: "github.com",       strategy: "direct" },
  { name: "Reddit",      url: "https://www.reddit.com/user/",      domain: "reddit.com",       strategy: "direct" },
  { name: "Pinterest",   url: "https://www.pinterest.com/",        domain: "pinterest.com",    strategy: "hybrid" },
  { name: "YouTube",     url: "https://www.youtube.com/@",         domain: "youtube.com",      strategy: "search" },
  { name: "TikTok",      url: "https://www.tiktok.com/@",          domain: "tiktok.com",       strategy: "search" },
  { name: "Snapchat",    url: "https://www.snapchat.com/add/",     domain: "snapchat.com",     strategy: "search" },
  { name: "Telegram",    url: "https://t.me/",                     domain: "t.me",             strategy: "direct" },
  { name: "Twitch",      url: "https://www.twitch.tv/",            domain: "twitch.tv",        strategy: "direct" },
  { name: "Spotify",     url: "https://open.spotify.com/user/",    domain: "spotify.com",      strategy: "search" },
  { name: "Medium",      url: "https://medium.com/@",              domain: "medium.com",       strategy: "hybrid" },
  { name: "GitLab",      url: "https://gitlab.com/",               domain: "gitlab.com",       strategy: "direct" },
  { name: "Behance",     url: "https://www.behance.net/",          domain: "behance.net",      strategy: "direct" },
  { name: "Dribbble",    url: "https://dribbble.com/",             domain: "dribbble.com",     strategy: "direct" },
  { name: "CodePen",     url: "https://codepen.io/",               domain: "codepen.io",       strategy: "direct" },
  { name: "SoundCloud",  url: "https://soundcloud.com/",           domain: "soundcloud.com",   strategy: "direct" },
  { name: "Vimeo",       url: "https://vimeo.com/",                domain: "vimeo.com",        strategy: "direct" },
  { name: "Keybase",     url: "https://keybase.io/",               domain: "keybase.io",       strategy: "direct" },
  { name: "DevTo",       url: "https://dev.to/",                   domain: "dev.to",           strategy: "direct" },
  { name: "AboutMe",     url: "https://about.me/",                 domain: "about.me",         strategy: "direct" },
  { name: "HackerRank",  url: "https://www.hackerrank.com/",       domain: "hackerrank.com",   strategy: "direct" },
  { name: "Steam",       url: "https://steamcommunity.com/id/",    domain: "steamcommunity.com", strategy: "direct" },
  { name: "Mastodon",    url: "https://mastodon.social/@",         domain: "mastodon.social",  strategy: "direct" },
  { name: "Flickr",      url: "https://www.flickr.com/people/",   domain: "flickr.com",       strategy: "direct" },
  { name: "Gravatar",    url: "https://en.gravatar.com/",          domain: "gravatar.com",     strategy: "direct" },
];

// ─── Patterns that prove a page is a "not found" / error page ─────────────────
// Be SPECIFIC — avoid short strings like "not found" or "404" that appear in
// page navigation on valid profile pages.
const NOT_FOUND_PATTERNS = [
  "this account doesn't exist",
  "this page isn't available",
  "sorry, this page isn't available",
  "the link you followed may be broken",
  "page not found",
  "user not found",
  "profile not found",
  "account not found",
  "this user doesn't exist",
  "no user found",
  "could not find that user",
  "we couldn't find the page",
  "oops! that page doesn't exist",
  "404 - page not found",
  "404 not found",
  "<title>page not found</title>",
  "this profile has been removed",
];

// ─── Login-wall detection (URL patterns) ────────────────────────────────────
const LOGIN_WALL_URL_PATTERNS = [
  "/login",
  "/accounts/login",
  "i/flow/login",           // X / Twitter
  "/auth/login",
  "login.live.com",         // Microsoft-linked
  "/checkout/login",
  "facebook.com/login",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const normalize = (value) => String(value || "").trim().toLowerCase();
const safeHtml  = (data)  => (typeof data === "string" ? data : "");

const isNotFoundPage = (html) => {
  const lower = html.toLowerCase();
  return NOT_FOUND_PATTERNS.some((p) => lower.includes(p));
};

const isLoginWallUrl = (url) => {
  const lower = normalize(url);
  return LOGIN_WALL_URL_PATTERNS.some((p) => lower.includes(p));
};

// ─── Metadata extraction ─────────────────────────────────────────────────────
function extractMetadata(html) {
  const result = {};

  const imageMatch =
    html.match(/property="og:image"\s+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"\s+property="og:image"/i);
  if (imageMatch) result.avatar = imageMatch[1];

  const descMatch =
    html.match(/property="og:description"\s+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"\s+property="og:description"/i) ||
    html.match(/name="description"\s+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"\s+name="description"/i);
  if (descMatch) result.bio = descMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');

  const titleMatch =
    html.match(/property="og:title"\s+content="([^"]+)"/i) ||
    html.match(/content="([^"]+)"\s+property="og:title"/i) ||
    html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) result.name = titleMatch[1].trim();

  return result;
}

function computeVisibilityScore(metadata) {
  let pts = 0;
  if (metadata.avatar) pts += 2;
  if (metadata.bio)    pts += 2;
  if (metadata.name)   pts += 1;
  if (pts >= 4) return "high";
  if (pts >= 2) return "medium";
  return "low";
}

// ─── Build SerpAPI query ─────────────────────────────────────────────────────
const buildSearchQuery = (platform, username, fallback = false) => {
  if (fallback) return `${platform.name} "${username}" profile site`;
  if (platform.name === "LinkedIn")  return `site:linkedin.com/in "${username}"`;
  if (platform.name === "YouTube")   return `site:youtube.com "@${username}"`;
  if (platform.name === "Snapchat")  return `site:snapchat.com/add "${username}"`;
  if (platform.name === "Instagram") return `site:instagram.com "${username}"`;
  if (platform.name === "Facebook")  return `site:facebook.com "${username}"`;
  if (platform.name === "Threads")   return `site:threads.net "@${username}"`;
  if (platform.name === "TikTok")    return `site:tiktok.com "@${username}"`;
  if (platform.name === "Spotify")   return `site:open.spotify.com/user "${username}"`;
  return `site:${platform.domain} "${username}"`;
};

// ─── directCheck ─────────────────────────────────────────────────────────────
// Improved logic:
//  1. Hard 404 → null
//  2. Explicit not-found page content → null
//  3. Redirected to login wall → treat as "soft found" only when the original
//     URL is platform-specific enough (we always know it because we built it)
//  4. 200 OK with any meaningful metadata OR with username in the title → found
//  5. 200 OK on a platform where the URL itself is enough proof → found
const directCheck = async (platform, username) => {
  const profileUrl = `${platform.url}${encodeURIComponent(username)}`;

  try {
    const response = await axios.get(profileUrl, {
      timeout: 12000,
      maxRedirects: 5,
      headers: {
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control":   "no-cache",
      },
      validateStatus: (s) => s < 500, // don't throw on 4xx
    });

    const finalUrl = normalize(response?.request?.res?.responseUrl || profileUrl);
    const html     = safeHtml(response.data);
    const status   = response.status;

    // ── Hard failures ──────────────────────────────────────────────────────
    if (status === 404) return null;
    if (isNotFoundPage(html)) return null;

    // ── Login-wall redirect ────────────────────────────────────────────────
    if (isLoginWallUrl(finalUrl)) {
      // We requested a specific username URL that was valid enough to trigger
      // the login wall → the account likely exists but is protected.
      return {
        platform: platform.name,
        url:      profileUrl,
        found:    true,
        source:   "direct-login-wall",
        profileData: {
          name:            username,
          visibilityScore: "low",
          note:            "Account exists but content requires login",
        },
      };
    }

    // ── 200 OK ─────────────────────────────────────────────────────────────
    if (status === 200) {
      const metadata   = extractMetadata(html);
      const titleLower = normalize(metadata.name || "");
      const userLower  = normalize(username);

      // Strong signal: username appears in page title/og:title
      if (titleLower.includes(userLower)) {
        return {
          platform: platform.name,
          url:      profileUrl,
          found:    true,
          source:   "direct",
          profileData: {
            ...metadata,
            visibilityScore: computeVisibilityScore(metadata),
          },
        };
      }

      // Fallback signal: username appears in the final URL (after redirects)
      if (finalUrl.includes(userLower)) {
        return {
          platform: platform.name,
          url:      profileUrl,
          found:    true,
          source:   "direct",
          profileData: {
            ...metadata,
            visibilityScore: computeVisibilityScore(metadata),
          },
        };
      }

      // Fallback-fallback: rich metadata exists (avatar + bio) at the exact URL we
      // requested — treat as found (profile exists, platform may not echo username
      // back in URL, e.g. Steam vanity URLs, Gravatar, AboutMe).
      if (metadata.avatar && metadata.bio) {
        return {
          platform: platform.name,
          url:      profileUrl,
          found:    true,
          source:   "direct-metadata",
          profileData: {
            ...metadata,
            visibilityScore: computeVisibilityScore(metadata),
          },
        };
      }

      // 200 but no useful signals → treat as not found (generic homepage redirect)
      return null;
    }

    // ── 3xx without login wall already handled above (maxRedirects follows) ──
    return null;
  } catch {
    return null;
  }
};

// ─── SerpAPI fallback ─────────────────────────────────────────────────────────
const serpApiFallback = async (platform, username) => {
  // No SerpAPI key → use direct check as best-effort
  if (!process.env.SERPAPI_KEY) return directCheck(platform, username);

  const trySearch = async (query) => {
    try {
      const response = await axios.get("https://serpapi.com/search.json", {
        params: {
          engine:  "google",
          q:       query,
          api_key: process.env.SERPAPI_KEY,
          num:     5,
          safe:    "active",
        },
        timeout: 10000,
      });
      return response.data?.organic_results || [];
    } catch {
      return [];
    }
  };

  // Primary: precise site-scoped query
  let results = await trySearch(buildSearchQuery(platform, username));

  // Secondary: broader query
  if (results.length === 0) {
    results = await trySearch(buildSearchQuery(platform, username, true));
  }

  // Find a result that links to the platform domain AND mentions the username
  const userLower = normalize(username);
  const match = results.find((item) => {
    const link    = normalize(item.link  || "");
    const snippet = normalize(item.snippet || "");
    const title   = normalize(item.title  || "");
    return (
      link.includes(platform.domain) &&
      (link.includes(userLower) || snippet.includes(userLower) || title.includes(userLower))
    );
  });

  if (!match) return null;

  const metadata = {
    name:   match.title,
    bio:    match.snippet,
    avatar: match.thumbnail || null,
  };

  return {
    platform: platform.name,
    url:      match.link,
    found:    true,
    source:   "search",
    profileData: {
      ...metadata,
      visibilityScore: computeVisibilityScore(metadata),
    },
  };
};

// ─── Platform dispatcher ──────────────────────────────────────────────────────
const checkPlatform = async (platform, username) => {
  if (platform.strategy === "direct")  return directCheck(platform, username);
  if (platform.strategy === "search")  return serpApiFallback(platform, username);

  // hybrid: try direct first, fall back to SerpAPI
  const direct = await directCheck(platform, username);
  if (direct) return direct;
  return serpApiFallback(platform, username);
};

// ─── De-duplication ───────────────────────────────────────────────────────────
const deduplicateResults = (results) => {
  const seen = new Set();
  return results.filter((item) => {
    const key = `${item.platform}|${normalize(item.url)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

// ─── Main export ─────────────────────────────────────────────────────────────
const socialScanner = async (username) => {
  if (!username) return [];
  const cleanUsername = normalize(username);
  if (!cleanUsername) return [];

  const results = await Promise.all(
    platforms.map((p) => checkPlatform(p, cleanUsername))
  );

  return deduplicateResults(results.filter(Boolean));
};

module.exports = socialScanner;