const crypto = require("crypto");
const dns = require("dns").promises;
const axios = require("axios");
const { execFile } = require("child_process");
const path = require("path");

/**
 * Run Holehe Python wrapper to check specific platform registrations.
 */
async function runHolehe(email) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, "../utils/holehe_wrapper.py");
    execFile("python", [scriptPath, email], { timeout: 30000 }, (error, stdout, stderr) => {
      if (stderr) console.log("[EmailScanner] Holehe stderr:", stderr.substring(0, 500));
      if (error) {
        console.warn("[EmailScanner] Holehe error:", error.message.substring(0, 300));
        return resolve({});
      }
      console.log("[EmailScanner] Holehe raw stdout:", stdout.substring(0, 500));
      try {
        // Find JSON block in output
        const jsonMatch = stdout.match(/\{.*\}/s);
        if (jsonMatch) {
          const results = JSON.parse(jsonMatch[0]);
          const found = Object.values(results).filter((v) => v && v.exists).length;
          console.log(`[EmailScanner] Holehe parsed: ${Object.keys(results).length} sites, ${found} registered`);
          return resolve(results);
        }
        console.warn("[EmailScanner] No JSON found in holehe output");
        resolve({});
      } catch (err) {
        console.warn("[EmailScanner] Failed to parse Holehe output:", err.message);
        resolve({});
      }
    });
  });
}

/**
 * Perform DNS MX record lookup to verify if the domain can receive emails.
 */
async function checkEmailDeliverability(email) {
  const domain = email.split("@")[1];
  if (!domain) return { canReceive: false, provider: "Unknown" };

  try {
    const mxRecords = await dns.resolveMx(domain);
    const canReceive = mxRecords && mxRecords.length > 0;
    
    // Infer provider from domain or MX record
    let provider = domain;
    if (domain === "gmail.com" || mxRecords.some(r => r.exchange.includes("google.com"))) {
      provider = "Google";
    } else if (domain === "outlook.com" || domain === "hotmail.com" || mxRecords.some(r => r.exchange.includes("outlook.com"))) {
      provider = "Microsoft";
    } else if (domain === "yahoo.com" || mxRecords.some(r => r.exchange.includes("yahoo.com"))) {
      provider = "Yahoo";
    } else if (domain === "protonmail.com" || domain === "proton.me") {
      provider = "ProtonMail";
    }

    return {
      canReceive,
      provider: provider.charAt(0).toUpperCase() + provider.slice(1)
    };
  } catch (err) {
    return { canReceive: false, provider: domain };
  }
}

/**
 * Fetch Gravatar profile using MD5 hash of email.
 */
async function fetchGravatarProfile(email) {
  const hash = crypto.createHash("md5").update(email.toLowerCase().trim()).digest("hex");
  const gravatarUrl = `https://en.gravatar.com/${hash}.json`;

  try {
    const response = await axios.get(gravatarUrl, {
      headers: { "User-Agent": "DigitalFootprintAnalyzer/1.0" },
      timeout: 5000,
    });
    
    const entry = response.data?.entry?.[0];
    if (!entry) return null;

    // Extract profile links
    const profileLinks = [];
    if (entry.urls) {
      entry.urls.forEach(urlObj => {
        profileLinks.push({ title: urlObj.title, url: urlObj.value });
      });
    }
    
    // Extract accounts (Gravatar verified accounts like github, wordpress)
    const accounts = [];
    if (entry.accounts) {
      entry.accounts.forEach(acc => {
        accounts.push({
          domain: acc.domain,
          username: acc.username,
          url: acc.url,
          shortname: acc.shortname
        });
      });
    }

    return {
      hasProfile: true,
      hash,
      displayName: entry.displayName || null,
      name: entry.name ? `${entry.name.givenName || ""} ${entry.name.familyName || ""}`.trim() : null,
      username: entry.preferredUsername || null,
      aboutMe: entry.aboutMe || null,
      currentLocation: entry.currentLocation || null,
      avatarUrl: entry.thumbnailUrl || `https://www.gravatar.com/avatar/${hash}`,
      photos: entry.photos ? entry.photos.map(p => p.value) : [],
      profileLinks,
      accounts
    };
  } catch (error) {
    // 404 means no Gravatar profile found
    if (error.response && error.response.status === 404) {
      return { hasProfile: false, hash, avatarUrl: `https://www.gravatar.com/avatar/${hash}?d=identicon` };
    }
    console.error("[EmailScanner] Gravatar fetch error:", error.message);
    return { hasProfile: false, hash, avatarUrl: `https://www.gravatar.com/avatar/${hash}?d=identicon` };
  }
}

/**
 * Main email scanner service
 */
const emailScanner = async (email) => {
  if (!email || !email.includes("@")) return null;

  try {
    const [deliverability, gravatar, holeheResults] = await Promise.all([
      checkEmailDeliverability(email),
      fetchGravatarProfile(email),
      runHolehe(email)
    ]);

    return {
      email,
      deliverability,
      gravatar,
      holehe: holeheResults
    };
  } catch (error) {
    console.error("[EmailScanner] Global error:", error.message);
    return null;
  }
};

module.exports = emailScanner;
