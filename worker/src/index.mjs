import legacyRoutes from '../../src/data/legacy-routes.json' with { type: 'json' };
import retiredPostSlugs from '../../src/data/retired-posts.json' with { type: 'json' };

const CANONICAL_HOST = 'app-tipps.com';
const REDIRECTS = Object.freeze(legacyRoutes.redirects);
const GONE = new Set(legacyRoutes.gone);
const RETIRED = new Set(retiredPostSlugs.map((slug) => `/${slug}/`));
const PREFIX_REDIRECTS = Object.freeze(legacyRoutes.prefixRedirects);
const GONE_PREFIXES = Object.freeze(legacyRoutes.gonePrefixes);

function normalizeLookupPath(pathname) {
  const collapsed = pathname.replace(/\/{2,}/g, '/');
  if (collapsed === '/') return '/';
  const trimmed = collapsed.replace(/^\/+|\/+$/g, '');
  const lastSegment = trimmed.split('/').at(-1) ?? '';
  return lastSegment.includes('.') ? `/${trimmed}` : `/${trimmed}/`;
}

function isGone(pathname, lookupPath) {
  if (/\/+1000\/?$/.test(pathname)) return true;
  if (GONE.has(lookupPath) || RETIRED.has(lookupPath)) return true;
  return GONE_PREFIXES.some((prefix) => lookupPath.startsWith(prefix));
}

function addSecurityHeaders(response, requestUrl) {
  const headers = new Headers(response.headers);
  headers.set('x-content-type-options', 'nosniff');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('x-frame-options', 'SAMEORIGIN');
  headers.set('permissions-policy', 'geolocation=(), microphone=(), camera=()');
  if (requestUrl.protocol === 'https:') {
    headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains; preload');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function redirect(target, requestUrl) {
  return addSecurityHeaders(
    new Response(null, { status: 301, headers: { location: target.href } }),
    requestUrl,
  );
}

function gone(request, requestUrl) {
  const body = request.method === 'HEAD' ? null : `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,follow">
  <title>This article has been withdrawn | App-Tipps.com</title>
</head>
<body>
  <main>
    <h1>This article has been withdrawn</h1>
    <p>We removed it because it no longer meets our editorial standards.</p>
    <p><a href="https://app-tipps.com/">Browse the latest App-Tipps articles</a></p>
  </main>
</body>
</html>`;
  return addSecurityHeaders(
    new Response(body, {
      status: 410,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
        'x-robots-tag': 'noindex, follow',
      },
    }),
    requestUrl,
  );
}

function routeTarget(lookupPath) {
  const exact = REDIRECTS[lookupPath];
  if (exact) return exact;
  const prefix = PREFIX_REDIRECTS.find(({ from }) => lookupPath.startsWith(from));
  return prefix?.to;
}

export async function handleRequest(request, originFetch = fetch) {
  const requestUrl = new URL(request.url);
  const lookupPath = normalizeLookupPath(requestUrl.pathname);

  if (isGone(requestUrl.pathname, lookupPath)) {
    console.log(JSON.stringify({ action: 'gone', path: requestUrl.pathname, status: 410 }));
    return gone(request, requestUrl);
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    const target = new URL(requestUrl);
    target.protocol = 'https:';
    target.hostname = CANONICAL_HOST;
    target.port = '';
    if (target.searchParams.get('swcfpc') === '1') target.searchParams.delete('swcfpc');

    const redirectedPath = routeTarget(lookupPath);
    if (redirectedPath) target.pathname = redirectedPath;

    if (target.href !== requestUrl.href) {
      console.log(JSON.stringify({
        action: 'redirect',
        from: requestUrl.href,
        to: target.href,
        status: 301,
      }));
      return redirect(target, requestUrl);
    }
  }

  try {
    const response = await originFetch(request);
    return addSecurityHeaders(response, requestUrl);
  } catch (error) {
    console.error(JSON.stringify({
      action: 'origin_error',
      path: requestUrl.pathname,
      error: error instanceof Error ? error.message : String(error),
    }));
    return addSecurityHeaders(
      new Response('Bad gateway', {
        status: 502,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'x-robots-tag': 'noindex',
        },
      }),
      requestUrl,
    );
  }
}

export default {
  fetch(request) {
    return handleRequest(request);
  },
};
