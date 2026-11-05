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

**Active unit (5 November 2026):** AdSense display unit `4859922810`
is configured for `banner_top` (all pages including homepage),
`banner_middle` (both in-article positions), and `banner_bottom` (articles).
The user supplied this unit under publisher ID `ca-pub-4456135303100816`.
Sidebars and sticky remain disabled. Multiple placements share the same
responsive unit ID for this test; use separate IDs later for reporting.

`INTEGRATIONS.enableAds` controls independent `AdSlot.astro` positions and
does not need to be enabled for this backfill.

## Exactly when a fallback is requested

A Google ad request is queued *once per placement*, and only after the
InMobi CMP returns a **final TCF choice** (`tcloaded` or
`useractioncomplete` with a TC string, or explicit `gdprApplies=false`).
The site also refuses to request ads when Global Privacy Control is on.

- **Adagio consent eligible:** run the Prebid auction; use AdSense only
  when the wrapper returns `no-bid`, `library-error`, or a pre-render
  `integration-error`.
- **Adagio not eligible (vendor 617 not consented):** skip Prebid entirely,
  but allow Google to evaluate a separately requested display unit based
  on the TCF and Google consent signals. Google decides if personalized,
  non-personalized, or limited ads are eligible for that visitor.
- **CMP unresolved:** no Google or Prebid ad request, because this is a
  manual ad implementation and the CMP has not finished loading.
- **Creative render attempted:** no second provider is requested to avoid
  competing impressions. Existing AdSense ads are never replaced/hidden.

InMobi must have **app-tipps.com** registered as a property, with Google
(registered IAB vendor 755) disclosed and Google Basic Consent configured.
Without a working CMP, Google demand can be blocked regardless of the
ad-unit ID. Limited ads may require an explicit setting in AdSense under
Brand Safety > Blocking controls > Ad serving, and fill is never assured.

The manually placed GAM article inline unit is independent. Sticky
AdSense fallback remains intentionally disabled to avoid conflicts with
Google Auto Ads/anchor behavior.

## Tests and rollout

- `npm run build` runs `worker/test/adsense-fallback.test.mjs`,
  including separate Google/Adagio consent eligibility tests.
- Open the homepage or an article with `?purify_debug=1`.
- Check that the diagnostic panel shows `adsense-requested` only for
  top/middle/bottom after a final TCF choice and Prebid no-bid; the panel
  distinguishes `adsense-filled` and `adsense-unfilled` once Google
  reports its result.
- Test accept/reject and consent changes in a fresh session with InMobi.
- Confirm no duplicate ad request and no Google request after a Prebid
  render attempt.
- Verify the actual InMobi consent states, Google Consent Mode updates,
  ad-unit coverage, AdSense account/site status, and AdSense reports.
- If the CMP never supplies a final state, the panel must indicate it is
  waiting for consent; do not override consent to force display.

Google reference: https://support.google.com/adsense/answer/9183363

Google limited ads: https://support.google.com/adsense/answer/14210870
Google TCF troubleshooting: https://support.google.com/adsense/answer/9999955
