import { getCollection } from 'astro:content';

export async function allPosts() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return posts.sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());
}

/* Articles that carry affiliate links need a visible disclosure. */
const AFFILIATE = /(amzn\.to|pxf\.io|temu\.to|tp\.media|tp\.st|awin1|shareasale)/i;
export const hasAffiliate = (body: string) => AFFILIATE.test(body);

export function related(post: any, pool: any[], n = 3) {
  const tags = new Set(post.data.tags);
  return pool
    .filter((p) => p.id !== post.id)
    .map((p) => ({
      p,
      score:
        (p.data.category === post.data.category ? 2 : 0) +
        p.data.tags.filter((t: string) => tags.has(t)).length,
    }))
    .sort((a, b) => b.score - a.score || b.p.data.publishDate - a.p.data.publishDate)
    .slice(0, n)
    .map((x) => x.p);
}
