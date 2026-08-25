import { resolve, sep } from 'node:path';
import sharp from 'sharp';

type Dimensions = { width: number; height: number };

const publicRoot = resolve(process.cwd(), 'public');
const cache = new Map<string, Promise<Dimensions>>();

export function publicImageDimensions(src: string): Promise<Dimensions> {
  const existing = cache.get(src);
  if (existing) return existing;

  const pending = (async () => {
    if (!src.startsWith('/')) {
      throw new Error(`Featured images must use a root-relative public path: ${src}`);
    }

    const file = resolve(publicRoot, src.replace(/^\/+/, ''));
    if (file !== publicRoot && !file.startsWith(`${publicRoot}${sep}`)) {
      throw new Error(`Featured image path escapes the public directory: ${src}`);
    }

    const metadata = await sharp(file).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error(`Could not read featured image dimensions: ${src}`);
    }
    return { width: metadata.width, height: metadata.height };
  })();

  cache.set(src, pending);
  return pending;
}
