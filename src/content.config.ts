import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null ? undefined : value;

const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional());
const optionalNumber = z.preprocess(emptyToUndefined, z.number().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: optionalDate,
    author: z.string().default('App-Tipps Editorial'),
    category: z.string(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    relatedSlugs: z.array(z.string()).default([]),
    description: z.string(),
    featuredImage: optionalString,
    featuredImageAlt: optionalString,
    seoTitle: optionalString,
    rating: optionalNumber,
    correctionNote: optionalString,
    canonicalUrl: optionalString,
    noindex: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
