import { SITE } from '../consts';

export type BreadcrumbItem = {
  name: string;
  url?: string;
};

export function breadcrumbSchema(pageUrl: string, items: BreadcrumbItem[]) {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && index < items.length - 1 ? { item: item.url } : {}),
    })),
  };
}

export function simplePageBreadcrumb(path: string, name: string) {
  const pageUrl = new URL(path, SITE.url).href;
  return breadcrumbSchema(pageUrl, [
    { name: 'Home', url: `${SITE.url}/` },
    { name },
  ]);
}
