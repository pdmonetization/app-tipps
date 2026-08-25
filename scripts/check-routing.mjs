import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import legacyRoutes from '../src/data/legacy-routes.json' with { type: 'json' };
import retiredPostSlugs from '../src/data/retired-posts.json' with { type: 'json' };

const root = process.cwd();
const dist = join(root, 'dist');
const sitemapPath = join(dist, 'sitemap-0.xml');

if (!existsSync(sitemapPath)) {
  throw new Error('Routing check failed: build output is missing. Run the Astro build first.');
}
if (existsSync(join(root, 'public', '_redirects'))) {
  throw new Error('Routing check failed: public/_redirects duplicates the canonical routing manifest.');
}

const redirects = new Map(Object.entries(legacyRoutes.redirects));
const gone = new Set(legacyRoutes.gone);
const retiredPaths = new Set(retiredPostSlugs.map((slug) => `/${slug}/`));
const sitemap = readFileSync(sitemapPath, 'utf8');
const sitemapPaths = new Set(
  [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]).pathname),
);

const errors = [];
const sortedGone = [...legacyRoutes.gone].sort((a, b) => a.localeCompare(b));
if (new Set(legacyRoutes.gone).size !== legacyRoutes.gone.length) {
  errors.push('legacy gone paths contain duplicates');
}
if (JSON.stringify(sortedGone) !== JSON.stringify(legacyRoutes.gone)) {
  errors.push('legacy gone paths are not sorted');
}
if (new Set(retiredPostSlugs).size !== retiredPostSlugs.length) {
  errors.push('retired post slugs contain duplicates');
}

const outputFor = (route) => {
  if (route === '/') return join(dist, 'index.html');
  const relative = route.replace(/^\/+|\/+$/g, '');
  const direct = join(dist, relative);
  return route.endsWith('/') ? join(direct, 'index.html') : direct;
};

for (const [source, target] of redirects) {
  if (source === target) errors.push(`${source}: self redirect`);
  if (redirects.has(target)) errors.push(`${source}: redirect chain through ${target}`);
  if (gone.has(source) || retiredPaths.has(source)) errors.push(`${source}: both redirect and gone`);
  if (gone.has(target) || retiredPaths.has(target)) errors.push(`${source}: target ${target} is gone`);
  if (!existsSync(outputFor(target))) errors.push(`${source}: target ${target} is missing from dist`);

  const fallback = outputFor(source);
  if (!existsSync(fallback)) {
    errors.push(`${source}: GitHub Pages fallback was not generated`);
  } else if (!readFileSync(fallback, 'utf8').includes('legacy-redirect-fallback')) {
    errors.push(`${source}: redirect source collides with a real generated page`);
  }
  if (sitemapPaths.has(source)) errors.push(`${source}: redirect source is in the sitemap`);
}

for (const path of [...gone, ...retiredPaths]) {
  if (sitemapPaths.has(path)) errors.push(`${path}: gone URL is in the sitemap`);
  if (existsSync(outputFor(path))) errors.push(`${path}: gone URL was generated as a page`);
}

for (const { from, to } of legacyRoutes.prefixRedirects) {
  if (!from.endsWith('/')) errors.push(`${from}: redirect prefix must end in /`);
  if (!existsSync(outputFor(to))) errors.push(`${from}: prefix target ${to} is missing from dist`);
}
for (const prefix of legacyRoutes.gonePrefixes) {
  if (!prefix.endsWith('/')) errors.push(`${prefix}: gone prefix must end in /`);
}

const activePostPaths = new Set();
for (const file of readdirSync(join(root, 'src/content/posts')).filter((name) => name.endsWith('.md'))) {
  const source = readFileSync(join(root, 'src/content/posts', file), 'utf8');
  const slug = source.match(/^slug:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1];
  if (slug && !/^draft:\s*true\s*$/m.test(source) && !retiredPaths.has(`/${slug}/`)) {
    activePostPaths.add(`/${slug}/`);
  }
}
for (const path of activePostPaths) {
  if (gone.has(path)) errors.push(`${path}: active post is marked gone`);
}

if (errors.length) {
  throw new Error(`Routing check failed:\n${errors.join('\n')}`);
}

console.log(
  `Routing check passed: ${redirects.size} one-hop redirects, ` +
  `${gone.size} legacy gone paths, ${retiredPaths.size} retired articles, ` +
  `${legacyRoutes.gonePrefixes.length} retired path prefixes.`,
);
