import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const source = fs.readFileSync(path.join(root, 'src/components/PurifyAdagio.astro'), 'utf8');
const from = source.indexOf('  function requestAdsenseFallback(x, reason){');
const to = source.indexOf('  function warnFallback(error){', from);
assert.ok(from !== -1 && to > from, 'fallback implementation must exist');

// Exercise the actual browser helper's code without booting the rest of Purify.
const construct = new Function(
  'NO_FILL', 'adsenseFallback', 'adsenseClient', 'resolved',
  'document', 'window', 'log', 'warnFallback',
  source.slice(from, to) + '\nreturn requestAdsenseFallback;'
);
function fixture({ unit = '1234567890', client = 'ca-pub-4456135303100816', enabled = true,
                   resolved = true, width = 300, slotWidth = 300, height = 250, iframe = false } = {}) {
  const calls = [];
  const shell = { dataset: {} };
  const node = {
    getBoundingClientRect() { return { width: slotWidth }; },
    querySelector(selector) { return selector === 'iframe' && iframe ? {} : null; },
    replaceChildren(element) { calls.push(['insert', element]); this.child = element; }
  };
  const x = { name: 'middle-1', purifyName: 'banner_middle', width, height, shell,
              slot: node, adsenseStarted: false };
  const doc = { createElement(tag) {
    assert.equal(tag, 'ins');
    const attributes = {};
    return {
      className: '', style: {}, attributes,
      setAttribute(key, value) { attributes[key] = String(value); }
    };
  }};
  const win = { adsbygoogle: { push(value) { calls.push(['adsense', value]); } } };
  const callback = construct(
    new Set(['no-bid', 'library-error', 'integration-error']),
    { enabled, slotIds: { banner_middle: unit } }, client, resolved,
    doc, win, () => {}, error => { throw error; }
  );
  return { callback, x, calls };
}

test('a final no-bid creates precisely one standard AdSense request', () => {
  const { callback, x, calls } = fixture();
  assert.equal(callback(x, 'no-bid'), true);
  assert.equal(x.adsenseStarted, true);
  assert.equal(x.shell.dataset.purifyResult, 'adsense-requested');
  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], 'insert');
  assert.equal(calls[0][1].className, 'adsbygoogle');
  assert.equal(calls[0][1].attributes['data-ad-client'], 'ca-pub-4456135303100816');
  assert.equal(calls[0][1].attributes['data-ad-slot'], '1234567890');
  assert.equal(calls[0][1].style.height, '250px');
  assert.equal(calls[1][0], 'adsense');
  assert.equal(callback(x, 'no-bid'), false);
  assert.equal(calls.length, 2, 'never make duplicate Google requests');
});

test('missing or invalid ad unit identifiers never cause AdSense requests', () => {
  for (const unit of ['', 'fake-id', '123x', 'ca-pub-4456135303100816']) {
    const { callback, x, calls } = fixture({ unit });
    assert.equal(callback(x, 'no-bid'), false, String(unit));
    assert.equal(calls.length, 0);
  }
  for (const config of [{enabled:false},{resolved:false}]) {
    const {callback,x,calls} = fixture(config);
    assert.equal(callback(x, 'no-bid'), false);
    assert.equal(calls.length, 0);
  }
});

test('never backfill after a Prebid creative rendering attempt', () => {
  for (const status of ['render-attempted', 'render-error', 'render-timeout',
                        'render-unconfirmed', 'render-succeeded']) {
    const { callback, x, calls } = fixture();
    assert.equal(callback(x, status), false, status);
    assert.equal(calls.length, 0);
  }
});

test('library failure is eligible only before any creative starts', () => {
  for (const status of ['library-error', 'integration-error']) {
    const { callback, x, calls } = fixture();
    assert.equal(callback(x, status), true);
    assert.equal(calls.length, 2);
  }
});

test('never request a Google ad in a too-narrow slot or sticky overlay', () => {
  const narrow = fixture({ slotWidth: 280 });
  assert.equal(narrow.callback(narrow.x, 'no-bid'), false);
  assert.equal(narrow.calls.length, 0);
  const frame = fixture({ iframe:true });
  assert.equal(frame.callback(frame.x, 'no-bid'), false);
  assert.equal(frame.calls.length, 0);
  const sticky = fixture({ height:0 });
  assert.equal(sticky.callback(sticky.x, 'no-bid'), false);
  assert.equal(sticky.calls.length, 0);
});
