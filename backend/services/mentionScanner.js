const axios = require("axios");

/**
 * Scans for public mentions of a name or username across social platforms
 * using Google Custom Search API (100 free requests/day).
 */
const mentionScanner = async (name, username) => {
  const identifiers = [name, username].filter(Boolean);
  if (identifiers.length === 0) return [];

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx    = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    console.error("Missing GOOGLE_API_KEY or GOOGLE_SEARCH_ENGINE_ID");
    return [];
  }

  const platforms = [
    { domain: "reddit.com",    name: "Reddit" },
    { domain: "twitter.com",   name: "X" },
    { domain: "x.com",         name: "X" },
    { domain: "facebook.com",  name: "Facebook" },
    { domain: "instagram.com", name: "Instagram" },
    { domain: "threads.net",   name: "Threads" },
    { domain: "linkedin.com",  name: "LinkedIn" },
    { domain: "github.com",    name: "GitHub" },
    { domain: "medium.com",    name: "Medium" },
  ];

  const runSearch = async (query) => {
    try {
      const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
        params: {
          key: apiKey,
          cx,
          q: query,
          num: 10,
          safe: "active",
        },
        timeout: 10000,
      });
      return response.data?.items || [];
    } catch (e) {
      if (e.response) {
        console.error("Google CSE mention error:", e.response.status, JSON.stringify(e.response.data));
      } else {
        console.error("Google CSE mention request error:", e.message);
      }
      return [];
    }
  };

  // Build query: ("Name" OR "username") (site:reddit.com OR site:twitter.com ...)
  const idQuery    = identifiers.map(id => `"${id}"`).join(" OR ");
  const siteQuery  = `(${idQuery}) (` + platforms.map(p => `site:${p.domain}`).join(" OR ") + ")";

  let results = await runSearch(siteQuery);

  // Fallback: broader search if platform query returns nothing
  if (results.length === 0) {
    const broadQuery = identifiers.join(" ") + " social media";
    results = await runSearch(broadQuery);
  }

  return results.map((item, index) => {
    const lowerLink     = (item.link || "").toLowerCase();
    const platformMatch = platforms.find(p => lowerLink.includes(p.domain));
    const platform      = platformMatch ? platformMatch.name : "Other";

    return {
      id:       `m-${index + 1}`,
      platform,
      title:    item.title   || "Social Mention",
      snippet:  item.snippet || "No preview available",
      link:     item.link    || "#",
      date:     item.pagemap?.newsarticle?.[0]?.datepublished || "Recently indexed",
    };
  });
};

module.exports = mentionScanner;
