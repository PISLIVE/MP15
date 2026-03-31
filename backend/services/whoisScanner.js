const whois = require('whois-json');

const whoisScanner = async (domain) => {
  if (!domain || typeof domain !== 'string') return null;

  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return null;
  }

  try {
    const results = await whois(domain);
    
    // Clean up to return only useful info
    return {
      domainName: results.domainName || domain,
      registrar: results.registrar || 'Unknown',
      creationDate: results.creationDate || 'Unknown',
      expirationDate: results.registryExpiryDate || 'Unknown',
      nameServers: results.nameServer ? results.nameServer.split(' ') : [],
      registrantCountry: results.registrantCountry || 'Unknown',
    };
  } catch (error) {
    console.error(`WHOIS lookup failed for ${domain}:`, error.message);
    return null;
  }
};

module.exports = whoisScanner;
