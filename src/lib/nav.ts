export type NavItem = { name: string; href?: string; construction?: boolean };

export const NAVIGATE: NavItem[] = [
  { name: 'Welcome', href: '/' },
  { name: 'Webmaster', href: '/webmaster/' },
  { name: 'Guestbook', href: '/guestbook/' },
  { name: 'Links', href: '/links/' },
];

export const OFFSITE: NavItem[] = [
  { name: 'Weblog', href: 'https://blog.ohrt.dev' },
  { name: 'Projects', href: 'https://tools.ohrt.dev' },
  { name: 'Services', href: 'https://status.ohrt.dev'},
];

export const constructionPages = () =>
  [...NAVIGATE, ...OFFSITE].filter((item) => item.construction && item.href?.startsWith('/'));
