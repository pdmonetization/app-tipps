import { resolve, sep } from 'node:path';
import sharp from 'sharp';

const publicRoot = resolve(process.cwd(), 'public');
const metadataCache = new Map();

const publicImageMetadata = (src) => {
  const existing = metadataCache.get(src);
  if (existing) return existing;

  const pending = (async () => {
    let pathname;
    try {
      pathname = decodeURIComponent(src.split(/[?#]/, 1)[0]);
    } catch {
      pathname = src.split(/[?#]/, 1)[0];
    }

    const file = resolve(publicRoot, pathname.replace(/^\/+/, ''));
    if (file !== publicRoot && !file.startsWith(`${publicRoot}${sep}`)) {
      throw new Error(`Markdown image escapes the public directory: ${src}`);
    }

    const metadata = await sharp(file).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error(`Could not read Markdown image dimensions: ${src}`);
    }

    return { width: metadata.width, height: metadata.height };
  })();

  metadataCache.set(src, pending);
  return pending;
};

async function enhanceNode(node) {
  if (!node || typeof node !== 'object') return;

  if (node.type === 'element' && node.tagName === 'img') {
    const src = node.properties?.src;
    if (typeof src === 'string' && src.startsWith('/')) {
      const { width, height } = await publicImageMetadata(src);
      node.properties = {
        ...node.properties,
        width,
        height,
        loading: node.properties?.loading ?? 'lazy',
        decoding: node.properties?.decoding ?? 'async',
      };
    }
  }

  if (!Array.isArray(node.children)) return;

  for (let index = 0; index < node.children.length; index += 1) {
    const child = node.children[index];

    if (child?.type === 'element' && child.tagName === 'table') {
      node.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [child],
      };
      continue;
    }

    await enhanceNode(child);
  }
}

export default function rehypePublicMedia() {
  return async (tree) => enhanceNode(tree);
}
