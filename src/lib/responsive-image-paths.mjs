import { createHash } from 'node:crypto';

export const RESPONSIVE_IMAGE_WIDTHS = Object.freeze([320, 640, 760, 1200, 1520]);

export function responsiveImagePath(src, width) {
  const id = createHash('sha1').update(src).digest('hex').slice(0, 20);
  return `/_responsive/${id}-${width}.webp`;
}
