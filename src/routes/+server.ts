import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const pages = [
    { url: 'https://3d-print-molecules-web.vercel.app/', priority: 1.0 },
    { url: 'https://3d-print-molecules-web.vercel.app/en/about', priority: 0.8 },
    { url: 'https://3d-print-molecules-web.vercel.app/cs/about', priority: 0.8 },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages
        .map(
          (page) => `
        <url>
          <loc>${page.url}</loc>
          <priority>${page.priority}</priority>
        </url>`
        )
        .join('')}
    </urlset>
  `;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};