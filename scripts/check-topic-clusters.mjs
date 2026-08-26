import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import topicClusters from '../src/data/topic-clusters.json' with { type: 'json' };

const dist = join(process.cwd(), 'dist');
const postsDir = join(process.cwd(), 'src/content/posts');

if (!existsSync(dist)) {
  throw new Error('Topic-cluster check failed: dist does not exist. Run the Astro build first.');
}

function frontmatterField(source, name) {
  const value = source.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  return value?.replace(/^(?:["'])(.*)(?:["'])$/, '$1');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function localLinks(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref=["']\/([^"'#?]+)\/?["'][^>]*>/gi)]
    .map((match) => match[1].replace(/\/$/, ''));
}

function isIndexable(html) {
  return /<meta\b[^>]*name=["']robots["'][^>]*content=["']index,\s*follow(?:,|["'])/i.test(html);
}

const sourceBySlug = new Map();
for (const file of readdirSync(postsDir).filter((name) => name.endsWith('.md'))) {
  const source = readFileSync(join(postsDir, file), 'utf8');
  const slug = frontmatterField(source, 'slug');
  if (slug) sourceBySlug.set(slug, file);
}

const errors = [];
const globallyDeclared = new Map();
let checkedPages = 0;

for (const [key, cluster] of Object.entries(topicClusters)) {
  const members = cluster.members ?? [];
  if (!cluster.name || !cluster.title || !cluster.description) {
    errors.push(`${key}: cluster needs a name, search title and description`);
  }
  if (members.length < 4) {
    errors.push(`${key}: cluster needs at least four pages to guarantee three relevant connections per page`);
  }

  const memberSlugs = members.map(({ slug }) => slug);
  const memberSet = new Set(memberSlugs);
  if (memberSet.size !== members.length) errors.push(`${key}: cluster contains duplicate member slugs`);

  const incoming = new Map(memberSlugs.map((slug) => [slug, new Set()]));
  const hubSlug = `guides/${key}`;
  const hubPage = join(dist, 'guides', key, 'index.html');
  if (!existsSync(hubPage)) {
    errors.push(`${key}: indexable topic hub was not generated`);
  } else {
    checkedPages += 1;
    const hubHtml = readFileSync(hubPage, 'utf8');
    if (!isIndexable(hubHtml)) errors.push(`${key}: topic hub must be indexable`);
    if (!new RegExp(`data-topic-cluster-hub=["']${escapeRegExp(key)}["']`, 'i').test(hubHtml)) {
      errors.push(`${key}: topic hub marker is missing`);
    }
    const hubLinks = new Set(localLinks(hubHtml).filter((slug) => memberSet.has(slug)));
    const missingHubLinks = memberSlugs.filter((slug) => !hubLinks.has(slug));
    if (missingHubLinks.length) errors.push(`${key}: topic hub is missing ${missingHubLinks.join(', ')}`);
    for (const target of hubLinks) incoming.get(target)?.add(hubSlug);
  }

  for (const member of members) {
    if (!member.slug || !member.label) {
      errors.push(`${key}: every cluster member needs a slug and concise label`);
      continue;
    }
    if (!sourceBySlug.has(member.slug)) {
      errors.push(`${key}: source post does not exist for ${member.slug}`);
      continue;
    }
    const previous = globallyDeclared.get(member.slug);
    if (previous) errors.push(`${member.slug}: declared in both ${previous} and ${key}`);
    globallyDeclared.set(member.slug, key);

    const page = join(dist, member.slug, 'index.html');
    if (!existsSync(page)) {
      errors.push(`${member.slug}: clustered page was not generated`);
      continue;
    }

    checkedPages += 1;
    const html = readFileSync(page, 'utf8');
    if (!isIndexable(html)) {
      errors.push(`${member.slug}: clustered page must be indexable`);
    }

    const clusterBlock = html.match(
      new RegExp(`<aside\\b[^>]*data-topic-cluster=["']${escapeRegExp(key)}["'][^>]*>([\\s\\S]*?)<\\/aside>`, 'i'),
    )?.[1];
    if (!clusterBlock) {
      errors.push(`${member.slug}: visible ${key} topic-guide block is missing`);
      continue;
    }

    const blockLinks = localLinks(clusterBlock);
    const outgoing = new Set(blockLinks.filter((slug) => memberSet.has(slug)));
    if (!blockLinks.includes(hubSlug)) errors.push(`${member.slug}: topic-guide block does not link to its hub`);
    if (outgoing.has(member.slug)) errors.push(`${member.slug}: topic-guide block links to itself`);

    const expected = memberSlugs.filter((slug) => slug !== member.slug);
    const missingLinks = expected.filter((slug) => !outgoing.has(slug));
    if (missingLinks.length) {
      errors.push(`${member.slug}: topic-guide block is missing ${missingLinks.join(', ')}`);
    }
    if (outgoing.size < 3) {
      errors.push(`${member.slug}: needs at least three relevant outgoing cluster links`);
    }
    for (const target of outgoing) incoming.get(target)?.add(member.slug);

    const relatedBlock = html.match(/<section\b[^>]*aria-labelledby=["']rel["'][^>]*>([\s\S]*?)<\/section>/i)?.[1] ?? '';
    const relatedClusterLinks = new Set(localLinks(relatedBlock).filter((slug) => memberSet.has(slug)));
    if (relatedClusterLinks.size < Math.min(3, members.length - 1)) {
      errors.push(`${member.slug}: related recommendations are not prioritizing its product cluster`);
    }
  }

  for (const [slug, sources] of incoming) {
    if (sources.size < 3) {
      errors.push(`${slug}: has only ${sources.size} relevant incoming cluster links`);
    }
  }
}

if (errors.length) {
  throw new Error(`Topic-cluster check failed with ${errors.length} issue(s):\n${errors.join('\n')}`);
}

console.log(
  `Topic-cluster check passed: ${Object.keys(topicClusters).length} cluster(s), ` +
    `${checkedPages} rendered hub/member pages, at least three relevant incoming and outgoing links per member.`,
);
