import { getCollection } from 'astro:content';
import legacyRoutes from '../data/legacy-routes.json';
import retiredPostSlugs from '../data/retired-posts.json';

/*
 * Articles intentionally withdrawn from publication.
 *
 * Keeping the source Markdown for now makes the removal reversible, but these
 * slugs are excluded from every generated article/archive page and sitemap.
 * The Cloudflare edge router returns the production 410 Gone response.
 */
const RETIRED_SLUGS = new Set(retiredPostSlugs);
const REDIRECTED_SLUGS = new Set(
  Object.keys(legacyRoutes.redirects)
    .map((path) => path.split('/').filter(Boolean))
    .filter((parts) => parts.length === 1)
    .map(([slug]) => slug),
);

export async function allPosts() {
  const posts = await getCollection(
    'posts',
    ({ data }) =>
      !data.draft &&
      !RETIRED_SLUGS.has(data.slug) &&
      !REDIRECTED_SLUGS.has(data.slug),
  );
  return posts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

/* Articles that carry affiliate links need a visible disclosure. */
const AFFILIATE = /(amzn\.to|pxf\.io|temu\.to|tp\.media|tp\.st|awin1|shareasale)/i;
export const hasAffiliate = (body: string) => AFFILIATE.test(body);

export function related(post: any, pool: any[], n = 3) {
  const curatedSlugs: string[] = post.data.relatedSlugs ?? [];
  if (curatedSlugs.length > 0) {
    const bySlug = new Map(pool.map((candidate) => [candidate.data.slug, candidate]));
    const missing = curatedSlugs.filter((slug) => !bySlug.has(slug));
    if (missing.length > 0) {
      throw new Error(`Missing curated related posts for ${post.data.slug}: ${missing.join(', ')}`);
    }
    return curatedSlugs.slice(0, n).map((slug) => bySlug.get(slug));
  }

  const genericTags = new Set([
    'android',
    'ios',
    'apps',
    'game',
    'news',
    'single player',
    'multiplayer',
    'lifestyle apps',
    'productivity apps',
  ]);
  const tags = new Set(post.data.tags.map((tag: string) => tag.toLowerCase()));
  return pool
    .filter((p) => p.id !== post.id)
    .map((p) => ({
      p,
      score:
        (p.data.category === post.data.category ? 1 : 0) +
        p.data.tags.reduce((score: number, tag: string) => {
          const normalized = tag.toLowerCase();
          if (!tags.has(normalized)) return score;
          return score + (genericTags.has(normalized) ? 0.15 : 4);
        }, 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.p.data.publishDate - a.p.data.publishDate)
    .slice(0, n)
    .map((x) => x.p);
}
