import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE_URL = 'https://app-tipps.com';

const unquote = (value) => value.trim().replace(/^(["'])(.*)\1$/, '$2');

/*
 * Astro's sitemap integration cannot read content collection data directly
 * from astro.config.mjs. Read only the few frontmatter fields the sitemap
 * needs so each article can carry an honest last-modified date.
 */
function articleLastmodByUrl() {
  const postsDir = join(process.cwd(), 'src/content/posts');
  const result = new Map();

  for (const file of readdirSync(postsDir).filter((name) => name.endsWith('.md'))) {
    const source = readFileSync(join(postsDir, file), 'utf8');
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
    if (!frontmatter) continue;

    const field = (name) => {
      const value = frontmatter.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1];
      return value ? unquote(value) : undefined;
    };

    const slug = field('slug');
    const published = field('publishDate');
    const updated = field('updatedDate');
    if (!slug || !published || field('draft') === 'true' || field('noindex') === 'true') continue;

    const dates = [published, updated]
      .filter(Boolean)
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.valueOf()));
    if (!dates.length) continue;

    result.set(
      new URL(`/${slug}/`, SITE_URL).href,
      new Date(Math.max(...dates.map((date) => date.valueOf()))),
    );
  }

  return result;
}

const ARTICLE_LASTMOD = articleLastmodByUrl();

/* Pages that carry a noindex must not appear in the sitemap. */
const NOINDEX = new Set([
  '/newsletter/', '/404/', '/410/', '/admin/',
]);

const isPagination = (path) =>
  /^\/\d+\/$/.test(path) || /^\/category\/[^/]+\/\d+\/$/.test(path);

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !NOINDEX.has(path) && !path.startsWith('/tag/') && !isPagination(path);
      },
      serialize(item) {
        if (item.url === 'https://app-tipps.com/') item.priority = 1.0;
        const lastmod = ARTICLE_LASTMOD.get(item.url);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  image: { responsiveStyles: true },
});
