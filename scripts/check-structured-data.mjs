import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE = 'https://app-tipps.com';
const ORGANIZATION_ID = `${SITE}/#organization`;
const WEBSITE_ID = `${SITE}/#website`;
const dist = join(process.cwd(), 'dist');
const postsDir = join(process.cwd(), 'src/content/posts');
const legacyRatingSource = readFileSync(join(process.cwd(), 'src/lib/editorial-ratings.ts'), 'utf8');
const legacyRatings = new Set(
  [...legacyRatingSource.matchAll(/^\s*'([^']+)':\s*[0-9.]+,/gm)].map((match) => match[1]),
);

if (!existsSync(dist)) {
  throw new Error('Structured-data check failed: dist does not exist. Run the Astro build first.');
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const item = join(dir, name);
    return statSync(item).isDirectory() ? walk(item) : [item];
  });
}

function pagePath(file) {
  const rel = relative(dist, file).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

function frontmatterField(source, name) {
  const value = source.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim();
  // Sveltia CMS serializes an untouched optional number as `null` whenever an\n  // editor saves a post. Treat YAML's empty/null spellings as absent so a\n  // harmless admin edit cannot make a non-review post look rated.\n  if (!value || /^(?:null|~|''|\"\")$/i.test(value)) return undefined;
  return value.replace(/^(["'])(.*)\1$/, '$2');
}

const posts = new Map();
const sourceErrors = [];
for (const file of readdirSync(postsDir).filter((name) => name.endsWith('.md'))) {
  const source = readFileSync(join(postsDir, file), 'utf8');
  const slug = frontmatterField(source, 'slug');
  const category = frontmatterField(source, 'category');
  const rating = frontmatterField(source, 'rating');
  if (!slug || !category) continue;

  const isReview = category === 'Game Review' || category === 'App Review';
  if (rating !== undefined && !isReview) {
    sourceErrors.push(`${file}: rating is only allowed on Game Review or App Review posts`);
  }
  posts.set(slug, {
    file,
    category,
    schemaEligibleReview: isReview && (rating !== undefined || legacyRatings.has(slug)),
  });
}

if (sourceErrors.length) {
  throw new Error(`Structured-data check failed:\n${sourceErrors.join('\n')}`);
}

function typeIs(node, type) {
  const value = node?.['@type'];
  return Array.isArray(value) ? value.includes(type) : value === type;
}

function extractMeta(html, attribute, value) {
  const tag = html.match(new RegExp(`<meta\\b[^>]*${attribute}=["']${value}["'][^>]*>`, 'i'))?.[0];
  return tag?.match(/content=["']([^"']+)["']/i)?.[1];
}

const errors = [];
let checkedPages = 0;
let indexablePages = 0;
let articlePages = 0;
let reviewPages = 0;

for (const file of walk(dist).filter((name) => name.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8');
  if (html.includes('name="app-tipps-route"')) continue;

  const path = pagePath(file);
  // The Sveltia CMS authentication shell is an intentionally noindex admin tool,
  // not part of the site's public structured-data surface.
  if (path === '/admin/') continue;

  const pageUrl = new URL(path, SITE).href;
  const scripts = [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  if (scripts.length !== 1) {
    errors.push(`${path}: expected exactly one JSON-LD graph, found ${scripts.length}`);
    continue;
  }

  let document;
  try {
    document = JSON.parse(scripts[0][1]);
  } catch (error) {
    errors.push(`${path}: JSON-LD is not valid JSON (${error.message})`);
    continue;
  }

  checkedPages += 1;
  if (document['@context'] !== 'https://schema.org' || !Array.isArray(document['@graph'])) {
    errors.push(`${path}: JSON-LD must contain @context https://schema.org and an @graph array`);
    continue;
  }

  const nodes = document['@graph'];
  const ids = nodes.map((node) => node?.['@id']).filter(Boolean);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`${path}: duplicate schema @id values: ${[...new Set(duplicateIds)].join(', ')}`);

  const organization = nodes.find((node) => node?.['@id'] === ORGANIZATION_ID);
  const website = nodes.find((node) => node?.['@id'] === WEBSITE_ID);
  if (!organization || !typeIs(organization, 'Organization')) {
    errors.push(`${path}: canonical Organization entity is missing`);
  } else {
    const logo = organization.logo;
    if (!logo || logo['@type'] !== 'ImageObject' || logo.url !== `${SITE}/favicon.png` ||
        logo.contentUrl !== `${SITE}/favicon.png` || Number(logo.width) < 112 || Number(logo.height) < 112) {
      errors.push(`${path}: Organization logo must be a crawlable ImageObject of at least 112x112`);
    }
  }
  if (!website || !typeIs(website, 'WebSite') || website.publisher?.['@id'] !== ORGANIZATION_ID) {
    errors.push(`${path}: canonical WebSite entity is missing or has the wrong publisher`);
  }

  const canonical = html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
  const robots = extractMeta(html, 'name', 'robots') ?? '';
  const indexable = robots.startsWith('index, follow');
  if (indexable) {
    indexablePages += 1;
    if (canonical !== pageUrl) errors.push(`${path}: canonical ${canonical ?? 'missing'} does not match ${pageUrl}`);

    if (path !== '/') {
      const breadcrumbs = nodes.filter((node) => typeIs(node, 'BreadcrumbList'));
      if (breadcrumbs.length !== 1) {
        errors.push(`${path}: expected exactly one BreadcrumbList, found ${breadcrumbs.length}`);
      } else {
        const items = breadcrumbs[0].itemListElement;
        if (!Array.isArray(items) || items.length < 2) {
          errors.push(`${path}: BreadcrumbList must contain at least two items`);
        } else {
          items.forEach((item, index) => {
            if (item?.['@type'] !== 'ListItem' || item.position !== index + 1 || !item.name) {
              errors.push(`${path}: breadcrumb item ${index + 1} is incomplete or out of order`);
            }
            if (index < items.length - 1 && !/^https:\/\//.test(item.item ?? '')) {
              errors.push(`${path}: non-final breadcrumb item ${index + 1} needs an absolute URL`);
            }
          });
        }
      }

      if (!/<nav\b[^>]*class=["'][^"']*crumbs[^"']*["'][^>]*aria-label=["']Breadcrumb["']/i.test(html)) {
        errors.push(`${path}: structured breadcrumbs are not matched by a visible breadcrumb navigation`);
      }
    }
  }

  const slug = path.split('/').filter(Boolean)[0];
  const post = posts.get(slug);
  if (!post || path !== `/${slug}/`) continue;

  const articles = nodes.filter((node) => typeIs(node, 'Article'));
  const reviews = nodes.filter((node) => typeIs(node, 'Review'));
  const main = post.schemaEligibleReview ? reviews[0] : articles[0];
  if (post.schemaEligibleReview ? reviews.length !== 1 || articles.length !== 0 : articles.length !== 1 || reviews.length !== 0) {
    errors.push(`${path}: page must emit exactly one ${post.schemaEligibleReview ? 'Review' : 'Article'} entity`);
    continue;
  }

  const required = ['headline', 'description', 'datePublished', 'dateModified', 'author', 'publisher', 'image'];
  for (const property of required) {
    if (!main[property]) errors.push(`${path}: ${main['@type']} is missing ${property}`);
  }
  if (main.mainEntityOfPage?.['@id'] !== pageUrl) errors.push(`${path}: mainEntityOfPage does not match the canonical URL`);
  if (main.isPartOf?.['@id'] !== WEBSITE_ID) errors.push(`${path}: article is not linked to the canonical WebSite entity`);
  if (main.publisher?.['@id'] !== ORGANIZATION_ID) errors.push(`${path}: article publisher does not reference the canonical Organization`);
  if (!main.author?.['@id'] || !main.author?.name || !main.author?.url) errors.push(`${path}: article author lacks a stable profile identity`);
  if (!/^https:\/\//.test(main.image ?? '')) errors.push(`${path}: article image must be an absolute HTTPS URL`);

  if (post.schemaEligibleReview) {
    reviewPages += 1;
    const reviewedType = main.itemReviewed?.['@type'];
    const value = Number(main.reviewRating?.ratingValue);
    if (!['Game', 'SoftwareApplication'].includes(reviewedType) || !main.itemReviewed?.name) {
      errors.push(`${path}: Review needs a specific Game or SoftwareApplication itemReviewed`);
    }
    if (!Number.isFinite(value) || value < 1 || value > 5 ||
        main.reviewRating?.bestRating !== 5 || main.reviewRating?.worstRating !== 1) {
      errors.push(`${path}: Review rating must use the visible 1–5 editorial scale`);
    }
    const visible = html.match(/aria-label=["']App-Tipps editorial score: ([0-9.]+) out of 5["']/i)?.[1];
    if (Number(visible) !== value) errors.push(`${path}: visible review score does not match reviewRating`);
  } else if (main.reviewRating || main.itemReviewed) {
    articlePages += 1;
    errors.push(`${path}: non-review Article contains review-only properties`);
  } else {
    articlePages += 1;
  }
}

if (errors.length) {
  throw new Error(`Structured-data check failed with ${errors.length} issue(s):\n${errors.join('\n')}`);
}

console.log(
  `Structured-data check passed across ${checkedPages} rendered pages: ` +
    `${indexablePages} indexable pages, ${articlePages} articles, ${reviewPages} reviews.`,
);
