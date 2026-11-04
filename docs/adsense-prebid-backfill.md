# App-Tipps — AdSense backfill for Purify/Prebid no-fill

The site uses a standalone Purify/Adagio wrapper with no Google Ad Manager
price competition. Its runtime signals individual ad-slot results using
`data-purify-status`. This feature does **not** make AdSense a Prebid bidder.

## Safe activation

The AdSense account-level loader already exists in `src/layouts/Base.astro`
with publisher ID `ca-pub-4456135303100816`. It is not an ad-unit ID.

In Google AdSense open **Ads → By ad unit → Display ads**, create a
responsive display unit, and copy its own numeric `data-ad-slot` value from
the generated code. In `src/consts.ts` set the desired field under
`INTEGRATIONS.adsenseFallback.slotIds`:

| Field | Site positions | Requested dimensions |
| --- | --- | --- |
| `banner_top` | Top leaderboard | Desktop 728×90 / mobile 320×100 |
| `banner_middle` | Both article middle positions | 300×250 |
| `banner_bottom` | Bottom article unit | 300×250 |
| `banner_left` | Left article rail, large desktop | 300×600 |
| `banner_right` | Right article rail, large desktop | 300×600 |

A single numeric unit ID can serve both middle positions. Consider separate
AdSense units for reporting by placement. Start with a 300×250 middle unit
before enabling other positions.

**Active first test (4 November 2026):** AdSense display unit `4859922810`
for `banner_middle` (both in-article placements). User supplied the full
AdSense code showing this numeric ID under the configured publisher ID
`ca-pub-4456135303100816`. Other sizes are intentionally blank, so no
fallback request occurs for top, bottom, or sidebars. Do not copy a GAM
line-item/slot ID into these fields.

`INTEGRATIONS.enableAds` controls independent `AdSlot.astro` positions and
does not need to be enabled for this backfill.

## Exactly when a fallback is requested

A Google ad request is queued *once per placement* only when:

1. The Purify wrapper has started following a valid consent decision.
2. The wrapper reports `no-bid`, `library-error` or `integration-error`
   **before any creative is attempted**.
3. A numeric `data-ad-slot` for that placement is configured.
4. The slot fits on the screen and has no existing creative iframe.

A creative render failure or unconfirmed timeout deliberately does **not**
start AdSense. Purify's render-hardening guidance notes that an impression
may already have been counted after a render attempt. The site never refreshes,
hides or replaces an active AdSense unit; consent withdrawal prevents new
Purify requests while Google receives the updated consent signals.

The existing manually placed GAM article inline ad remains independent.
A manually controlled sticky AdSense fallback is intentionally excluded.
If Auto Ads / AdSense anchors are used, review their overlap with the Purify
sticky placement.

## Tests and rollout

- `npm run build` includes `worker/test/adsense-fallback.test.mjs`.
- Visit an article with `?purify_debug=1`.
- With only `banner_middle` configured, confirm top, bottom and rail no-bids
  remain unfilled and only middle positions may request AdSense.
- With the supplied middle unit ID, confirm the diagnostic table shows
  `adsense-requested` only for eligible no-bid placements.
- In browser DevTools inspect the `<ins class="adsbygoogle">` element with
  the matching numeric `data-ad-slot`; verify just one Google ad request.
- Accept/reject/revoke consent in a fresh session with InMobi active and
  confirm Google Consent Mode v2/TFC-GPP integration is correct.
- Check AdSense policy compliance and actual fill on mobile and desktop.
- Monitor AdSense reports; a request does not guarantee an impression or RPM.

Google reference: https://support.google.com/adsense/answer/9183363
