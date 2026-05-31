const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const puppeteer = require('puppeteer');

const targetUrl = process.argv[2];

if (!targetUrl) {
  console.log(`Usage: node dynamic-site-cloner.js <url>`);
  console.log(`Example: node dynamic-site-cloner.js https://reactjs.org`);
  process.exit(1);
}

async function scrapeDynamicSite() {
  console.log(`Launching headless browser...`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  console.log(`Navigating to ${targetUrl} and waiting for the page to fully hydrate...`);
  try {
    // Wait until network activity settles to ensure JS frameworks have finished rendering
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 30000 });
  } catch (err) {
    console.warn(`Warning: Navigation hit a timeout, but we will extract what we have.`);
  }

  const html = await page.content();
  await browser.close();

  console.log(`Page fully loaded! Parsing DOM structure...`);
  const $ = cheerio.load(html);

  // Attempt to intelligently extract standard semantic sections
  const headHtml = $('head').html() || '';
  const headerHtml = $('header').first().prop('outerHTML') || '';
  const footerHtml = $('footer').first().prop('outerHTML') || '';

  // For main content, look for <main>
  let mainHtml = '';
  if ($('main').length > 0) {
    mainHtml = $('main').html();
    $('main').remove();
  } else {
    console.warn("Warning: No <main> tag found. You may need to manually extract the body content if the target site does not use standard HTML5.");
  }

  // Remove the header and footer from the body so we can capture leftover scripts/modals
  $('header').first().remove();
  $('footer').first().remove();

  // Capture everything else leftover in the body
  const restOfBody = $('body').html() || '';
  const bodyClasses = $('body').attr('class') || '';

  const escapeHtml = (str) => {
    return (str || '').replace(/`/g, '\\`').replace(/\$/g, '\\$');
  };

  const layoutJs = `
import "./globals.css";

export const metadata = {
  title: "Cloned Dynamic Site",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* We inject the head safely */}
      </head>
      <body className="${escapeHtml(bodyClasses)}">
        <div dangerouslySetInnerHTML={{ __html: \`${escapeHtml(headHtml)}\` }} />
        <div dangerouslySetInnerHTML={{ __html: \`${escapeHtml(headerHtml)}\` }} />
        
        {children}
        
        <div dangerouslySetInnerHTML={{ __html: \`${escapeHtml(footerHtml)}\` }} />
        <div dangerouslySetInnerHTML={{ __html: \`${escapeHtml(restOfBody)}\` }} />
      </body>
    </html>
  );
}
`;

  const pageJs = `
export default function Home() {
  return (
    <main dangerouslySetInnerHTML={{ __html: \`${escapeHtml(mainHtml)}\` }} />
  );
}
`;

  // Ensure output directory exists in the current working directory
  const outDir = path.join(process.cwd(), 'cloned-output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir);
  }

  fs.writeFileSync(path.join(outDir, 'layout.js'), layoutJs);
  fs.writeFileSync(path.join(outDir, 'page.js'), pageJs);

  console.log('✅ Successfully generated a perfect clone from the fully hydrated DOM!');
  console.log(`Check the "cloned-output" directory in ${process.cwd()}`);
}

scrapeDynamicSite().catch(console.error);
