import fs from 'fs';
import * as cheerio from 'cheerio';
import path from 'path';
import puppeteer from 'puppeteer';

const targetUrl = process.argv[2];
const maxDepth = parseInt(process.argv[3]) || 1; // Default depth 1 (root only)

if (!targetUrl) {
  console.log(`Usage: node dynamic-site-cloner.js <url> [maxDepth]`);
  console.log(`Example: node dynamic-site-cloner.js https://reactjs.org 2`);
  process.exit(1);
}

const outDir = path.join(process.cwd(), 'cloned-output');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

const escapeHtml = (str) => {
  return (str || '').replace(/`/g, '\\`').replace(/\$/g, '\\$');
};

const resolveUrl = (base, relative) => {
  try {
    return new URL(relative, base).href;
  } catch (e) {
    return null;
  }
};

const getPathname = (urlStr) => {
  try {
    let p = new URL(urlStr).pathname;
    if (p.endsWith('/')) p = p.slice(0, -1);
    if (!p) p = '/';
    return p;
  } catch (e) {
    return '/';
  }
};

async function scrapeDynamicSite() {
  console.log(`Launching headless browser...`);
  const browser = await puppeteer.launch();
  
  const queue = [{ url: targetUrl, depth: 1 }];
  const visited = new Set([targetUrl]);
  const baseUrlObj = new URL(targetUrl);
  const baseDomain = baseUrlObj.hostname;

  let isFirstPage = true;

  while (queue.length > 0) {
    const { url, depth } = queue.shift();
    console.log(`\n[Depth ${depth}/${maxDepth}] Navigating to ${url}...`);

    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    } catch (err) {
      console.warn(`Warning: Navigation hit a timeout, extracting what we have.`);
    }

    const html = await page.content();
    await page.close();

    const $ = cheerio.load(html);

    // Convert relative asset URLs to absolute URLs
    $('img, script, source, video, iframe').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        const absUrl = resolveUrl(url, src);
        if (absUrl) $(el).attr('src', absUrl);
      }
    });
    $('link').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const absUrl = resolveUrl(url, href);
        if (absUrl) $(el).attr('href', absUrl);
      }
    });
    $('a').each((_, el) => {
        const href = $(el).attr('href');
        // Let's only make it absolute if it's an external resource or just leave anchors alone
        // Wait, for NextJS to work smoothly, if we keep them relative they'll try to route via Next
        // We will leave anchors alone to maintain routing if they clicked around inside the NextJS clone.
    });

    // Enqueue links if we haven't reached maxDepth
    if (depth < maxDepth) {
      $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href) {
          const absUrl = resolveUrl(url, href);
          if (absUrl) {
            try {
              const u = new URL(absUrl);
              // Only follow links on same domain without hashes
              u.hash = '';
              const cleanUrl = u.href;
              // Ignore mailto, tel, etc.
              if (u.protocol.startsWith('http') && u.hostname === baseDomain && !visited.has(cleanUrl)) {
                visited.add(cleanUrl);
                queue.push({ url: cleanUrl, depth: depth + 1 });
              }
            } catch(e) {}
          }
        }
      });
    }

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
      console.warn("Warning: No <main> tag found. You may need to manually extract the body content.");
    }

    // Remove the header and footer from the body so we can capture leftover scripts/modals
    $('header').first().remove();
    $('footer').first().remove();

    // Capture everything else leftover in the body
    const restOfBody = $('body').html() || '';
    const bodyClasses = $('body').attr('class') || '';

    // Determine output directory based on pathname
    const p = getPathname(url);
    let pageDir = outDir;
    if (p !== '/') {
      pageDir = path.join(outDir, p);
      fs.mkdirSync(pageDir, { recursive: true });
    }

    if (isFirstPage) {
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
      fs.writeFileSync(path.join(outDir, 'layout.js'), layoutJs);
      isFirstPage = false;
    }

    const pageJs = `
export default function Page() {
  return (
    <main dangerouslySetInnerHTML={{ __html: \`${escapeHtml(mainHtml)}\` }} />
  );
}
`;
    fs.writeFileSync(path.join(pageDir, 'page.js'), pageJs);
    console.log(`✅ Generated page.js for ${p}`);
  }

  await browser.close();
  console.log(`\n🎉 Successfully generated Next.js clone!`);
  console.log(`Check the "cloned-output" directory in ${process.cwd()}`);
}

scrapeDynamicSite().catch(console.error);
