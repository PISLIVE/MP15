const axios = require("axios");

/**
 * Hybrid Search: Tries Google CSE first (100/day limit).
 * If it fails or returns 0 results (due to "entire web" restriction),
 * it falls back to SerpAPI (100/month limit).
 */
const googleScanner = async (name, username) => {
  // Build a precise query: quote each identifier and OR them together.
  // e.g. name="Bhaskar Saikia", username="bhaskar_saikia1"
  //   → '"Bhaskar Saikia" OR "bhaskar_saikia1"'
  const terms = [name, username]
    .filter(Boolean)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  if (terms.length === 0) return [];

  // De-duplicate (e.g. if name and username are the same)
  const unique = [...new Set(terms)];
  const query = unique.map(t => `"${t}"`).join(" OR ");

  const googleKey = process.env.GOOGLE_API_KEY;
  const googleCx  = process.env.GOOGLE_SEARCH_ENGINE_ID;
  const serpKey   = process.env.SERPAPI_KEY;

  // --- Step 1: Try Google Custom Search (Free 100/day) ---
  if (googleKey && googleCx) {
    try {
      console.log(`[Google Scanner] Trying Google CSE for: ${query}`);
      const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
        params: { key: googleKey, cx: googleCx, q: query, num: 10, safe: "active" },
        timeout: 8000,
      });
      
      const items = response.data?.items || [];
      if (items.length > 0) {
        console.log(`✅ Found ${items.length} results via Google CSE`);
        return items.map((item, index) => ({
          id: String(index + 1),
          title: item.title || "Untitled",
          link: item.link || "",
          snippet: item.snippet || "No snippet available",
        }));
      }
      console.log("[Google Scanner] Google CSE returned 0 results (possibly due to site restrictions).");
    } catch (error) {
      const status = error.response?.status;
      if (status === 403 || status === 429) {
        console.warn(`⚠️ Google CSE quota/config issue (${status}). Falling back to SerpAPI...`);
      } else {
        console.warn(`⚠️ Google CSE error: ${error.message}`);
      }
    }
  }

  // --- Step 2: Fallback to SerpAPI (Limited 100/month) ---
  if (serpKey && serpKey !== "your_serpapi_key_here") {
    try {
      console.log(`[Google Scanner] Falling back to SerpAPI for: ${query}`);
      const response = await axios.get("https://serpapi.com/search", {
        params: {
          api_key: serpKey,
          engine: "google",
          q: query,
          google_domain: "google.com",
          gl: "us",
          hl: "en",
        },
        timeout: 10000,
      });

      const organic = response.data?.organic_results || [];
      if (organic.length > 0) {
        console.log(`✅ Found ${organic.length} results via SerpAPI`);
        return organic.slice(0, 10).map((item, index) => ({
          id: `s-${index + 1}`,
          title: item.title || "Untitled",
          link: item.link || "",
          snippet: item.snippet || "No snippet available",
        }));
      }
      console.log("[Google Scanner] SerpAPI also returned 0 results.");
    } catch (error) {
      console.error(`❌ SerpAPI error: ${error.message}`);
    }
  }

  return [];
};

module.exports = googleScanner;