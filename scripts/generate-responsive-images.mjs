import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import sharp from 'sharp';
import {
  RESPONSIVE_IMAGE_WIDTHS,
  responsiveImagePath,
} from '../src/lib/responsive-image-paths.mjs';

const projectRoot = process.cwd();
const publicRoot = resolve(projectRoot, 'public');
const outputRoot = resolve(publicRoot, '_responsive');
const postsRoot = resolve(projectRoot, 'src/content/posts');
// libvips can produce truncated WebP files when many large source images are encoded in
// parallel on memory-constrained CI runners. Default to the slower, deterministic path.
const concurrency = Math.max(1, Math.min(4, Number(process.env.RESPONSIVE_IMAGE_CONCURRENCY) || 1));

function publicFile(src) {
  if (!src.startsWith('/')) throw new Error(`Featured image must be root-relative: ${src}`);

  const file = resolve(publicRoot, decodeURIComponent(src).replace(/^\/+/, ''));
  if (file !== publicRoot && !file.startsWith(`${publicRoot}${sep}`)) {
    throw new Error(`Featured image escapes public/: ${src}`);
  }
  return file;
}

async function featuredImages() {
  const result = new Set();
  const files = (await readdir(postsRoot)).filter((name) => name.endsWith('.md'));

  for (const file of files) {
    const source = await readFile(resolve(postsRoot, file), 'utf8');
    const value = source.match(/^featuredImage:\s*["']?([^"'\r\n]+?)["']?\s*$/m)?.[1];
    if (value) result.add(value);
  }

  return [...result].sort();
}

async function generate(src) {
  const input = publicFile(src);
  const inputStats = await stat(input);
  const metadata = await sharp(input, { failOn: 'error' }).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not determine featured image dimensions: ${src}`);
  }

  const widths = RESPONSIVE_IMAGE_WIDTHS.filter((width) => width <= metadata.width);
  let outputBytes = 0;

  for (const width of widths) {
    const pathname = responsiveImagePath(src, width).replace(/^\/+/, '');
    const output = resolve(publicRoot, pathname);
    const encoded = await sharp(input, { failOn: 'error' })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 4 })
      .toBuffer();
    if (encoded.length === 0) throw new Error(`Encoded an empty responsive image: ${pathname}`);
    await writeFile(output, encoded);
    const outputSize = (await stat(output)).size;
    if (outputSize === 0) throw new Error(`Generated an empty responsive image: ${pathname}`);
    outputBytes += outputSize;
  }

  return { variants: widths.length, inputBytes: inputStats.size, outputBytes };
}

async function main() {
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  const images = await featuredImages();
  let cursor = 0;
  let variants = 0;
  let inputBytes = 0;
  let outputBytes = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < images.length) {
      const src = images[cursor++];
      const generated = await generate(src);
      variants += generated.variants;
      inputBytes += generated.inputBytes;
      outputBytes += generated.outputBytes;
    }
  });

  await Promise.all(workers);
  const outputFiles = await readdir(outputRoot);
  if (outputFiles.length !== variants) {
    throw new Error(`Expected ${variants} responsive images but found ${outputFiles.length}.`);
  }
  for (const file of outputFiles) {
    if ((await stat(resolve(outputRoot, file))).size === 0) {
      throw new Error(`Generated an empty responsive image: ${file}`);
    }
  }

  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
  console.log(
    `Generated ${variants} responsive WebP variants for ${images.length} featured images ` +
      `(${mb(inputBytes)} MB source; ${mb(outputBytes)} MB generated).`,
  );
}

await main();
