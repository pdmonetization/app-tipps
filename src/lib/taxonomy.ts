/* Category display name -> URL slug. These slugs are the ones Google has
   indexed since 2022 and must not change. */
export const CATEGORY_SLUGS: Record<string, string> = {
  'Game Guide': 'game-guides',
  'Game Review': 'game-reviews',
  'App Review': 'app-reviews',
  'News': 'news',
  'Comparison': 'app-comparison',
  'App Tips': 'app-tips',
  "AT's Best Picks": 'best-picks',
  'Redeem Codes': 'codes',
};

export const CATEGORY_INTROS: Record<string, string> = {
  'game-guides': 'Walkthroughs, beginner tips and progression advice for the mobile games our team plays, written after hands-on time with each title.',
  'game-reviews': 'Hands-on reviews of iOS and Android games, scored on gameplay, monetisation, graphics and sound. We explain what a score means before we give one.',
  'app-reviews': 'Practical reviews of the apps people actually use day to day, focused on whether they earn a place on your home screen.',
  'news': 'Reporting on the mobile app and game industry: launches, platform changes, store policy and the business behind them.',
  'app-comparison': 'Side-by-side comparisons of competing apps and games, so you can pick one without downloading all of them first.',
  'app-tips': 'Features you probably missed, settings worth changing, and ways to get more out of apps you already have installed.',
  'best-picks': 'Curated round-ups of the best apps and games for a given moment, season or need, refreshed as the stores change.',
  'codes': 'Working promo and redeem codes for mobile games, with the caveat that publishers expire them without notice.',
};

export const slugifyTag = (t: string) =>
  t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Tags below this post count get a page, but with noindex, so the 77
   near-empty archives stay out of Google's index. */
export const TAG_INDEX_THRESHOLD = 3;
