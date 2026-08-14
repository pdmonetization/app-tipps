/*
 * Editorial-score fallback for legacy reviews migrated from WordPress.
 *
 * The old migration did not retain a rating field on many review posts. These
 * scores restore a consistent 5-point editorial rating for legitimate legacy
 * Game Review and App Review pages. A rating stored directly in a post's
 * frontmatter always takes precedence over this table.
 *
 * Do not add non-review articles here merely to obtain review schema.
 */
export const EDITORIAL_RATINGS: Record<string, number> = {
  // Game reviews
  'afk-arena-gameplay': 4.6,
  'apex-legends-mobile-review': 4.3,
  'arena-of-valor-review': 4.4,
  'arknights-tower-defense-review': 4.2,
  'assassins-creed-rebellion-review': 3.8,
  'clash-of-clans-review': 3.7,
  'coin-master-game-review': 3.2,
  'craft-your-way-to-victory-in-the-world-of-hearthstone': 4.3,
  'diablo-immortal-review': 4.6,
  'disney-mirrorverse-review': 3.8,
  'dumb-ways-to-die-mobile-game-a-hilarious-and-thrilling-review': 4.0,
  'genshin-impact-review-2022': 4.6,
  'guardian-tales-reviving-classic-adventures-in-a-pixelated-playground': 4.4,
  'is-pokemon-go-worth-playing': 4.2,
  'is-warcraft-arclight-rumble-worth-playing': 3.8,
  'lord-of-the-rings-heroes-of-middle-earth-mobile-game-review': 3.6,
  'mafia-city-review': 3.0,
  'marvel-strike-force-review': 4.2,
  'monopoly-go-rolling-the-dice-on-fun': 3.8,
  'one-punch-man-the-strongest-review': 3.7,
  'overcrowded-tycoon-game-review': 3.8,
  'project-makeover-mobile-game-review': 3.6,
  'raid-shadow-legends-review': 3.5,
  'rainbow-six-mobile-game-review': 4.0,
  'rise-of-kingdoms-is-it-worth-it': 4.1,
  'royal-match-review-and-redeem-codes': 4.0,
  'setting-sail-for-adventure-one-piece-treasure-cruise-review': 4.0,
  'spooky-delights-halloween-madness-cooking-game-review': 3.8,
  'star-wars-galaxy-heroes-review': 4.0,
  'state-of-survival-zombie-war-review': 4.6,
  'survival-and-strategy-navigating-the-wasteland-in-fallout-shelter': 4.3,
  'the-epic-battle-for-the-iron-throne-game-of-thrones-conquest-review': 3.4,
  'top-war-battle-game-review': 3.3,
  'undawn-game-review-thrive-in-a-post-apocalyptic-world-overrun-by-zombies': 4.0,
  'vikingard-and-vikings-mobile-game-review': 3.6,
  'war-robots-review': 3.5,
  'zenless-zone-zero-mobile-game-review': 4.4,

  // App reviews
  'airalo-your-esim-app': 4.4,
  'aliexpress-shop-smarter-review': 4.0,
  'babbel-app-review': 4.4,
  'bradesco-app-review': 3.8,
  'clubhouse-app-review': 3.6,
  'create-incredible-3d-photos-with-loopsie-ai-art-generator': 4.0,
  'deezer-app-review': 4.3,
  'duckduckgo-private-browser-app-review': 4.4,
  'fiverr-app-review': 4.1,
  'flixbus-review': 4.2,
  'floward-online-flowers-app-review': 4.1,
  'freeprints-app-review': 4.0,
  'grammarly-app-review': 4.6,
  'happy-color-the-ultimate-coloring-book-app': 4.3,
  'hayu-app-review': 3.8,
  'homeadvisor-app-review': 3.8,
  'jassby-app-review': 3.7,
  'max-fashion-app-review': 3.7,
  'mrspeedy-app-review': 3.8,
  'myntra-app-review': 4.2,
  'phonepe-app-review': 4.5,
  'reddit-app-review-and-tipps': 4.3,
  'revolutionize-your-video-editing-unleash-your-creativity-with-capcut-app': 4.5,
  'signal-app-review': 4.6,
  'skyview-app': 4.5,
  'slickdeals-app-review': 4.4,
  'spectrum-news-app-review': 4.2,
  'textnow-call-and-text-unlimited': 4.0,
  'the-lime-mobile-app-and-the-ridegreen-movement': 4.2,
  'tiktok-app-review': 4.2,
  'traveloka-app-review': 4.3,
  'truecaller-app-review': 4.2,
  'urbanflixtv-app-review': 3.5,
  'vedantu-app-review': 4.1,
  'zoomcar-app-review': 3.5,
};

export const editorialRatingFor = (slug: string) => EDITORIAL_RATINGS[slug];
