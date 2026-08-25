import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const BASE = '/app-tipps';

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function rewriteText(text, ext) {
  // GitHub project Pages are hosted below /app-tipps/. Prefix root-relative
  // links/assets while leaving protocol-relative and already-prefixed URLs alone.
  text = text
    .replace(/(href|src|action)=(['"])\/(?!\/|app-tipps\/)/g, `$1=$2${BASE}/`)
    .replace(/srcset=(['"])([^'"]*)\1/g, (_match, quote, value) => {
      const rewritten = value.replace(/(^|,\s*)\/(?!\/|app-tipps\/)/g, `$1${BASE}/`);
      return `srcset=${quote}${rewritten}${quote}`;
    });

  if (ext === '.css') {
    text = text.replace(/url\((['"]?)\/(?!\/|app-tipps\/)/g, `url($1${BASE}/`);
  }

  if (ext === '.html') {
    // Prevent the temporary preview from competing with the production domain.
    if (!/<meta\s+name=["']robots["']/i.test(text)) {
      text = text.replace(/<head([^>]*)>/i, `<head$1>\n<meta name="robots" content="noindex,nofollow,noarchive">`);
    }
  }

  return text;
}

for (const file of walk(DIST)) {
  const ext = path.extname(file).toLowerCase();
  if (!['.html', '.css'].includes(ext)) continue;
  const original = fs.readFileSync(file, 'utf8');
  const rewritten = rewriteText(original, ext);
  if (rewritten !== original) fs.writeFileSync(file, rewritten);
}

// GitHub Pages uses Jekyll by default for branch publishing. The Actions artifact
// does not need it, but .nojekyll makes the intent explicit and protects _astro.
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');

console.log('Prepared dist/ for GitHub Pages preview at /app-tipps/.');
