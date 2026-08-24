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
  /* Google Privacy & messaging (Funding Choices) is a Google-certified CMP
     under the TCF requirement for EEA/UK/CH. Loading it needs only the
     AdSense publisher ID above — set enableConsent to true once AdSense
     is approved and the message is published in the AdSense UI. */
  enableConsent: true,
  /* AdSense slots render as nothing until this is true. The dedicated GAM
     article slot is enabled independently by its article layout prop. */
  enableAds: false,
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
