export interface AuthorProfile {
  name: string;
  slug: string;
  bio: string;
}

export const AUTHORS: AuthorProfile[] = [
  {
    name: 'Sylvie Fox',
    slug: 'sylvie-fox',
    bio: 'Sylvie Fox covers mobile apps, Android and iOS features for App-Tipps. Her articles focus on practical guides, useful settings and explaining how mobile features work in everyday use.',
  },
  {
    name: 'Olivia Williams',
    slug: 'olivia-williams',
    bio: 'Olivia Williams writes about mobile apps and games for App-Tipps, including reviews, comparisons and practical guides. Her coverage focuses on what users can expect from an app or game and the features worth knowing about.',
  },
  {
    name: 'Amelia Thomas',
    slug: 'amelia-thomas',
    bio: 'Amelia Thomas covers Android and iOS apps, mobile games and digital services. She writes reviews and guides aimed at helping readers understand how apps work, what they offer and whether they are worth their time.',
  },
  {
    name: 'Daniel Clark',
    slug: 'daniel-clark',
    bio: 'Daniel Clark writes about mobile apps, digital services and consumer technology for App-Tipps. His coverage focuses on features, usability, pricing and the practical differences between competing apps and services.',
  },
  {
    name: 'Andrew Wright',
    slug: 'andrew-wright',
    bio: 'Andrew Wright covers mobile gaming, app comparisons and practical Android and iPhone guides. His articles focus on useful features, gameplay systems and helping readers make informed choices between competing apps and games.',
  },
  {
    name: 'Sophia Garcia',
    slug: 'sophia-garcia',
    bio: 'Sophia Garcia writes about mobile apps, games and consumer technology. Her App-Tipps coverage includes app guides, reviews and explanations of new features and platform changes.',
  },
  {
    name: 'Michael Wilson',
    slug: 'michael-wilson',
    bio: 'Michael Wilson covers Android, iOS, mobile games and app-related technology. His articles focus on straightforward explanations, useful settings and practical guidance for everyday mobile users.',
  },
  {
    name: 'Alexander Davis',
    slug: 'alexander-davis',
    bio: 'Alexander Davis writes about mobile apps and games for App-Tipps. His coverage includes reviews, comparisons and guides designed to explain what products offer without unnecessary technical jargon.',
  },
  {
    name: 'James Smith',
    slug: 'james-smith',
    bio: 'James Smith covers mobile gaming, apps and changes across Android and iOS. His articles focus on explaining new features clearly and helping readers get more from the apps and games they use.',
  },
  {
    name: 'Mia Martinez',
    slug: 'mia-martinez',
    bio: 'Mia Martinez writes about apps, mobile games and digital tools for App-Tipps. Her coverage includes reviews, practical guides and explanations of features that are useful to Android and iPhone users.',
  },
  {
    name: 'App-Tipps Editorial',
    slug: 'app-tipps-editorial',
    bio: 'App-Tipps Editorial is the collective byline used for articles researched, reviewed or produced by the App-Tipps editorial team rather than attributed to an individual writer. Coverage includes Android and iOS guides, mobile apps, games, platform updates and practical mobile technology.',
  },
];

export const authorByName = (name: string) => AUTHORS.find((author) => author.name === name);
export const authorUrl = (name: string) => {
  const author = authorByName(name);
  return author ? `/author/${author.slug}/` : '/about/';
};
