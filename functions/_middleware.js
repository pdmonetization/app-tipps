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
  "/ultimate-gamehag-review/"
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
