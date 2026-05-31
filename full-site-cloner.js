const scrape = require('website-scraper');
const PuppeteerPlugin = require('website-scraper-puppeteer');
const path = require('path');

const targetUrl = process.argv[2];

if (!targetUrl) {
  console.log(`Usage: node full-site-cloner.js <url>`);
  console.log(`Example: node full-site-cloner.js https://example.com`);
  process.exit(1);
}

// Get the domain to ensure we only scrape internal sublinks, not external sites
const urlObj = new URL(targetUrl);
const domain = urlObj.hostname;

console.log(`Starting massive recursive clone of ${targetUrl}...`);
console.log(`This will download ALL sublinks, CSS, Images, and execute Javascript. This might take a while!`);

scrape({
  urls: [targetUrl],
  directory: path.join(__dirname, 'full-website-clone'),
  // Set recursive to true to follow all sublinks
  recursive: true,
  // Limit how deep it clicks into the website (set to null for infinite recursion to clone the entire ecosystem)
  maxRecursiveDepth: null, 
  filenameGenerator: 'bySiteStructure',
  urlFilter: function(url) {
    // ONLY download links that belong to the exact same website domain
    return url.includes(domain);
  },
  plugins: [
    new PuppeteerPlugin({
      launchOptions: { headless: 'new' }, // Use headless browser to execute React/Vue JS
      scrollToBottom: { timeout: 10000, viewportN: 10 }, // Scroll to load lazy-loaded images
    })
  ]
}).then(() => {
  console.log('✅ Entire website cloned successfully!');
  console.log('Open the "full-website-clone" folder to see all HTML, CSS, and Images.');
}).catch((err) => {
  console.error('❌ Error cloning website:', err);
});
