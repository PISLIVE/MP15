const axios = require("axios");

const googleScanner = async (name, username) => {
  const query = [name, username].filter(Boolean).join(" ").trim();

  if (!query) return [];
  if (!process.env.SERPAPI_KEY) {
    console.error("Missing SERPAPI_KEY");
    return [];
  }

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google",
        q: query,
        api_key: process.env.SERPAPI_KEY,
        num: 5,
        safe: "active"
      },
      timeout: 10000
    });

    const results = response.data?.organic_results || [];

    return results.map((item, index) => ({
      id: String(index + 1),
      title: item.title || "Untitled result",
      link: item.link || "",
      snippet: item.snippet || "No snippet available"
    }));
  } catch (error) {
    if (error.response) {
      console.error("SerpApi error:", error.response.status);
    } else {
      console.error("SerpApi request error:", error.message);
    }
    return [];
  }
};

module.exports = googleScanner;