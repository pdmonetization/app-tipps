/**
 * Cloudflare Pages Function.
 *
 * Serves HTTP 410 Gone for articles that were deliberately withdrawn.
 * 410 tells Google the page is permanently removed on purpose, which drops
 * it from the index faster than a 404 and does not pass a misleading signal
 * the way a 301 to an unrelated page would.
 *
 * The _redirects file cannot do this: Cloudflare Pages only accepts
 * 200, 301, 302, 303, 307, 308 and 404 there.
 */
const GONE = new Set([
  "/black-friday-week-how-to-get-the-lowest-prices-on-temu/",
  "/coin-master-faq-and-free-spins-links/",
  "/house-of-fun-cheats-and-tricks/",
  "/inboxdollars-app-review/",
  "/is-blackout-bingo-legit-or-fake/",
  "/is-swagbucks-legit-and-worth-it-review/",
  "/mistplay-legit-or-not/",
  "/qureka-app/",
  "/shop-like-a-billionaire-in-the-temu-app-with-exclusive-30-off-free-gift/",
  "/tips-to-win-zynga-poker/",
  "/top-10-twitch-streaming-tips-to-make-money/",
  "/ultimate-freecash-app-review/",
  "/ultimate-gamehag-review/",
  "/learning-games-improve-children-intelligence/",
  "/fun-safe-and-educational-unlocking-the-best-apps-for-kids-youtube-kids-messenger-kids-abcmouse-and-lego-builder/",
  "/top-5-christmas-apps-you-can-download-for-free/",
  "/azimo-money-transfer-app-review/",
  "/digital-storyhub-web-stories-on-your-website/",
  "/hapday-mental-health-app/",
  "/easiest-way-to-use-chatgpt-on-whatsapp-for-free/",
  "/gta-5-ps5-ps4-comparison/",
  "/lords-of-the-fallen-vs-elden-ring/",
  "/messenger-vs-messenger-lite/",
  "/why-deepseek-dethroned-chatgpt-on-the-app-store-and-google-play/",
  "/monster-strike-beginner-guide/",
  "/apex-legends-mobile-beginner-tips/",
  "/assassins-creed-valhalla-guide-book/",
  "/cyberpunk-2077-in-depth-guide/",
  "/cyberpunk-2077-best-character-builds/",
  "/dawn-of-titans-tips/",
  "/watch-dogs-legion-tips/",
  "/yakuza-like-dragon-tips/",
  "/path-of-exile-mobile-game-guide/",
  "/the-best-fighters-in-mortal-kombat-onslaught-mobile/",
  "/how-to-improve-your-gameplay-with-copilot-wave-2/",
  "/monopoly-go-goes-crazy/",
  "/top-amazon-appstore-games-under-5/",
  "/apex-legends-mobile-review/",
  "/disney-mirrorverse-review/",
  "/call-of-duty-warzone-mobile/",
  "/lord-of-the-rings-heroes-of-middle-earth-mobile-game-review/",
  "/propnight-the-multiplayer-mobile-game-that-will-keep-you-up-all-night/",
  "/takt-op-anime-inspired-tactical-rpg/",
  "/malware-infected-vpn-apps-android/",
  "/amazon-photos-android-redesign/",
  "/apple-releases-ios-16-0-3/",
  "/football-manager-2023-android-release/",
  "/logitech-and-tencent-gaming-handheld/",
  "/microsoft-teams-lets-you-play-games/",
  "/monster-train-on-app-store/",
  "/netflix-launching-game-studio/",
  "/little-inferno-expansion-news/",
  "/ni-no-kuni-halloween-features/",
  "/ninja-ducks-vs-pirate-pigs-now-available/",
  "/pubg-mobile-joins-forces-with-maserati/",
  "/undecember-mobile-release-date/",
  "/wreckfest-mobile-opens-up-pre-registration/",
  "/galaxy-s23-2023-what-to-expect/",
  "/github-collaborative-tool-for-open-source-communities/",
  "/microsofts-acquisition-of-activision-blizzard-spreading-gaming-joy-and-community-across-all-devices/",
  "/nike-nft-sneakers-for-the-metaverse/",
  "/nvidia-takes-the-lead-in-the-metaverse/",
  "/preorder-playdate-pocketable-game-console/",
  "/app-tracking-loved-ones-medical-records-in-real-time/",
  "/the-rise-and-shine-of-ios-18/",
  "/the-social-impact-of-the-tiktok-ban/",
]);

export async function onRequest(context) {
  const { request, next, env } = context;
  const path = new URL(request.url).pathname.replace(/\/+$/, '/') || '/';
  const normalised = path.endsWith('/') ? path : path + '/';

  if (GONE.has(normalised)) {
    const body = await env.ASSETS.fetch(new URL('/410/', request.url));
    return new Response(await body.text(), {
      status: 410,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }
  return next();
}
