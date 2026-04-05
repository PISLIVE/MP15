const axios = require("axios");

/**
 * Searches Google via Custom Search API (100 free requests/day)
 * using the existing GOOGLE_API_KEY + GOOGLE_SEARCH_ENGINE_ID env vars.
 */
const googleScanner = async (name, username) => {
  const query = [name, username].filter(Boolean).join(" ").trim();

  if (!query) return [];

  const apiKey = process.env.GOOGLE_API_KEY;
  const cx    = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    console.error("Missing GOOGLE_API_KEY or GOOGLE_SEARCH_ENGINE_ID");
    return [];
  }

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

    const items = response.data?.items || [];

    return items.map((item, index) => ({
      id: String(index + 1),
      title:   item.title   || "Untitled result",
      link:    item.link    || "",
      snippet: item.snippet || "No snippet available",
    }));
  } catch (error) {
    const status = error.response?.status;
    if (status === 429 || status === 403) {
      console.warn("Google CSE daily quota exhausted (403/429).");
      // Throw a special quota error so the controller can warn the user
      const err = new Error("Google Search quota exhausted for today. Results will resume tomorrow.");
      err.code = "QUOTA_EXHAUSTED";
      throw err;
    }
    if (error.response) {
      console.error("Google CSE error:", status, JSON.stringify(error.response.data));
    } else {
      console.error("Google CSE request error:", error.message);
    }
    return [];
  }
};

module.exports = googleScanner;