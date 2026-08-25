# App-Tipps edge routing

GitHub Pages serves the static site but cannot return real `301` or `410` responses.
This Worker runs in front of the existing proxied `app-tipps.com` DNS record and:

- returns one-hop `301` responses for verified legacy equivalents;
- returns `410 Gone` for withdrawn articles, ambiguous attachment slugs, retired locale URLs, and malformed `/1000` migration URLs;
- removes the obsolete `swcfpc=1` query parameter;
- canonicalizes requests to `https://app-tipps.com`;
- applies the security headers that GitHub Pages does not read from `public/_headers`.

The canonical route data lives in:

- `src/data/retired-posts.json`
- `src/data/legacy-routes.json`

Do not create another redirect list. `npm run build` verifies that the manifests contain no
self-redirects, duplicate states, chains, missing targets, sitemap leaks, or generated gone pages.

## Validate

```bash
npm install
npm run check:worker
```

## Deploy

The `app-tipps.com` DNS record must be proxied through Cloudflare. Then authenticate Wrangler
with the Cloudflare account that owns the zone and run:

```bash
npm run deploy:worker
```

The route in `wrangler.jsonc` attaches the Worker to `app-tipps.com/*`. Normal requests stream
through to the existing GitHub Pages origin.
