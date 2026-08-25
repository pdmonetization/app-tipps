import { publicImageDimensions } from './image-metadata';
import { RESPONSIVE_IMAGE_WIDTHS, responsiveImagePath } from './responsive-image-paths.mjs';

type ResponsiveImage = {
  width: number;
  height: number;
  webpSrcset: string;
};

export async function publicResponsiveImage(src: string): Promise<ResponsiveImage> {
  const dimensions = await publicImageDimensions(src);
  const widths = RESPONSIVE_IMAGE_WIDTHS.filter((width) => width <= dimensions.width);

  return {
    ...dimensions,
    webpSrcset: widths.map((width) => `${responsiveImagePath(src, width)} ${width}w`).join(', '),
  };
}
