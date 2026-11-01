export type NavItem = { name: string; href?: string; construction?: boolean };

export const NAVIGATE: NavItem[] = [
  { name: 'Welcome', href: '/' },
  { name: 'Webmaster', href: '/webmaster/', construction: true },
  { name: 'Guestbook', href: '/guestbook/' },
  { name: 'Links', href: '/links/', construction: true },
];

export const OFFSITE: NavItem[] = [
  { name: 'Weblog', href: 'https://blog.ohrt.dev' },
  { name: 'Projects', construction: true },
  { name: 'Services', construction: true },
];

export const constructionPages = () =>
  [...NAVIGATE, ...OFFSITE].filter((item) => item.construction && item.href?.startsWith('/'));
