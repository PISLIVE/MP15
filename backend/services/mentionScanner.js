const axios = require("axios");

/**
 * Scans for public mentions of a name or username on social platforms
 */
const mentionScanner = async (name, username) => {
  const identifiers = [name, username].filter(Boolean);
  if (identifiers.length === 0) return [];

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.error("Missing SERPAPI_KEY");
    return [];
  }

  // Combine identifiers into a search string: ("John Doe" OR "johndoe123")
  const idQuery = identifiers.map(id => `"${id}"`).join(" OR ");
  
  // Target platforms where "mentions" are common
  const platforms = [
    { domain: "reddit.com", name: "Reddit" },
    { domain: "twitter.com", name: "X" },
    { domain: "x.com", name: "X" },
    { domain: "facebook.com", name: "Facebook" },
    { domain: "instagram.com", name: "Instagram" },
    { domain: "threads.net", name: "Threads" },
    { domain: "linkedin.com", name: "LinkedIn" },
    { domain: "github.com", name: "GitHub" },
    { domain: "medium.com", name: "Medium" }
  ];

  const runSearch = async (query) => {
    try {
      const response = await axios.get("https://serpapi.com/search.json", {
        params: {
          engine: "google",
          q: query,
          api_key: apiKey,
          num: 10,
          safe: "active"
        },
        timeout: 10000
      });
      return response.data?.organic_results || [];
    } catch (e) {
      return [];
    }
  };

  // Construct a query: ("Name" OR "User") (site:reddit.com OR site:twitter.com ...)
  const siteQuery = `(${idQuery}) (` + platforms.map(p => `site:${p.domain}`).join(" OR ") + ")";

  try {
    let results = await runSearch(siteQuery);

    // If no results, try a slightly broader search for the identifiers generally
    if (results.length === 0) {
      const broadQuery = identifiers.join(" ") + " social media";
      results = await runSearch(broadQuery);
    }

    return results.map((item, index) => {
      // Determine platform name from link
      const lowerLink = (item.link || "").toLowerCase();
      const platformMatch = platforms.find(p => lowerLink.includes(p.domain));
      const platform = platformMatch ? platformMatch.name : "Other";

      return {
        id: `m-${index + 1}`,
        platform,
        title: item.title || "Social Mention",
        snippet: item.snippet || "No preview available",
        link: item.link || "#",
        date: item.date || "Recently indexed"
      };
    });
  } catch (error) {
    console.error("Mention Scanner Error:", error.message);
    return [];
  }
};

module.exports = mentionScanner;
