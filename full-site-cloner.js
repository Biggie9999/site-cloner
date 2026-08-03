import scrape from 'website-scraper';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetUrl = process.argv[2];
const maxDepth = parseInt(process.argv[3]) || 3;

if (!targetUrl) {
  console.log(`Usage: node full-site-cloner.js <url> [depth]`);
  console.log(`Example: node full-site-cloner.js https://example.com 3`);
  process.exit(1);
}

// Auto-generate unique folder name using domain + timestamp
const urlObj = new URL(targetUrl);
const domain = urlObj.hostname.replace(/\./g, '-');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outputDir = path.join(__dirname, `clone_${domain}_${timestamp}`);

let downloaded = 0;
let queued = 0;
let startTime = Date.now();

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function drawProgress() {
  const elapsed = Date.now() - startTime;
  const rate = downloaded / (elapsed / 1000);
  const barWidth = 30;
  const pct = queued > 0 ? Math.min(downloaded / queued, 1) : 0;
  const filled = Math.floor(pct * barWidth);
  const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
  const percent = (pct * 100).toFixed(1);

  if (process.stdout.clearLine && process.stdout.cursorTo) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(
      `[${bar}] ${percent}% | ✅ ${downloaded} saved | 🔗 ${queued} found | ⚡ ${rate.toFixed(1)}/s | ⏱ ${formatTime(elapsed)}`
    );
  } else {
    // In non-TTY environments, just log occasionally
    if (downloaded % 10 === 0) {
      console.log(`✅ ${downloaded} saved | 🔗 ${queued} found | ⚡ ${rate.toFixed(1)}/s`);
    }
  }
}

class ProgressPlugin {
  apply(registerAction) {
    registerAction('beforeRequest', ({ resource }) => {
      queued++;
      drawProgress();
    });
    registerAction('onResourceSaved', ({ resource }) => {
      downloaded++;
      drawProgress();
    });
    registerAction('onResourceError', ({ resource, error }) => {
      // silently skip errors
    });
  }
}

class StealthPuppeteerPlugin {
  constructor (options = {}) {
    this.launchOptions = options.launchOptions || {};
    this.gotoOptions = options.gotoOptions || {};
    this.browser = null;
    this.headers = {};
  }

  apply (registerAction) {
    registerAction('beforeStart', async () => {
      this.browser = await puppeteer.launch(this.launchOptions);
    });

    registerAction('beforeRequest', async ({requestOptions}) => {
      if (requestOptions.headers && Object.keys(requestOptions.headers).length > 0) {
        this.headers = Object.assign({}, requestOptions.headers);
      }
      return {requestOptions};
    });

    registerAction('afterResponse', async ({response}) => {
      const contentType = response.headers['content-type'];
      const isHtml = contentType && contentType.split(';')[0] === 'text/html';
      if (isHtml) {
        const url = response.url;
        const page = await this.browser.newPage();

        if (this.headers && Object.keys(this.headers).length > 0) {
          await page.setExtraHTTPHeaders(this.headers);
        }

        await page.goto(url, this.gotoOptions);
        
        const content = await page.content();
        await page.close();
        return Buffer.from(content).toString('binary');
      } else {
        return response.body;
      }
    });

    registerAction('afterFinish', () => this.browser && this.browser.close());
  }
}

console.log(`\n🌐 Starting clone of ${targetUrl}`);
console.log(`📁 Saving to: ${outputDir}`);
console.log(`🔢 Max depth: ${maxDepth} levels`);
console.log(`⚙️  Concurrency: 2 pages at a time`);
console.log(`⏳ This may take a while...\n`);

scrape({
  urls: [targetUrl],
  directory: outputDir,
  recursive: true,
  maxDepth: maxDepth,
  maxConcurrency: 2,
  plugins: [
    new ProgressPlugin(),
    new StealthPuppeteerPlugin({ launchOptions: { headless: 'new' }, gotoOptions: { waitUntil: 'networkidle2', timeout: 30000 } })
  ]
}).then(() => {
  process.stdout.write('\n\n✅ Done! Site cloned successfully.\n');
  console.log(`📂 Files saved to: ${outputDir}`);
  console.log(`⏱  Total time: ${formatTime(Date.now() - startTime)}`);
}).catch((err) => {
  process.stdout.write('\n\n❌ Error: ' + err.message + '\n');
});
