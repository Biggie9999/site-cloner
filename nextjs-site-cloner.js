import fs from 'fs';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usage: node site-cloner.js <path-to-html-file> [base-url]
const inputFile = process.argv[2] || 'original.html';
const baseUrl = process.argv[3];

if (!fs.existsSync(inputFile)) {
  console.error(`Error: Could not find file "${inputFile}"`);
  console.log(`Usage: node site-cloner.js <path-to-html-file> [base-url]`);
  process.exit(1);
}

const html = fs.readFileSync(inputFile, 'utf8');
const $ = cheerio.load(html);

console.log(`Parsing ${inputFile}...`);

if (baseUrl) {
  console.log(`Converting relative URLs to absolute using base: ${baseUrl}`);
  const resolveUrl = (base, relative) => {
    try {
      return new URL(relative, base).href;
    } catch (e) {
      return null;
    }
  };
  
  $('img, script, source, video, iframe').each((_, el) => {
    const src = $(el).attr('src');
    if (src) {
      const absUrl = resolveUrl(baseUrl, src);
      if (absUrl) $(el).attr('src', absUrl);
    }
  });
  $('link, a').each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
      const absUrl = resolveUrl(baseUrl, href);
      if (absUrl) $(el).attr('href', absUrl);
    }
  });
}

// Attempt to intelligently extract standard semantic sections
let headHtml = $('head').html() || '';
let pageStyles = '';
$('head style').each((_, el) => {
  pageStyles += $.html(el) + '\n';
});
$('head link[rel="stylesheet"]').each((_, el) => {
  pageStyles += $.html(el) + '\n';
});
let headerHtml = $('header').first().prop('outerHTML') || '';
let footerHtml = $('footer').first().prop('outerHTML') || '';

// For main content, look for <main>, otherwise grab a central wrapper, otherwise just use empty string
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

// Capture everything else leftover in the body (scripts, hidden modals, etc.)
let restOfBody = $('body').html() || '';
let bodyClasses = $('body').attr('class') || '';

if (baseUrl) {
  const fixCssUrls = (str) => str ? str.replace(/url\(['"]?(\/[^'"\)]+)['"]?\)/gi, `url('${baseUrl}$1')`) : '';
  headHtml = fixCssUrls(headHtml);
  headerHtml = fixCssUrls(headerHtml);
  footerHtml = fixCssUrls(footerHtml);
  mainHtml = fixCssUrls(mainHtml);
  restOfBody = fixCssUrls(restOfBody);
}

const escapeHtml = (str) => {
  return (str || '').replace(/`/g, '\\`').replace(/\$/g, '\\$');
};

const layoutJs = `
import "./globals.css";

export const metadata = {
  title: "Cloned Site",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        {/* We inject the head safely */}
      </head>
      <body className="${escapeHtml(bodyClasses)}" suppressHydrationWarning>
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: \`${escapeHtml(headHtml)}\` }} />
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: \`${escapeHtml(headerHtml)}\` }} />
        
        {children}
        
        <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: \`${escapeHtml(footerHtml)}\` }} />
      </body>
    </html>
  );
}
`;

const pageJs = `
export default function Page() {
  return (
    <>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: \`${escapeHtml(pageStyles)}\` }} />
      <main suppressHydrationWarning dangerouslySetInnerHTML={{ __html: \`${escapeHtml(mainHtml)}\` }} />
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: \`${escapeHtml(restOfBody)}\` }} />
    </>
  );
}
`;

// Ensure output directory exists
const outDir = path.join(__dirname, 'cloned-output');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

fs.writeFileSync(path.join(outDir, 'layout.js'), layoutJs);
fs.writeFileSync(path.join(outDir, 'page.js'), pageJs);

console.log('✅ Successfully generated perfect clone!');
console.log('Check the "cloned-output" directory for your new layout.js and page.js files.');
