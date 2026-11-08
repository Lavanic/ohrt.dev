import type { APIRoute } from 'astro';
import { NAVIGATE, OFFSITE } from '../lib/nav';

export const GET: APIRoute = ({ site }) => {
  const urls = [...NAVIGATE, ...OFFSITE]
    .filter(({ href }) => href?.startsWith('/'))
    .map(({ href }) => `  <url><loc>${new URL(href!, site)}</loc></url>`);
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
