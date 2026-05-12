const axios = require("axios");

/**
 * Scans for public mentions across social platforms.
 * Tries Google CSE (site-restricted) first, then falls back to SerpAPI for broad discovery.
 */
const mentionScanner = async (name, username) => {
  const identifiers = [name, username].filter(Boolean);
  if (identifiers.length === 0) return [];

  const googleKey = process.env.GOOGLE_API_KEY;
  const googleCx  = process.env.GOOGLE_SEARCH_ENGINE_ID;
  const serpKey   = process.env.SERPAPI_KEY;

  const platforms = [
    { domain: "reddit.com",    name: "Reddit" },
    { domain: "twitter.com",   name: "X" },
    { domain: "x.com",         name: "X" },
    { domain: "facebook.com",  name: "Facebook" },
    { domain: "instagram.com", name: "Instagram" },
    { domain: "threads.net",   name: "Threads" },
    { domain: "linkedin.com",  name: "LinkedIn" },
    { domain: "github.com",    name: "GitHub" },
  ];

  const idQuery = identifiers.map(id => `"${id}"`).join(" OR ");
  const siteQuery = `(${idQuery}) (` + platforms.map(p => `site:${p.domain}`).join(" OR ") + ")";

  let searchItems = [];

  // --- Step 1: Try Google CSE (Site Restricted - should still work) ---
  if (googleKey && googleCx) {
    try {
      console.log("[Mention Scanner] Trying Google CSE (Site-restricted)...");
      const res = await axios.get("https://www.googleapis.com/customsearch/v1", {
        params: { key: googleKey, cx: googleCx, q: siteQuery, num: 10 },
        timeout: 8000,
      });
      searchItems = res.data?.items || [];
    } catch (e) {
      console.warn(`[Mention Scanner] Google CSE failed: ${e.message}`);
    }
  }

  // --- Step 2: Fallback to SerpAPI for broad discovery ---
  if (searchItems.length === 0 && serpKey && serpKey !== "your_serpapi_key_here") {
    try {
      console.log("[Mention Scanner] Falling back to SerpAPI for broad discovery...");
      const broadQuery = identifiers.join(" ") + " social media profile";
      const res = await axios.get("https://serpapi.com/search", {
        params: { api_key: serpKey, engine: "google", q: broadQuery, num: 10 },
        timeout: 10000,
      });
      searchItems = res.data?.organic_results || [];
    } catch (e) {
      console.error(`[Mention Scanner] SerpAPI failed: ${e.message}`);
    }
  }

  return searchItems.map((item, index) => {
    const link = item.link || "";
    const platformMatch = platforms.find(p => link.toLowerCase().includes(p.domain));
    
    return {
      id: `m-${index + 1}`,
      platform: platformMatch ? platformMatch.name : "Other",
      title: item.title || "Social Mention",
      snippet: item.snippet || "No preview available",
      link: link || "#",
      date: item.pagemap?.newsarticle?.[0]?.datepublished || "Recent",
    };
  });
};

module.exports = mentionScanner;

