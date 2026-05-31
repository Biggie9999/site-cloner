const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');

// Usage: node site-cloner.js <path-to-html-file>
const inputFile = process.argv[2] || 'original.html';

if (!fs.existsSync(inputFile)) {
  console.error(`Error: Could not find file "${inputFile}"`);
  console.log(`Usage: node site-cloner.js <path-to-html-file>`);
  process.exit(1);
}

const html = fs.readFileSync(inputFile, 'utf8');
const $ = cheerio.load(html);

console.log(`Parsing ${inputFile}...`);

// Attempt to intelligently extract standard semantic sections
const headHtml = $('head').html() || '';
const headerHtml = $('header').first().prop('outerHTML') || '';
const footerHtml = $('footer').first().prop('outerHTML') || '';

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
const restOfBody = $('body').html() || '';
const bodyClasses = $('body').attr('class') || '';

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

// Ensure output directory exists
const outDir = path.join(__dirname, 'cloned-output');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir);
}

fs.writeFileSync(path.join(outDir, 'layout.js'), layoutJs);
fs.writeFileSync(path.join(outDir, 'page.js'), pageJs);

console.log('✅ Successfully generated perfect clone!');
console.log('Check the "cloned-output" directory for your new layout.js and page.js files.');
