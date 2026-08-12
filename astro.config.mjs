import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import thinTags from './src/lib/thin-tags.json' with { type: 'json' };

/* Pages that carry a noindex must not appear in the sitemap. */
const NOINDEX = new Set([
  ...thinTags.map((t) => `/tag/${t}/`),
  '/newsletter/', '/404/', '/410/', '/admin/',
]);

export default defineConfig({
  site: 'https://app-tipps.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !NOINDEX.has(path);
      },
      serialize(item) {
        if (item.url === 'https://app-tipps.com/') item.priority = 1.0;
        return item;
      },
    }),
  ],
  image: { responsiveStyles: true },
});
