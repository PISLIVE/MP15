const axios = require("axios");

/**
 * Name-based Social Search Service
 * 
 * When users search by full name (e.g., "Debanjani Saikia"), traditional
 * username-based social scanning won't work because platforms like Facebook
 * and LinkedIn use real names, not standardized usernames.
 * 
 * Strategy order:
 *   1. SerpAPI (most reliable, 100/month)
 *   2. Google CSE (100/day, may be site-restricted)
 */

const SOCIAL_PLATFORMS = [
  { domain: "facebook.com", name: "Facebook" },
  { domain: "linkedin.com", name: "LinkedIn" },
  { domain: "instagram.com", name: "Instagram" },
  { domain: "twitter.com", name: "Twitter" },
  { domain: "x.com", name: "X" },
  { domain: "youtube.com", name: "YouTube" },
  { domain: "github.com", name: "GitHub" },
  { domain: "reddit.com", name: "Reddit" },
  { domain: "threads.net", name: "Threads" },
  { domain: "tiktok.com", name: "TikTok" },
  { domain: "pinterest.com", name: "Pinterest" },
];

/**
 * Check if a Google search result URL is a valid profile page (not a post/status/comment).
 */
function isProfileUrl(link, domain) {
  const lower = link.toLowerCase();

  // Reject obvious non-profile pages
  if (lower.includes("/posts/") || lower.includes("/status/") ||
      lower.includes("/photos/") || lower.includes("/videos/") ||
      lower.includes("/comments/") || lower.includes("/stories/") ||
      lower.includes("/groups/") || lower.includes("/events/") ||
      lower.includes("/watch?") || lower.includes("/hashtag/") ||
      lower.includes("/reel/")) {
    return false;
  }

  // For Facebook, allow profile.php?id= and direct /<name> pages and /people/ URLs
  if (domain === "facebook.com") {
    if (lower.includes("facebook.com/profile.php") || lower.includes("facebook.com/people/")) {
      return true;
    }
    // Direct name page: facebook.com/<something> with no further path segments
    const pathParts = lower.replace(/https?:\/\/(www\.)?facebook\.com\/?/, "").split("/").filter(Boolean);
    return pathParts.length <= 1;
  }

  // For LinkedIn, must be /in/<name>
  if (domain === "linkedin.com") {
    return lower.includes("/in/");
  }

  return true;
}

/**
 * Fuzzy name-match: checks if the search result title/snippet contains
 * the person's name (or a significant portion of it).
 */
function nameMatchesResult(fullName, title, snippet) {
  const nameLower = fullName.toLowerCase().trim();
  const combined = ((title || "") + " " + (snippet || "")).toLowerCase();

  // Direct full match (including username matches like "@bhaskar_saikia1")
  if (combined.includes(nameLower)) return true;

  // Handle @ prefix variations (e.g., "@bhaskar_saikia1" in a title)
  if (combined.includes(`@${nameLower}`)) return true;

  // For username-style queries (with underscores/digits), strip non-alpha and try matching
  const looksLikeUsername = !fullName.includes(" ") && (/[_\-]/.test(fullName) || /\d/.test(fullName));
  if (looksLikeUsername) {
    // Strip separators: "bhaskar_saikia1" → "bhaskarsaikia1" or match each segment
    const stripped = nameLower.replace(/[_\-]/g, "");
    if (combined.includes(stripped)) return true;

    // Match significant segments of the username (separated by _ or -)
    const segments = nameLower.split(/[_\-]/).filter(s => s.length >= 3);
    if (segments.length >= 2) {
      const matchCount = segments.filter(s => combined.includes(s)).length;
      return matchCount >= 2;
    }
    if (segments.length === 1 && segments[0].length >= 4) {
      return combined.includes(segments[0]);
    }
    return false;
  }

  const nameParts = nameLower.split(/\s+/).filter(Boolean);

  // Multi-word names: at least 2 parts must match
  if (nameParts.length >= 2) {
    const matchCount = nameParts.filter(p => combined.includes(p)).length;
    return matchCount >= 2;
  }

  // Single-word name (e.g., "torvalds") — must be a strong match
  // Require it appears as a distinct word (not substring of another word)
  if (nameParts.length === 1 && nameParts[0].length >= 4) {
    const word = nameParts[0];
    // Check for word boundary match (preceded/followed by space, punctuation, or start/end)
    const regex = new RegExp(`(?:^|[\\s\\-_@/\\.,:;"'()])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[\\s\\-_@/\\.,:;"'()])`, 'i');
    return regex.test(combined);
  }

  // Very short single-word names (< 4 chars) — too ambiguous, skip
  return false;
}

/**
 * Parse search results (from either SerpAPI or Google CSE) into social profile results.
 */
function parseSearchResults(items, fullName, seenUrls) {
  const results = [];
  for (const item of items) {
    const link = item.link || "";
    const linkLower = link.toLowerCase();

    if (seenUrls.has(linkLower)) continue;

    const matchedPlatform = SOCIAL_PLATFORMS.find(p => linkLower.includes(p.domain));
    if (!matchedPlatform) continue;
    if (!isProfileUrl(link, matchedPlatform.domain)) continue;
    if (!nameMatchesResult(fullName, item.title, item.snippet)) continue;

    seenUrls.add(linkLower);
    results.push({
      platform: matchedPlatform.name,
      url: link,
      found: true,
      source: "name-search",
      profileData: {
        name: item.title || fullName,
        bio: item.snippet || null,
        visibilityScore: "medium",
        note: `Found via name search for "${fullName}"`,
      },
    });
  }
  return results;
}

// ─── SerpAPI Strategy ────────────────────────────────────────────────────────
async function searchViaSerpAPI(name, seenUrls) {
  const serpKey = process.env.SERPAPI_KEY;
  if (!serpKey || serpKey === "your_serpapi_key_here") return [];

  const results = [];
  
  // Detect if this looks like a username (contains underscore or digits, no spaces)
  const looksLikeUsername = !name.includes(" ") && (/[_\-]/.test(name) || /\d/.test(name));
  
  const queries = looksLikeUsername
    ? [
        // Username-specific queries (more targeted)
        `"${name}" instagram`,
        `site:instagram.com "${name}"`,
        `"${name}" (instagram OR facebook OR twitter OR tiktok) profile`,
      ]
    : [
        `"${name}" facebook profile`,
        `"${name}" linkedin OR instagram OR twitter`,
      ];

  for (const query of queries) {
    try {
      console.log(`[NameSearch/SerpAPI] Querying: ${query}`);
      const response = await axios.get("https://serpapi.com/search", {
        params: {
          api_key: serpKey,
          engine: "google",
          q: query,
          google_domain: "google.com",
          gl: "us",
          hl: "en",
          num: 10,
        },
        timeout: 12000,
      });

      const organic = response.data?.organic_results || [];
      console.log(`[NameSearch/SerpAPI] Got ${organic.length} organic results`);

      const items = organic.map(r => ({
        link: r.link || "",
        title: r.title || "",
        snippet: r.snippet || "",
      }));

      results.push(...parseSearchResults(items, name, seenUrls));

      // If we already found social results, don't waste more quota
      if (results.length > 0) break;
    } catch (err) {
      console.warn(`[NameSearch/SerpAPI] Failed: ${err.message}`);
      if (err.response?.status === 429) {
        console.warn("[NameSearch/SerpAPI] Rate limited. Stopping.");
        break;
      }
    }
  }

  return results;
}

// ─── Google CSE Strategy ─────────────────────────────────────────────────────
async function searchViaGoogleCSE(name, seenUrls) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !cx) return [];

  const results = [];

  // Strategy 1: Targeted site-scoped searches
  const priorityPlatforms = [
    { domain: "facebook.com", name: "Facebook" },
    { domain: "linkedin.com", name: "LinkedIn" },
    { domain: "instagram.com", name: "Instagram" },
  ];

  for (const platform of priorityPlatforms) {
    try {
      const query = `site:${platform.domain} "${name}"`;
      console.log(`[NameSearch/CSE] Querying: ${query}`);

      const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
        params: { key: apiKey, cx, q: query, num: 3, safe: "active" },
        timeout: 8000,
      });

      const items = (response.data?.items || []).map(r => ({
        link: r.link || "",
        title: r.title || "",
        snippet: r.snippet || "",
      }));
      console.log(`[NameSearch/CSE] Got ${items.length} items for ${platform.name}`);
      results.push(...parseSearchResults(items, name, seenUrls));
    } catch (err) {
      const status = err.response?.status;
      if (status === 429 || status === 403) {
        console.warn(`[NameSearch/CSE] Google quota/access error (${status}) during ${platform.name}. Stopping CSE.`);
        break;
      }
      console.warn(`[NameSearch/CSE] ${platform.name} search failed: ${err.message}`);
    }
  }

  // Strategy 2: Broad query if no targeted results
  if (results.length === 0) {
    try {
      const broadQuery = `"${name}" (facebook OR linkedin OR instagram) profile`;
      console.log(`[NameSearch/CSE] Broad query: ${broadQuery}`);

      const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
        params: { key: apiKey, cx, q: broadQuery, num: 5, safe: "active" },
        timeout: 8000,
      });

      const items = (response.data?.items || []).map(r => ({
        link: r.link || "",
        title: r.title || "",
        snippet: r.snippet || "",
      }));
      console.log(`[NameSearch/CSE] Broad got ${items.length} items`);
      results.push(...parseSearchResults(items, name, seenUrls));
    } catch (err) {
      console.warn(`[NameSearch/CSE] Broad search failed: ${err.message}`);
    }
  }

  return results;
}

/**
 * Main export: Search for social profiles by full name.
 * Uses SerpAPI first (most reliable), then Google CSE as fallback.
 */
const nameToSocialSearch = async (fullName) => {
  if (!fullName || !fullName.trim()) return [];

  const name = fullName.trim();
  console.log(`\n[NameSearch] ══════════════════════════════════════════`);
  console.log(`[NameSearch] Searching social profiles for: "${name}"`);
  console.log(`[NameSearch] SERPAPI_KEY: ${process.env.SERPAPI_KEY ? "✅ Set" : "❌ Missing"}`);
  console.log(`[NameSearch] GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? "✅ Set" : "❌ Missing"}`);
  console.log(`[NameSearch] GOOGLE_SEARCH_ENGINE_ID: ${process.env.GOOGLE_SEARCH_ENGINE_ID ? "✅ Set" : "❌ Missing"}`);

  const seenUrls = new Set();
  let results = [];

  // Strategy 1: SerpAPI (most reliable for finding social profiles by name)
  results = await searchViaSerpAPI(name, seenUrls);
  if (results.length > 0) {
    console.log(`[NameSearch] ✅ Found ${results.length} profile(s) via SerpAPI`);
    results.forEach((r, i) => console.log(`  ${i+1}. [${r.platform}] ${r.url}`));
    console.log(`[NameSearch] ══════════════════════════════════════════\n`);
    return results;
  }

  // Strategy 2: Google CSE fallback
  console.log(`[NameSearch] SerpAPI found nothing, trying Google CSE...`);
  results = await searchViaGoogleCSE(name, seenUrls);
  if (results.length > 0) {
    console.log(`[NameSearch] ✅ Found ${results.length} profile(s) via Google CSE`);
    results.forEach((r, i) => console.log(`  ${i+1}. [${r.platform}] ${r.url}`));
  } else {
    console.log(`[NameSearch] ⚠️  No social profiles found for "${name}"`);
  }

  console.log(`[NameSearch] ══════════════════════════════════════════\n`);
  return results;
};

module.exports = nameToSocialSearch;
