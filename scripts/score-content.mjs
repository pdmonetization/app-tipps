import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const [file, rawKeyword] = process.argv.slice(2);
if (!file || !rawKeyword) {
  throw new Error('Usage: node scripts/score-content.mjs <post.md> "primary keyword"');
}

const source = readFileSync(file, 'utf8');
const [, frontmatter = '', body = ''] = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/) ?? [];
if (!frontmatter) throw new Error(`${file}: missing YAML frontmatter`);

const field = (name) => frontmatter.match(new RegExp(`^${name}:\\s*["']?([^"'\\r\\n]*)`, 'm'))?.[1]?.trim() ?? '';
const list = (name) => {
  const block = frontmatter.match(new RegExp(`^${name}:\\s*\\n((?:  - .*\\n?)+)`, 'm'))?.[1] ?? '';
  return [...block.matchAll(/^  -\s+(.+)$/gm)].map((match) => match[1].trim());
};
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const keyword = normalize(rawKeyword);
const containsKeyword = (value) => normalize(value).includes(keyword);
const title = field('seoTitle') || field('title');
const description = field('description');
const slug = field('slug');
const headings = [...body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);
const plainBody = body
  .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
  .replace(/[*_`>#|]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const words = plainBody ? plainBody.split(' ').length : 0;
const intro = plainBody.split(' ').slice(0, 120).join(' ');
const internalLinks = [...body.matchAll(/\]\(\/(?!\/)[^)]+\)/g)].length;
const externalLinks = [...body.matchAll(/\]\(https:\/\/[^)]+\)/g)].length;
const image = field('featuredImage');
const imageExists = image.startsWith('/') && existsSync(join(process.cwd(), 'public', image));
const paragraphs = body.split(/\n\s*\n/).filter((part) => part && !part.startsWith('#') && !part.startsWith('|') && !part.startsWith('- ') && !/^\d+\.\s/.test(part));
const longestParagraph = Math.max(0, ...paragraphs.map((paragraph) => paragraph.split(/\s+/).length));

const checks = [
  [10, 'primary keyword in SEO title', containsKeyword(title)],
  [5, 'SEO title is 35–60 characters', title.length >= 35 && title.length <= 60],
  [10, 'description is 120–160 characters', description.length >= 120 && description.length <= 160],
  [5, 'primary keyword in description', containsKeyword(description)],
  [5, 'primary keyword in slug', containsKeyword(slug)],
  [8, 'primary keyword in opening 120 words', containsKeyword(intro)],
  [5, 'primary keyword in an H2', headings.some(containsKeyword)],
  [5, 'at least five H2 sections', headings.length >= 5],
  [10, 'body is 1,200–2,600 words', words >= 1200 && words <= 2600],
  [8, 'at least two contextual internal links', internalLinks >= 2],
  [4, 'at least one authoritative external link', externalLinks >= 1],
  [8, 'optimized feature image and descriptive alt text', imageExists && field('featuredImageAlt').length >= 20],
  [4, 'author and publication/update dates present', Boolean(field('author') && field('publishDate') && field('updatedDate'))],
  [4, 'actionable list or comparison table present', /^\|.+\|$/m.test(body) || /^\d+\.\s/m.test(body)],
  [4, 'at least three curated related articles', list('relatedSlugs').length >= 3],
  [5, 'readable paragraph length', longestParagraph <= 120],
];

const score = checks.reduce((total, [points, , passed]) => total + (passed ? points : 0), 0);
console.log(`${file}: ${score}/100`);
console.log(`  ${words} words; title ${title.length} chars; description ${description.length} chars; ${headings.length} H2s; ${internalLinks} internal links; ${externalLinks} external links`);
for (const [points, label, passed] of checks) console.log(`  ${passed ? 'PASS' : 'FAIL'} ${points.toString().padStart(2)} ${label}`);
if (score < 90) process.exitCode = 1;
