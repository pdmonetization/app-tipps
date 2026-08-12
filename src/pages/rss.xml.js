import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../consts';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft && !data.noindex))
    .sort((a, b) => b.data.publishDate - a.data.publishDate)
    .slice(0, 40);
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    items: posts.map((p) => ({
      title: p.data.title,
      description: p.data.description,
      pubDate: p.data.publishDate,
      link: `/${p.data.slug}/`,
      categories: p.data.tags,
      author: p.data.author,
    })),
    customData: `<language>en-us</language>`,
  });
}
