import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const sitemapPath = join(dist, 'sitemap-0.xml');

if (!existsSync(sitemapPath)) {
  throw new Error('SEO check failed: dist/sitemap-0.xml does not exist. Run the Astro build first.');
}

const sitemap = readFileSync(sitemapPath, 'utf8');
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => ({
  xml: match[1],
  url: match[1].match(/<loc>(.*?)<\/loc>/)?.[1],
}));

const unwanted = entries
  .map(({ url }) => url)
  .filter(Boolean)
  .filter((url) => {
    const path = new URL(url).pathname;
    return path.startsWith('/tag/') ||
      /^\/\d+\/$/.test(path) ||
      /^\/category\/[^/]+\/\d+\/$/.test(path) ||
      path === '/category/codes/';
  });

if (unwanted.length) {
  throw new Error(`SEO check failed: noindex archive URLs found in sitemap:\n${unwanted.join('\n')}`);
}

const postSlugs = new Set();
const postSources = new Map();
const headingHierarchyErrors = [];
for (const file of readdirSync(join(process.cwd(), 'src/content/posts')).filter((name) => name.endsWith('.md'))) {
  const source = readFileSync(join(process.cwd(), 'src/content/posts', file), 'utf8');
  const slug = source.match(/^slug:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1];
  if (slug) {
    postSlugs.add(slug);
    postSources.set(slug, source);
  }

  let previousLevel = 1;
  for (const heading of source.matchAll(/^(#{2,6})\s+/gm)) {
    const level = heading[1].length;
    if (level > previousLevel + 1) {
      headingHierarchyErrors.push(`${file}: H${previousLevel} -> H${level}`);
    }
    previousLevel = level;
  }
}

if (headingHierarchyErrors.length) {
  throw new Error(
    `SEO check failed: Markdown heading levels are skipped:\n${headingHierarchyErrors.join('\n')}`,
  );
}

const articlesWithoutLastmod = entries.filter(({ url, xml }) => {
  if (!url) return false;
  const slug = new URL(url).pathname.split('/').filter(Boolean)[0];
  return postSlugs.has(slug) && !/<lastmod>/.test(xml);
});

if (articlesWithoutLastmod.length) {
  throw new Error(
    `SEO check failed: article URLs missing lastmod:\n${articlesWithoutLastmod.map(({ url }) => url).join('\n')}`,
  );
}

const assertNoindexFollow = (relativePath) => {
  const html = readFileSync(join(dist, relativePath), 'utf8');
  if (!/<meta name="robots" content="noindex, follow"\s*\/?>/.test(html)) {
    throw new Error(`SEO check failed: ${relativePath} is not noindex, follow.`);
  }
};

assertNoindexFollow('2/index.html');
assertNoindexFollow('category/game-guides/2/index.html');
assertNoindexFollow('category/codes/index.html');
assertNoindexFollow('tag/android/index.html');

const categoryTitleTypos = ['App Tipss', "AT's Best Pickss", 'Redeem Codess', 'Newss'];
const categoryTitleErrors = categoryTitleTypos.filter((title) =>
  readdirSync(join(dist, 'category')).some((slug) => {
    const page = join(dist, 'category', slug, 'index.html');
    return existsSync(page) && readFileSync(page, 'utf8').includes(title);
  }),
);

if (categoryTitleErrors.length) {
  throw new Error(`SEO check failed: category title pluralisation errors remain: ${categoryTitleErrors.join(', ')}`);
}

let enhancedArticleImages = 0;
let wrappedArticleTables = 0;
const articleMediaErrors = [];

for (const slug of postSources.keys()) {
  const page = join(dist, slug, 'index.html');
  if (!existsSync(page)) continue;

  const html = readFileSync(page, 'utf8');
  const articleBody = html.match(/<div class="article-body">([\s\S]*?)<aside class="gam-ad-slot"/)?.[1];
  if (articleBody === undefined) {
    articleMediaErrors.push(`${slug}: article body not found`);
    continue;
  }

  const images = articleBody.match(/<img\b[^>]*>/g) ?? [];
  enhancedArticleImages += images.length;
  for (const image of images) {
    const missing = [
      !/\swidth="\d+"/.test(image) && 'width',
      !/\sheight="\d+"/.test(image) && 'height',
      !/\sloading="lazy"/.test(image) && 'loading="lazy"',
      !/\sdecoding="async"/.test(image) && 'decoding="async"',
    ].filter(Boolean);
    if (missing.length) articleMediaErrors.push(`${slug}: inline image missing ${missing.join(', ')}`);
  }

  const tableCount = (articleBody.match(/<table\b/g) ?? []).length;
  const wrapperCount = (articleBody.match(/<div class="table-scroll">\s*<table\b/g) ?? []).length;
  wrappedArticleTables += wrapperCount;
  if (tableCount !== wrapperCount) {
    articleMediaErrors.push(`${slug}: ${tableCount} tables but ${wrapperCount} responsive wrappers`);
  }
}

if (articleMediaErrors.length) {
  throw new Error(`SEO check failed: article media enhancement errors:\n${articleMediaErrors.join('\n')}`);
}

const legacyCacheParameter = '?swcfpc=1';
const postsDir = join(process.cwd(), 'src/content/posts');
const postsWithLegacyLinks = readdirSync(postsDir)
  .filter((name) => name.endsWith('.md'))
  .filter((name) => readFileSync(join(postsDir, name), 'utf8').includes(legacyCacheParameter));

if (postsWithLegacyLinks.length) {
  throw new Error(
    `SEO check failed: legacy ${legacyCacheParameter} links remain in:\n${postsWithLegacyLinks.join('\n')}`,
  );
}

const robots = readFileSync(join(dist, 'robots.txt'), 'utf8');
if (/Disallow:\s*\/wp-(?:admin|login)/i.test(robots)) {
  throw new Error('SEO check failed: robots.txt prevents crawlers from seeing retired WordPress 404s.');
}

console.log(
  `SEO build check passed: ${entries.length} sitemap URLs; ` +
  `${entries.filter(({ xml }) => /<lastmod>/.test(xml)).length} article lastmod values; ` +
  `${enhancedArticleImages} enhanced inline images; ${wrappedArticleTables} responsive tables.`,
);
