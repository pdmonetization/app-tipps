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
  'NO_FILL', 'adsenseFallback', 'adsenseClient', 'googleReady',
  'document', 'window', 'log', 'warnFallback',
  source.slice(from, to) + '\nreturn requestAdsenseFallback;'
);
function fixture({ unit = '1234567890', client = 'ca-pub-4456135303100816', enabled = true,
                   googleReady = true, width = 300, slotWidth = 300, height = 250, iframe = false } = {}) {
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
    new Set(['no-bid', 'library-error', 'integration-error', 'no-prebid-consent']),
    { enabled, slotIds: { banner_middle: unit } }, client, googleReady,
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
  for (const config of [{enabled:false},{googleReady:false}]) {
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

test('Google fallback is independent of Adagio vendor 617 after a completed TCF decision', () => {
  const a=source.indexOf('  function onConsent(tc,ok){');
  const b=source.indexOf('  function awaitCMP(){',a);
  assert.ok(a!==-1 && b>a);
  const constructConsent=new Function(
    'window','slots','setup','statuses','setConsentState','start','VENDOR','initialLaunched',
    'let googleReady=false, resolved=false, launched=initialLaunched;\\n'+
    source.slice(a,b)+
    '\\nreturn {onConsent, getState:()=>({googleReady,resolved,launched})};'
  );
  const callLog=[];
  const slots=[{adsenseStarted:false,slot:{dataset:{}},shell:{remove(){callLog.push('removed')}}}];
  const probe=constructConsent(
    {navigator:{globalPrivacyControl:false}},slots,
    allowSticky=>callLog.push(['setup',allowSticky]),
    ()=>callLog.push('fallback-check'),
    s=>callLog.push(['state',s]),
    ()=>callLog.push('prebid'),617,false
  );
  probe.onConsent({
    gdprApplies:true,eventStatus:'tcloaded',tcString:'TCstring',
    purpose:{consents:{1:true}},vendor:{consents:{755:true,617:false}}
  },true);
  assert.deepEqual(probe.getState(),{googleReady:true,resolved:false,launched:false});
  assert.equal(slots[0].slot.dataset.purifyStatus,'no-prebid-consent');
  assert.ok(callLog.includes('fallback-check'));
  assert.ok(!callLog.includes('prebid'));
});

test('a Google request must never be made from CMP stub/loading or GPC opt-out', () => {
  const a=source.indexOf('  function onConsent(tc,ok){');
  const b=source.indexOf('  function awaitCMP(){',a);
  const constructConsent=new Function(
    'window','slots','setup','statuses','setConsentState','start','VENDOR','initialLaunched',
    'let googleReady=false, resolved=false, launched=initialLaunched;\\n'+
    source.slice(a,b)+
    '\\nreturn {onConsent, getState:()=>({googleReady,resolved})};'
  );
  for(const sample of [
    {gdprApplies:true,eventStatus:'cmpuishown',tcString:''},
    {gdprApplies:true,eventStatus:'tcloaded',tcString:''}
  ]) {
    let requests=0;
    const probe=constructConsent({navigator:{}},[],()=>requests++,()=>requests++,()=>{},()=>requests++,617,false);
    probe.onConsent(sample,true);
    assert.equal(requests,0);
    assert.equal(probe.getState().googleReady,false);
  }
  const probe=constructConsent(
    {navigator:{globalPrivacyControl:true}},[],()=>{throw Error('should not setup')},
    ()=>{throw Error('should not start fallback')},()=>{},()=>{throw Error('should not bid')},617,false
  );
  probe.onConsent({gdprApplies:false,eventStatus:'tcloaded'},true);
  assert.equal(probe.getState().googleReady,false);
});

test('Google consent readiness is separate from Adagio bidder readiness', () => {
  // A granted Adagio consent starts Prebid, which then offers AdSense only
  // after an explicit no-bid. Independent requests never compete with bids.
  const a=source.indexOf('  function onConsent(tc,ok){');
  const b=source.indexOf('  function awaitCMP(){',a);
  const constructConsent=new Function('window','slots','setup','statuses',
    'setConsentState','start','VENDOR','initialLaunched',
    'let googleReady=false, resolved=false, launched=initialLaunched;\\n'+
    source.slice(a,b)+'\\nreturn {onConsent,getState:()=>({googleReady,resolved})};'
  );
  const calls=[];
  const probe=constructConsent({navigator:{}},[],()=>calls.push('setup'),
    ()=>calls.push('fallback'),()=>{},()=>calls.push('prebid'),617,false);
  probe.onConsent({gdprApplies:true,eventStatus:'useractioncomplete',tcString:'TCstring',
    purpose:{consents:{1:true}},vendor:{consents:{617:true,755:true}}},true);
  assert.deepEqual(probe.getState(),{googleReady:true,resolved:true});
  assert.deepEqual(calls,['prebid']);
});

test('standalone fallback supports homepage top and article bottom configuration', () => {
  const config=fs.readFileSync(path.join(root,'src/consts.ts'),'utf8');
  for(const key of ['banner_top','banner_middle','banner_bottom']){
    assert.ok(config.includes(key+": '4859922810'"),key);
  }
});
