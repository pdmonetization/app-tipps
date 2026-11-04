/* ---------------------------------------------------------------
   Site-wide configuration.
   Every third-party ID is empty by default. Nothing loads until an
   ID is filled in, so the site ships with zero third-party requests.
   --------------------------------------------------------------- */

export const SITE = {
  url: 'https://app-tipps.com',
  name: 'App-Tipps.com',
  tagline: 'The Haven for iOS and Android Enthusiasts',
  description:
    'Independent reviews, guides and news for iOS and Android apps and games, published since 2020.',
  locale: 'en_US',
  lang: 'en',
  postsPerPage: 12,
  founded: 2020,
};

export const PUBLISHER = {
  legalName: 'Purify Digital Limited',
  companyNumber: '8714197',
  vatNumber: 'GB175435396',
  address: {
    street: "5 St John's Lane",
    city: 'London',
    postcode: 'EC1M 4BH',
    country: 'United Kingdom',
    countryCode: 'GB',
  },
  editorialEmail: 'editorial@app-tipps.com',
  privacyEmail: 'editorial@app-tipps.com',
  social: {
    facebook: 'https://www.facebook.com/apptipp',
    instagram: 'https://www.instagram.com/apptippscom',
  },
};

/* Fill these in when the accounts exist. Empty string = tag not rendered. */
export const INTEGRATIONS = {
  adsensePublisherId: 'ca-pub-4456135303100816',
  adManagerNetworkCode: '23368375120',
  ga4MeasurementId: 'G-ZY7TVP75K4',
  searchConsoleToken: '',   // google-site-verification content value
  /* InMobi Choice V3 is the single CMP (TCF 2.3, GPP and Google Basic Consent).
     InMobi must have an active app-tipps.com property with Google Basic Consent
     configured; the account-issued tag is in components/InMobiConsent.astro. */
  enableConsent: true,
  /* Standalone AdSense slots are separate from Purify's no-fill backfill. */
  enableAds: false,
  /* Site-side AdSense backfill after a final Prebid no-bid, never after a
     creative has been attempted. Use genuine numeric data-ad-slot values from
     Ads > By ad unit > Display ads in this AdSense account. Blank = disabled
     for that shape; no invalid Google ad requests are sent. The 300x250
     unit can be reused by both in-article placements. A sticky/anchor ad is
     deliberately NOT part of this fallback (Google handles its own anchors).
     The account-level AdSense loader remains in Base.astro. */
  adsenseFallback: {
    enabled: true,
    slotIds: {
      banner_top: '',
      banner_middle: '',
      banner_bottom: '',
      banner_left: '',
      banner_right: '',
    },
  },
};

export const NAV = [
  { label: 'Game Reviews', href: '/category/game-reviews/' },
  { label: 'App Reviews', href: '/category/app-reviews/' },
  { label: 'Game Guides', href: '/category/game-guides/' },
  { label: 'App Tips', href: '/category/app-tips/' },
  { label: 'Comparisons', href: '/category/app-comparison/' },
  { label: 'News', href: '/category/news/' },
  { label: 'Best Picks', href: '/category/best-picks/' },
];

export const FOOTER_LINKS = [
  { label: 'About Us', href: '/about/' },
  { label: 'Our Authors', href: '/authors/' },
  { label: 'Editorial Policy', href: '/editorial-policy/' },
  { label: 'Contact', href: '/contact-us/' },
  { label: 'Privacy Policy', href: '/cookies-privacy-policy/' },
  { label: 'Cookie Policy', href: '/cookie-policy/' },
  { label: 'Terms & Conditions', href: '/terms-and-conditions/' },
];
