import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE = 'https://app-tipps.com';
const dist = join(process.cwd(), 'dist');

if (!existsSync(dist)) {
  throw new Error('Internal-link check failed: dist does not exist. Run the Astro build first.');
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const item = join(dir, name);
    return statSync(item).isDirectory() ? walk(item) : [item];
  });
}

function pagePath(file) {
  const rel = relative(dist, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

function destinationExists(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  const clean = decoded.replace(/^\/+/, '').replace(/\/{2,}/g, '/');
  if (!clean) return existsSync(join(dist, 'index.html'));

  const candidates = [
    join(dist, clean),
    join(dist, clean.replace(/\/$/, ''), 'index.html'),
    join(dist, `${clean.replace(/\/$/, '')}.html`),
  ];
  return candidates.some((candidate) => existsSync(candidate));
}

const broken = new Map();
const files = walk(dist).filter((file) => file.endsWith('.html'));

for (const file of files) {
  const sourcePath = pagePath(file);
  if (sourcePath === '/404.html' || sourcePath === '/410/') continue;

  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<a\b[^>]*\bhref=(["'])(.*?)\1/gi)) {
    const href = match[2].replaceAll('&amp;', '&').trim();
    if (!href || href.startsWith('#') || /^(?:mailto:|tel:|javascript:)/i.test(href)) continue;

    let url;
    try {
      url = new URL(href, new URL(sourcePath, SITE));
    } catch {
      continue;
    }
    if (url.origin !== SITE || destinationExists(url.pathname)) continue;

    const target = url.pathname;
    if (!broken.has(target)) broken.set(target, new Set());
    broken.get(target).add(sourcePath);
  }
}

if (broken.size) {
  const details = [...broken.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([target, sources]) => `${target} <- ${[...sources].slice(0, 8).join(', ')}`)
    .join('\n');
  throw new Error(`Internal-link check failed: ${broken.size} broken targets found.\n${details}`);
}

console.log(`Internal-link check passed across ${files.length} generated HTML pages.`);
