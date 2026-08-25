import assert from 'node:assert/strict';
import test from 'node:test';
import { handleRequest } from '../src/index.mjs';

const unreachableOrigin = async () => {
  throw new Error('origin should not be called');
};

test('collapses a legacy redirect, HTTPS normalization and cache query cleanup into one hop', async () => {
  const request = new Request('http://www.app-tipps.com/best-dislyte-team-comp/?swcfpc=1&utm_source=test');
  const response = await handleRequest(request, unreachableOrigin);
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get('location'),
    'https://app-tipps.com/dislyte-by-lilith-games/?utm_source=test',
  );
});

test('returns 410 for an ambiguous attachment slug', async () => {
  const response = await handleRequest(
    new Request('https://app-tipps.com/image-1/'),
    unreachableOrigin,
  );
  assert.equal(response.status, 410);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
});

test('returns 410 for a deliberately retired article', async () => {
  const response = await handleRequest(
    new Request('https://app-tipps.com/call-of-duty-warzone-mobile/'),
    unreachableOrigin,
  );
  assert.equal(response.status, 410);
});

test('returns 410 for retired locale and malformed migration URLs', async () => {
  for (const url of [
    'https://app-tipps.com/cs/editorial-policy/',
    'https://app-tipps.com/en/cookies-privacy-policy/',
    'https://app-tipps.com/royal-match-review-and-redeem-codes//1000',
    'https://app-tipps.com/wp-admin/admin-ajax.php',
  ]) {
    const response = await handleRequest(new Request(url), unreachableOrigin);
    assert.equal(response.status, 410, url);
  }
});

test('redirects only obsolete author archives to the author directory', async () => {
  const response = await handleRequest(
    new Request('https://app-tipps.com/author/polina/'),
    unreachableOrigin,
  );
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://app-tipps.com/authors/');
});

test('preserves a current author profile', async () => {
  let originCalls = 0;
  const response = await handleRequest(
    new Request('https://app-tipps.com/author/sylvie-fox/'),
    async () => {
      originCalls += 1;
      return new Response('author profile');
    },
  );
  assert.equal(response.status, 200);
  assert.equal(originCalls, 1);
});

test('proxies ordinary requests and applies security headers without buffering the body', async () => {
  let originCalls = 0;
  const response = await handleRequest(
    new Request('https://app-tipps.com/balatro-review/'),
    async () => {
      originCalls += 1;
      return new Response('origin response', {
        status: 200,
        headers: { 'cache-control': 'public, max-age=60' },
      });
    },
  );
  assert.equal(originCalls, 1);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'origin response');
  assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000; includeSubDomains; preload');
});

test('returns a controlled noindex response when the origin fails', async () => {
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await handleRequest(
      new Request('https://app-tipps.com/'),
      async () => { throw new Error('origin unavailable'); },
    );
    assert.equal(response.status, 502);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex');
  } finally {
    console.error = originalError;
  }
});

test('HEAD requests to gone URLs return no body', async () => {
  const response = await handleRequest(
    new Request('https://app-tipps.com/is-blackout-bingo-legit-or-fake/', { method: 'HEAD' }),
    unreachableOrigin,
  );
  assert.equal(response.status, 410);
  assert.equal(await response.text(), '');
});
