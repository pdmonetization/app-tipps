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
  'game-guides': 'Walkthroughs, beginner tips and progression advice for mobile games, based on verified game information and hands-on experience where that has taken place.',
  'game-reviews': 'Reviews of iOS and Android games covering gameplay, monetisation, graphics and sound. First-person testing is only stated when it actually took place.',
  'app-reviews': 'Practical reviews of mobile apps, focused on features, usability, pricing and whether they are worth installing.',
  'news': 'Reporting on the mobile app and game industry: launches, platform changes, store policy and the business behind them.',
  'app-comparison': 'Side-by-side comparisons of competing apps and games, so you can understand the important differences before choosing one.',
  'app-tips': 'Useful features, settings worth changing, and ways to get more out of apps you already use.',
  'best-picks': 'Curated round-ups of apps and games for a given moment, season or need, refreshed when the underlying information changes.',
  'codes': 'Promo and redeem codes for mobile games, with the caveat that publishers can expire them without notice.',
};

export const slugifyTag = (t: string) =>
  t.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
