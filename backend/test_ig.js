// Debug Instagram detection — run: node test_ig.js _princeboro_
const axios = require("axios");
require("dotenv").config();

const username = process.argv[2] || "_princeboro_";
const profileUrl = `https://www.instagram.com/${username}/`;

const headers = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

async function run() {
  console.log(`\n🔍 Debugging Instagram for: ${username}\n`);

  // ── Strategy 1: JSON API ─────────────────────────────────────────────
  console.log("── Strategy 1: JSON API ──");
  try {
    const r = await axios.get(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      {
        timeout: 10000,
        headers: { ...headers, "X-IG-App-ID": "936619743392459", "Accept": "application/json", "Referer": profileUrl, "Origin": "https://www.instagram.com" },
        validateStatus: s => s < 600,
      }
    );
    console.log(`   Status: ${r.status}`);
    console.log(`   Has user data: ${!!r.data?.data?.user}`);
    if (r.status !== 200) console.log(`   Response snippet: ${JSON.stringify(r.data).substring(0, 150)}`);
  } catch (e) { console.log(`   ERROR: ${e.message}`); }

  // ── Strategy 2: Login redirect detection ────────────────────────────
  console.log("\n── Strategy 2: Login redirect (maxRedirects:0) ──");
  try {
    const r = await axios.get(profileUrl, {
      timeout: 10000,
      maxRedirects: 0,
      headers: { ...headers, "Accept": "text/html" },
      validateStatus: s => s < 600,
    });
    console.log(`   Status: ${r.status}`);
    console.log(`   Location header: ${r.headers?.location || "(none)"}`);
  } catch (e) {
    // axios throws on 3xx when maxRedirects:0
    if (e.response) {
      console.log(`   Status: ${e.response.status}`);
      console.log(`   Location header: ${e.response.headers?.location || "(none)"}`);
    } else {
      console.log(`   ERROR: ${e.message}`);
    }
  }

  // ── Strategy 2b: Follow redirects ───────────────────────────────────
  console.log("\n── Strategy 2b: Follow redirects (check final URL + title) ──");
  try {
    const r = await axios.get(profileUrl, {
      timeout: 12000,
      maxRedirects: 5,
      headers: { ...headers, "Accept": "text/html" },
      validateStatus: s => s < 500,
    });
    const finalUrl = r.request?.res?.responseUrl || "(unknown)";
    const titleMatch = (r.data || "").match(/<title>([^<]+)<\/title>/i);
    console.log(`   Status: ${r.status}`);
    console.log(`   Final URL: ${finalUrl}`);
    console.log(`   Title: ${titleMatch?.[1] || "(none)"}`);
    console.log(`   Has not-found text: ${(r.data || "").toLowerCase().includes("sorry, this page isn't available")}`);
  } catch (e) { console.log(`   ERROR: ${e.message}`); }

  // ── Strategy 3: oEmbed ───────────────────────────────────────────────
  console.log("\n── Strategy 3: oEmbed ──");
  try {
    const r = await axios.get(
      `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(profileUrl)}`,
      { timeout: 8000, headers: { ...headers, "Accept": "application/json" }, validateStatus: s => s < 600 }
    );
    console.log(`   Status: ${r.status}`);
    console.log(`   Author: ${r.data?.author_name || "(none)"}`);
  } catch (e) { console.log(`   ERROR: ${e.message}`); }

  console.log("\n────────────────────────────────────────────\n");
}

run();
