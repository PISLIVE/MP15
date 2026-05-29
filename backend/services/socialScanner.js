const axios = require("axios");

// Flag to stop calling Google Search during a single scan if quota is hit
let isSearchQuotaExhausted = false;


// ─── Platform registry ────────────────────────────────────────────────────────
// strategy:
//   "instagram-api" → dedicated Instagram JSON endpoint
//   "direct"        → reliable HTTP HEAD/GET check
//   "skip"          → cannot be reliably checked without a paid API (no SerpAPI = skip)
const platforms = [
  // ── High Priority (Popular) ────────────────────────────────────────────────
  { name: "Instagram", url: "https://www.instagram.com/", domain: "instagram.com", strategy: "instagram-api" },
  { name: "GitHub", url: "https://github.com/", domain: "github.com", strategy: "direct" },
  { name: "Reddit", url: "https://www.reddit.com/user/", domain: "reddit.com", strategy: "direct" },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/", domain: "linkedin.com", strategy: "search" },
  { name: "X", url: "https://x.com/", domain: "x.com", strategy: "search" },
  { name: "Twitter", url: "https://twitter.com/", domain: "twitter.com", strategy: "search" },
  { name: "YouTube", url: "https://www.youtube.com/@", domain: "youtube.com", strategy: "direct" },
  { name: "Facebook", url: "https://www.facebook.com/", domain: "facebook.com", strategy: "facebook" },
  { name: "TikTok", url: "https://www.tiktok.com/@", domain: "tiktok.com", strategy: "tiktok" },
  { name: "Telegram", url: "https://t.me/", domain: "t.me", strategy: "telegram" },
  { name: "Snapchat", url: "https://www.snapchat.com/add/", domain: "snapchat.com", strategy: "snapchat" },
  { name: "Threads", url: "https://www.threads.net/@", domain: "threads.net", strategy: "threads" },
  { name: "Spotify", url: "https://open.spotify.com/user/", domain: "spotify.com", strategy: "search" },
  { name: "Pinterest", url: "https://www.pinterest.com/", domain: "pinterest.com", strategy: "direct" },
  { name: "Twitch", url: "https://www.twitch.tv/", domain: "twitch.tv", strategy: "direct" },
  { name: "Medium", url: "https://medium.com/@", domain: "medium.com", strategy: "direct" },
  
  // ── Standard Priority ──────────────────────────────────────────────────────
  { name: "GitLab", url: "https://gitlab.com/", domain: "gitlab.com", strategy: "direct" },
  { name: "SoundCloud", url: "https://soundcloud.com/", domain: "soundcloud.com", strategy: "direct" },
  { name: "Vimeo", url: "https://vimeo.com/", domain: "vimeo.com", strategy: "direct" },
  { name: "Keybase", url: "https://keybase.io/", domain: "keybase.io", strategy: "direct" },
  { name: "DevTo", url: "https://dev.to/", domain: "dev.to", strategy: "direct" },
  { name: "CodePen", url: "https://codepen.io/", domain: "codepen.io", strategy: "direct" },
  { name: "HackerRank", url: "https://www.hackerrank.com/", domain: "hackerrank.com", strategy: "direct" },
  { name: "Behance", url: "https://www.behance.net/", domain: "behance.net", strategy: "direct" },
  { name: "Dribbble", url: "https://dribbble.com/", domain: "dribbble.com", strategy: "direct" },
  { name: "Steam", url: "https://steamcommunity.com/id/", domain: "steamcommunity.com", strategy: "direct" },
  { name: "Mastodon", url: "https://mastodon.social/@", domain: "mastodon.social", strategy: "direct" },
  { name: "Gravatar", url: "https://en.gravatar.com/", domain: "gravatar.com", strategy: "direct" },
  { name: "AboutMe", url: "https://about.me/", domain: "about.me", strategy: "direct" },
];

// ─── Patterns that prove a page is a "not found" / error page ─────────────────
// Be SPECIFIC — avoid short strings like "not found" or "404" that appear in
// page navigation on valid profile pages.
const NOT_FOUND_PATTERNS = [
  // Generic
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
  // Reddit
  "nobody on reddit goes by that name",
  "sorry, nobody on reddit goes by that name",
  // GitHub
  "not found · github",
  // Twitch
  "sorry. unless you've got a time machine",
  "this channel does not exist",
  // Steam
  "the specified profile could not be found",
  "error: no such user",
  // Dev.to
  "uhoh page not found",
  // HackerRank
  "the page you are looking for doesn't exist",
  // GitLab
  "page not found · gitlab",
  // Dribbble
  "the page you were looking for doesn't exist",
  // Keybase
  "user not found",
  // Telegram (generic homepage redirect text)
  "a new era of messaging",
  // CodePen
  "we can't find that page",
  // Gravatar
  "gravatar profile not found",
  // About.me
  "this page doesn't exist",
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
const safeHtml = (data) => (typeof data === "string" ? data : "");

const isNotFoundPage = (html) => {
  const lower = html.toLowerCase();
  return NOT_FOUND_PATTERNS.some((p) => lower.includes(p));
};

const isLoginWallUrl = (url) => {
  const lower = normalize(url);
  return LOGIN_WALL_URL_PATTERNS.some((p) => lower.includes(p));
};

// Returns a version of the string with all non-alphanumeric characters removed
const stripSpecials = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Check if username (fuzzy) exists in source text
const fuzzyContains = (source, username) => {
  const s = stripSpecials(source);
  const u = stripSpecials(username);
  return u.length > 0 && s.includes(u);
};

// Check if expectedName matches the scraped name or bio
const nameMatches = (expectedName, scrapedName, scrapedBio) => {
  if (!expectedName) return true;
  
  const normalizeForMatch = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
  
  const en = normalizeForMatch(expectedName);
  const target = normalizeForMatch((scrapedName || "") + " " + (scrapedBio || ""));
  
  if (!en) return true;
  
  const tokens = en.split(/\s+/).filter(Boolean);
  
  // We want at least one significant part of the expected name to be present
  // If it's just a single short word, require exact token match.
  // Otherwise, if any token >= 3 chars is found, it's a match.
  const targetTokens = new Set(target.split(/\s+/).filter(Boolean));
  
  for (const token of tokens) {
    if (token.length > 2 && target.includes(token)) return true;
    if (targetTokens.has(token)) return true;
  }
  
  return false;
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
  if (metadata.bio) pts += 2;
  if (metadata.name) pts += 1;
  if (pts >= 4) return "high";
  if (pts >= 2) return "medium";
  return "low";
}

// ─── Build SerpAPI query ─────────────────────────────────────────────────────
const buildSearchQuery = (platform, username, fallback = false) => {
  if (fallback) return `${platform.name} "${username}" profile site`;
  if (platform.name === "LinkedIn") return `site:linkedin.com/in "${username}"`;
  if (platform.name === "YouTube") return `site:youtube.com "@${username}"`;
  if (platform.name === "Snapchat") return `site:snapchat.com/add "${username}"`;
  if (platform.name === "Instagram") return `site:instagram.com "${username}"`;
  if (platform.name === "Facebook") return `site:facebook.com "${username}"`;
  if (platform.name === "Threads") return `site:threads.net "@${username}"`;
  if (platform.name === "TikTok") return `site:tiktok.com "@${username}"`;
  if (platform.name === "Spotify") return `site:open.spotify.com/user "${username}"`;
  return `site:${platform.domain} "${username}"`;
};

// ─── instagramCheck ──────────────────────────────────────────────────────────
// Instagram cannot be detected via HTML (JS-rendered, 200 for ALL URLs).
// Strategies in order:
//   1. JSON API  — best data, correct 404 for non-existent (rate-limited from servers)
//   2. SerpAPI   — Google index confirms real profiles (requires SERPAPI_KEY)
//   3. Redirect  — login redirect with ?next=/username/ = confirmed exists (server IPs)
const instagramCheck = async (username) => {
  const profileUrl = `https://www.instagram.com/${encodeURIComponent(username)}/`;
  const userLower = normalize(username);

  const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  };

  if (process.env.DEBUG_SCANNER === "true") console.log(`[Instagram] Checking ${username}...`);

  // ── Strategy 1: Internal JSON API ─────────────────────────────────────────
  // Works perfectly: 404 = not found, 200+user = found. Rate-limited (429) from servers.
  try {
    const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
    const res = await axios.get(apiUrl, {
      timeout: 8000,
      headers: {
        ...commonHeaders,
        "X-IG-App-ID": "936619743392459",
        "Accept": "application/json, text/plain, */*",
        "Referer": profileUrl,
        "Origin": "https://www.instagram.com",
      },
      validateStatus: (s) => s < 500,
    });

    if (res.status === 404) return null; // Confirmed not found
    if (res.status === 200) {
      const user = res.data?.data?.user;
      if (user) {
        if (process.env.DEBUG_SCANNER === "true") console.log(`[Instagram] Found via API: ${username}`);
        return {
          platform: "Instagram",
          url: profileUrl,
          found: true,
          source: "instagram-api",
          profileData: {
            name: user.full_name || username,
            bio: user.biography || null,
            avatar: user.profile_pic_url || null,
            followers: user.edge_followed_by?.count || null,
            isPrivate: user.is_private || false,
            isVerified: user.is_verified || false,
            visibilityScore: user.is_private ? "low" : (user.edge_followed_by?.count > 1000 ? "high" : "medium"),
          },
        };
      }
    }
    if (process.env.DEBUG_SCANNER === "true") console.log(`[Instagram] API strategy skipped (Status: ${res.status})`);
    // 401/403/429 = blocked/rate-limited → fall through to SerpAPI
  } catch (err) { 
    if (process.env.DEBUG_SCANNER === "true") console.log(`[Instagram] API strategy failed: ${err.message}`);
  }

  // ── Strategy 2: Google CSE (Google index confirms real profiles) ─────────────
  // Google only indexes real Instagram profiles. Searching site:instagram.com/username
  // gives a reliable signal: if Google found it, it's real.
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
    try {
      const query = `site:instagram.com/${username}`;
      const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
        params: {
          key: process.env.GOOGLE_API_KEY,
          cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
          q: query,
          num: 3,
        },
        timeout: 10000,
      });
      const results = response.data?.items || [];
      const match = results.find((item) => {
        const link = normalize(item.link || "");
        // Must be instagram.com/username (not a post or tagged page)
        return link.includes("instagram.com") && link.includes(userLower);
      });
      if (match) {
        return {
          platform: "Instagram",
          url: profileUrl,
          found: true,
          source: "instagram-search",
          profileData: {
            name: match.title?.split(" ")?.[0] || username,
            bio: match.snippet || null,
            visibilityScore: "medium",
          },
        };
      }
    } catch { /* fall through */ }
  }

  // ── Strategy 2.5: Direct HTML OG-tag check (works from residential / local IPs) ───
  // From local/home IPs Instagram returns 200 with real HTML that contains og:title.
  // og:title for existing profile: "Name (@username) • Instagram photos and videos"
  try {
    const res = await axios.get(profileUrl, {
      timeout: 6000,
      maxRedirects: 5,
      headers: { ...commonHeaders, "Accept": "text/html,application/xhtml+xml" },
      validateStatus: (s) => s < 500,
    });
    if (res.status === 404) return null;
    const html = safeHtml(res.data);
    if (isNotFoundPage(html)) return null;
    const metadata = extractMetadata(html);
    const titleLower = normalize(metadata.name || "");
    // Real profile title: "Cristiano Ronaldo (@cristiano) • Instagram"
    if (titleLower.includes(userLower) && titleLower.includes("instagram")) {
      if (process.env.DEBUG_SCANNER === "true") console.log(`[Instagram] Found via HTML: ${username}`);
      return {
        platform: "Instagram", url: profileUrl, found: true, source: "instagram-html",
        profileData: { ...metadata, visibilityScore: computeVisibilityScore(metadata) },
      };
    }
  } catch (err) { 
    if (process.env.DEBUG_SCANNER === "true") console.log(`[Instagram] HTML strategy failed: ${err.message}`);
  }

  // ── Strategy 3: Login-redirect detection ──────────────────────────────────

  // From datacenter IPs Instagram redirects existing profiles to login?next=/username/
  // Non-existent profiles return 404 before any redirect.
  try {
    const res = await axios.get(profileUrl, {
      timeout: 6000,
      maxRedirects: 0,
      headers: { ...commonHeaders, "Accept": "text/html" },
      validateStatus: (s) => s < 500,
    });

    if (res.status === 404) return null; // Confirmed not found

    if (res.status >= 300 && res.status < 400) {
      const location = normalize(res.headers?.location || "");
      if (location.includes("accounts/login") && (location.includes(userLower) || location.includes(encodeURIComponent(userLower)))) {
        if (process.env.DEBUG_SCANNER === "true") console.log(`[Instagram] Found via redirect: ${username}`);
        return {
          platform: "Instagram",
          url: profileUrl,
          found: true,
          source: "instagram-redirect",
          profileData: {
            name: username,
            visibilityScore: "low",
            note: "Account exists — login required to view content",
          },
        };
      }
    }
  } catch (e) {
    // axios throws on 3xx when maxRedirects:0 — extract redirect location
    if (e.response?.status >= 300 && e.response?.status < 400) {
      const location = normalize(e.response.headers?.location || "");
      if (location.includes("accounts/login") && location.includes(userLower)) {
        return {
          platform: "Instagram",
          url: profileUrl,
          found: true,
          source: "instagram-redirect",
          profileData: {
            name: username,
            visibilityScore: "low",
            note: "Account exists — login required to view content",
          },
        };
      }
    }
  }

  // All strategies failed → return null (no false positives)
  return null;
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
      timeout: 6000,
      maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      validateStatus: (s) => s < 500, // don't throw on 4xx
    });

    const finalUrl = normalize(response?.request?.res?.responseUrl || profileUrl);
    const html = safeHtml(response.data);
    const status = response.status;

    // ── Hard failures ──────────────────────────────────────────────────────
    if (status === 404) return null;
    if (isNotFoundPage(html)) return null;

    // ── Login-wall redirect ────────────────────────────────────────────────
    if (isLoginWallUrl(finalUrl)) {
      // We requested a specific username URL that was valid enough to trigger
      // the login wall → the account likely exists but is protected.
      return {
        platform: platform.name,
        url: profileUrl,
        found: true,
        source: "direct-login-wall",
        profileData: {
          name: username,
          visibilityScore: "low",
          note: "Account exists but content requires login",
        },
      };
    }

    // ── 200 OK ─────────────────────────────────────────────────────────────
    if (status === 200) {
      const metadata = extractMetadata(html);
      const titleLower = normalize(metadata.name || "");
      const userLower = normalize(username);

      // Strong signal 1: username appears at the START of og:title / page title
      // Handles "@username", "(username)", etc.
      const titleStartsWithUser = titleLower.startsWith(userLower) ||
        titleLower.startsWith(`@${userLower}`) ||
        titleLower.includes(`(${userLower})`) ||
        titleLower.includes(`(@${userLower})`);

      if (titleStartsWithUser) {
        if (process.env.DEBUG_SCANNER === "true") console.log(`[Direct] ${platform.name} confirmed via title-prefix: ${username}`);
        return {
          platform: platform.name,
          url: profileUrl,
          found: true,
          source: "direct",
          profileData: {
            ...metadata,
            visibilityScore: computeVisibilityScore(metadata),
          },
        };
      }

      // Strong signal 2: username appears ANYWHERE in title AND in the final URL.
      // Handles usernames like "_princeboro_" which platforms may wrap mid-title
      // e.g. "Check out _princeboro_ on GitHub" or "u/_princeboro_"
      const titleContainsUser = titleLower.includes(userLower) || fuzzyContains(titleLower, userLower);
      const urlContainsUser = finalUrl.includes(userLower) || finalUrl.includes(encodeURIComponent(userLower)) || fuzzyContains(finalUrl, userLower);

      if (titleContainsUser && urlContainsUser) {
        if (process.env.DEBUG_SCANNER === "true") console.log(`[Direct] ${platform.name} confirmed via title+url: ${username}`);
        return {
          platform: platform.name,
          url: profileUrl,
          found: true,
          source: "direct",
          profileData: {
            ...metadata,
            visibilityScore: computeVisibilityScore(metadata),
          },
        };
      }

      // Strong signal 3: URL contains the username AND page has real metadata.
      // Only apply for platforms where vanity URL ownership is confirmed by a
      // non-empty bio or avatar (proves it's not a generic homepage).
      if ((urlContainsUser || fuzzyContains(finalUrl, userLower)) && (metadata.avatar || metadata.bio)) {
        if (process.env.DEBUG_SCANNER === "true") console.log(`[Direct] ${platform.name} confirmed via metadata: ${username}`);
        return {
          platform: platform.name,
          url: profileUrl,
          found: true,
          source: "direct",
          profileData: {
            ...metadata,
            visibilityScore: computeVisibilityScore(metadata),
          },
        };
      }

      if (process.env.DEBUG_SCANNER === "true") {
        console.log(`[Direct] ${platform.name} rejected: Validation mismatch for "${username}". Title: "${metadata.name}". URL: ${finalUrl}`);
      }
      return null;
    }

    // ── 3xx without login wall already handled above (maxRedirects follows) ──
    return null;
  } catch {
    return null;
  }
};

// ─── Google CSE fallback (used for search-strategy platforms) ─────────────────
// Uses Google Custom Search API: 100 free searches/day (vs SerpAPI 100/month).
// Falls back gracefully if quota is exceeded.
const serpApiFallback = async (platform, username) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  // No keys OR quota already hit in this session → return null
  if (!apiKey || !cx || isSearchQuotaExhausted) return null;

  const trySearch = async (query) => {
    try {
      const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
        params: { key: apiKey, cx, q: query, num: 5, safe: "active" },
        timeout: 10000,
      });
      return response.data?.items || [];
    } catch (e) {
      if (e.response?.status === 429 || e.response?.status === 403) {
        console.warn("Google Search quota exceeded. Skipping further search fallbacks for this scan.");
        isSearchQuotaExhausted = true; // Set flag to stop further attempts
      }
      return [];
    }
  };

  // Primary: precise site-scoped query
  let results = await trySearch(buildSearchQuery(platform, username));

  // Secondary: broader query
  if (results.length === 0) {
    results = await trySearch(buildSearchQuery(platform, username, true));
  }

  // Find a result whose URL matches the expected profile URL pattern
  // AND has the username in the link (prevents wrong-channel Telegram results)
  const userLower = normalize(username);
  const match = results.find((item) => {
    const link = normalize(item.link || "");
    // Must be on the right domain and contain the username in the URL path
    return link.includes(platform.domain) && link.includes(userLower);
  });

  // Extra validation: reject if the matched URL looks like a sub-page, not a profile
  if (!match) return null;
  const matchedLink = normalize(match.link || "");
  const expectedBase = normalize(platform.url);
  const looksLikeProfile = matchedLink.includes(expectedBase + userLower) ||
    matchedLink.includes(expectedBase + encodeURIComponent(username).toLowerCase()) ||
    matchedLink.includes(expectedBase + `@${userLower}`);
  if (!looksLikeProfile) return null;


  const metadata = {
    name: match.title,
    bio: match.snippet,
    avatar: match.thumbnail || null,
  };

  return {
    platform: platform.name,
    url: match.link,
    found: true,
    source: "search",
    profileData: {
      ...metadata,
      visibilityScore: computeVisibilityScore(metadata),
    },
  };
};

// ─── Facebook Check ──────────────────────────────────────────────────────────
// Facebook redirects all unauthenticated requests to /login.php.
// If the profile EXISTS the ?next= param will contain the username.
// Non-existent usernames still redirect but to a generic login without ?next=/username.
const facebookCheck = async (username) => {
  const profileUrl = `https://www.facebook.com/${encodeURIComponent(username)}`;
  const userLower = normalize(username);
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
  };

  const checkRedirect = (location) => {
    const loc = normalize(location || "");
    // login redirect whose ?next= contains the username → profile exists
    return (loc.includes("/login") || loc.includes("login.php")) &&
      (loc.includes(encodeURIComponent(userLower)) || loc.includes(userLower));
  };

  try {
    const res = await axios.get(profileUrl, {
      timeout: 8000, maxRedirects: 0,
      headers, validateStatus: (s) => s < 500,
    });
    if (res.status === 404) return null;
    if (res.status >= 300 && res.status < 400 && checkRedirect(res.headers?.location)) {
      return {
        platform: "Facebook", url: profileUrl, found: true, source: "facebook-redirect",
        profileData: { name: username, visibilityScore: "low", note: "Profile exists — login required to view" }
      };
    }
  } catch (e) {
    if (e.response?.status >= 300 && e.response?.status < 400 && checkRedirect(e.response?.headers?.location)) {
      return {
        platform: "Facebook", url: profileUrl, found: true, source: "facebook-redirect",
        profileData: { name: username, visibilityScore: "low", note: "Profile exists — login required to view" }
      };
    }
  }
  // Fallback to Google CSE
  return serpApiFallback({ name: "Facebook", url: "https://www.facebook.com/", domain: "facebook.com" }, username);
};

// ─── TikTok Check ────────────────────────────────────────────────────────────
const tiktokCheck = async (username) => {
  const profileUrl = `https://www.tiktok.com/@${encodeURIComponent(username)}`;
  const userLower = normalize(username);
  try {
    const res = await axios.get(profileUrl, {
      timeout: 8000, maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "no-cache",
        "Upgrade-Insecure-Requests": "1",
      },
      validateStatus: (s) => s < 500,
    });
    if (res.status === 404) return null;
    const html = safeHtml(res.data);
    // TikTok injects statusCode 10202 for non-existent accounts
    if (html.includes('"statusCode":10202') || html.includes('statuscode":10202') ||
      html.toLowerCase().includes("couldn't find this account") ||
      html.toLowerCase().includes("user not found")) return null;

    if (res.status === 200) {
      const metadata = extractMetadata(html);
      const titleLower = normalize(metadata.name || "");
      // TikTok title: "@username | TikTok" or "Name (@username)"
      if (titleLower.includes(userLower) || titleLower.includes(`@${userLower}`) ||
        html.toLowerCase().includes(`"@${userLower}"`) ||
        html.toLowerCase().includes(`/@${userLower}"`)) {
        return {
          platform: "TikTok", url: profileUrl, found: true, source: "direct",
          profileData: { ...metadata, visibilityScore: computeVisibilityScore(metadata) }
        };
      }
    }
  } catch { /* fall through */ }
  return serpApiFallback({ name: "TikTok", url: "https://www.tiktok.com/@", domain: "tiktok.com" }, username);
};

// ─── Telegram Check ──────────────────────────────────────────────────────────

// t.me renders a public preview page for existing channels/users.
const telegramCheck = async (username) => {
  const profileUrl = `https://t.me/${encodeURIComponent(username)}`;
  const userLower = normalize(username);
  try {
    const res = await axios.get(profileUrl, {
      timeout: 6000, maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
      validateStatus: (s) => s < 500,
    });
    if (res.status === 404) return null;
    const html = safeHtml(res.data);
    // Real Telegram preview pages have a tgme_page_title element
    if (html.includes("tgme_page_title") && !html.toLowerCase().includes("a new era of messaging")) {
      const metadata = extractMetadata(html);
      // Extra check: OG title must not be just "Telegram"
      if (metadata.name && normalize(metadata.name) !== "telegram") {
        return {
          platform: "Telegram", url: `https://t.me/${username}`, found: true, source: "direct",
          profileData: { ...metadata, visibilityScore: computeVisibilityScore(metadata) }
        };
      }
    }
  } catch { /* fall through */ }
  return null;
};

// ─── Threads Check ───────────────────────────────────────────────────────────
const threadsCheck = async (username) => {
  const profileUrl = `https://www.threads.net/@${encodeURIComponent(username)}`;
  const userLower = normalize(username);
  try {
    const res = await axios.get(profileUrl, {
      timeout: 6000, maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
      validateStatus: (s) => s < 500,
    });
    if (res.status === 404) return null;
    const html = safeHtml(res.data);
    if (isNotFoundPage(html)) return null;
    const metadata = extractMetadata(html);
    const titleLower = normalize(metadata.name || "");
    if (titleLower.includes(userLower) || titleLower.includes(`@${userLower}`)) {
      return {
        platform: "Threads", url: profileUrl, found: true, source: "direct",
        profileData: { ...metadata, visibilityScore: computeVisibilityScore(metadata) }
      };
    }
  } catch { /* fall through */ }
  return serpApiFallback({ name: "Threads", url: "https://www.threads.net/@", domain: "threads.net" }, username);
};

// ─── Snapchat Check ──────────────────────────────────────────────────────────
// snapchat.com/add/{username} shows a public profile preview page.
const snapchatCheck = async (username) => {
  const profileUrl = `https://www.snapchat.com/add/${encodeURIComponent(username)}`;
  const userLower = normalize(username);
  try {
    const res = await axios.get(profileUrl, {
      timeout: 6000, maxRedirects: 5,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
      validateStatus: (s) => s < 500,
    });
    if (res.status === 404) return null;
    const html = safeHtml(res.data);
    if (isNotFoundPage(html)) return null;
    const metadata = extractMetadata(html);
    const titleLower = normalize(metadata.name || "");
    // Snapchat page title for existing user: "username's Snapchat" or similar
    if (titleLower.includes(userLower)) {
      return {
        platform: "Snapchat", url: profileUrl, found: true, source: "direct",
        profileData: { ...metadata, visibilityScore: computeVisibilityScore(metadata) }
      };
    }
  } catch { /* fall through */ }
  return serpApiFallback({ name: "Snapchat", url: "https://www.snapchat.com/add/", domain: "snapchat.com" }, username);
};

// ─── Platform dispatcher ──────────────────────────────────────────────────────
const checkPlatform = async (platform, username) => {
  if (platform.strategy === "skip") return null;
  if (platform.strategy === "instagram-api") return instagramCheck(username);
  if (platform.strategy === "facebook") return facebookCheck(username);
  if (platform.strategy === "tiktok") return tiktokCheck(username);
  if (platform.strategy === "telegram") return telegramCheck(username);
  if (platform.strategy === "threads") return threadsCheck(username);
  if (platform.strategy === "snapchat") return snapchatCheck(username);
  if (platform.strategy === "direct") return directCheck(platform, username);
  if (platform.strategy === "search") return serpApiFallback(platform, username);

  // hybrid: try direct first, fall back to Google CSE
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
const socialScanner = async (username, expectedName = null) => {
  if (!username) return [];
  const cleanUsername = normalize(username);
  if (!cleanUsername) return [];

  // Reset quota exhaustion flag for EACH new scan request
  isSearchQuotaExhausted = false;

  // Batch platforms into chunks of 10 to avoid network congestion and bot detection
  const results = [];
  const BATCH_SIZE = 10;
  
  for (let i = 0; i < platforms.length; i += BATCH_SIZE) {
    const batch = platforms.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map((p) => checkPlatform(p, cleanUsername))
    );
    results.push(...batchResults.filter(Boolean));
  }

  let finalResults = deduplicateResults(results);
  
  // Apply Strict Verification Mode if expectedName is provided
  if (expectedName) {
    if (process.env.DEBUG_SCANNER === "true") console.log(`[Strict Mode] Filtering results for name: ${expectedName}`);
    finalResults = finalResults.filter(item => {
      const match = nameMatches(expectedName, item.profileData?.name, item.profileData?.bio);
      if (!match && process.env.DEBUG_SCANNER === "true") {
        console.log(`[Strict Mode] Discarded ${item.platform} (${item.url}) - Name mismatch. Scraped: "${item.profileData?.name}"`);
      }
      return match;
    });
  }

  return finalResults;
};

module.exports = socialScanner;