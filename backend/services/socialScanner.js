const axios = require("axios");

// ─── Platform registry ────────────────────────────────────────────────────────
// strategy:
//   "instagram-api" → dedicated Instagram JSON endpoint
//   "direct"        → reliable HTTP HEAD/GET check
//   "skip"          → cannot be reliably checked without a paid API (no SerpAPI = skip)
const platforms = [
  { name: "Instagram", url: "https://www.instagram.com/", domain: "instagram.com", strategy: "instagram-api" },
  { name: "GitHub", url: "https://github.com/", domain: "github.com", strategy: "direct" },
  { name: "Reddit", url: "https://www.reddit.com/user/", domain: "reddit.com", strategy: "direct" },
  { name: "GitLab", url: "https://gitlab.com/", domain: "gitlab.com", strategy: "direct" },
  { name: "YouTube", url: "https://www.youtube.com/@", domain: "youtube.com", strategy: "direct" },
  { name: "Twitch", url: "https://www.twitch.tv/", domain: "twitch.tv", strategy: "direct" },
  { name: "Medium", url: "https://medium.com/@", domain: "medium.com", strategy: "direct" },
  { name: "Pinterest", url: "https://www.pinterest.com/", domain: "pinterest.com", strategy: "direct" },
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
  // ── Platforms that block all scraping without a paid API ──────────────────
  // These return null to avoid false positives. Add SerpAPI key to enable them.
  { name: "X", url: "https://x.com/", domain: "x.com", strategy: "search" },
  { name: "Twitter", url: "https://twitter.com/", domain: "twitter.com", strategy: "search" },
  { name: "Facebook", url: "https://www.facebook.com/", domain: "facebook.com", strategy: "search" },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/", domain: "linkedin.com", strategy: "search" },
  { name: "TikTok", url: "https://www.tiktok.com/@", domain: "tiktok.com", strategy: "search" },
  { name: "Snapchat", url: "https://www.snapchat.com/add/", domain: "snapchat.com", strategy: "search" },
  { name: "Telegram", url: "https://t.me/", domain: "t.me", strategy: "search" },
  { name: "Threads", url: "https://www.threads.net/@", domain: "threads.net", strategy: "search" },
  { name: "Spotify", url: "https://open.spotify.com/user/", domain: "spotify.com", strategy: "search" },
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
  const userLower  = normalize(username);

  const commonHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
  };

  // ── Strategy 1: Internal JSON API ─────────────────────────────────────────
  // Works perfectly: 404 = not found, 200+user = found. Rate-limited (429) from servers.
  try {
    const apiUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
    const res = await axios.get(apiUrl, {
      timeout: 10000,
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
    // 401/403/429 = blocked/rate-limited → fall through to SerpAPI
  } catch { /* fall through */ }

  // ── Strategy 2: SerpAPI (Google index) ────────────────────────────────────
  // Google only indexes real Instagram profiles. Searching site:instagram.com/username
  // gives us a reliable signal: if Google found it, it's real.
  if (process.env.SERPAPI_KEY) {
    try {
      const igPlatform = {
        name: "Instagram",
        url: "https://www.instagram.com/",
        domain: "instagram.com",
      };
      // Use the existing serpApiFallback helper (declared later, hoisted via const — call directly)
      const query = `site:instagram.com/${username}`;
      const response = await axios.get("https://serpapi.com/search.json", {
        params: { engine: "google", q: query, api_key: process.env.SERPAPI_KEY, num: 3 },
        timeout: 10000,
      });
      const results = response.data?.organic_results || [];
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

  // ── Strategy 3: Login-redirect detection ──────────────────────────────────
  // From datacenter IPs Instagram redirects existing profiles to login?next=/username/
  // Non-existent profiles return 404 before any redirect.
  try {
    const res = await axios.get(profileUrl, {
      timeout: 10000,
      maxRedirects: 0,
      headers: { ...commonHeaders, "Accept": "text/html" },
      validateStatus: (s) => s < 500,
    });

    if (res.status === 404) return null; // Confirmed not found

    if (res.status >= 300 && res.status < 400) {
      const location = normalize(res.headers?.location || "");
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
      timeout: 12000,
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
      // e.g. "Google · GitLab" ✓, "google - Twitch" ✓
      const titleStartsWithUser = titleLower.startsWith(userLower) ||
        titleLower.startsWith(`@${userLower}`) ||
        titleLower.includes(`(${userLower})`) ||
        titleLower.includes(`(@${userLower})`);

      if (titleStartsWithUser) {
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
      const titleContainsUser = titleLower.includes(userLower);
      const urlContainsUser = finalUrl.includes(userLower);

      if (titleContainsUser && urlContainsUser) {
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
      if (urlContainsUser && (metadata.avatar || metadata.bio)) {
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

      // ⚠️ NO bare avatar+bio fallback — platforms like Telegram, Twitch, Steam
      // serve their own branding og:image/og:description on ALL pages,
      // including non-existent user pages, causing false positives.
      return null;
    }

    // ── 3xx without login wall already handled above (maxRedirects follows) ──
    return null;
  } catch {
    return null;
  }
};

// ─── SerpAPI fallback (only used when SERPAPI_KEY is set with active credits) ──
const serpApiFallback = async (platform, username) => {
  // No key → return null. Do NOT fall back to directCheck for these platforms
  // because they block scraping and cause false positives.
  if (!process.env.SERPAPI_KEY) return null;

  const trySearch = async (query) => {
    try {
      const response = await axios.get("https://serpapi.com/search.json", {
        params: {
          engine: "google",
          q: query,
          api_key: process.env.SERPAPI_KEY,
          num: 5,
          safe: "active",
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

  // Find a result whose URL matches the expected profile URL pattern
  // AND has the username in the link (prevents wrong-channel Telegram results)
  const userLower = normalize(username);
  const expectedPath = normalize(platform.url + username);
  const match = results.find((item) => {
    const link = normalize(item.link || "");
    // Must be on the right domain and contain the username in the URL path
    return link.includes(platform.domain) && link.includes(userLower);
  });

  // Extra validation: reject if the matched URL looks like a sub-page, not a profile
  // e.g. t.me/s/google_nws?before=4054 is a channel post page, not a user profile
  if (!match) return null;
  const matchedLink = normalize(match.link || "");
  const expectedBase = normalize(platform.url);
  // The link should start with the platform base URL + username (no deep paths)
  // Allow some flexibility for case differences and trailing slashes
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

// ─── Platform dispatcher ──────────────────────────────────────────────────────
const checkPlatform = async (platform, username) => {
  if (platform.strategy === "skip") return null; // unreliable without paid API
  if (platform.strategy === "instagram-api") return instagramCheck(username);
  if (platform.strategy === "direct") return directCheck(platform, username);
  if (platform.strategy === "search") return serpApiFallback(platform, username);

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