import type { RequestHandler } from './$types';
import { SITE_ORIGIN, localizedAlternates, type AlternateLink } from '$lib/seo';
import { supportedLocales } from '$lib/functions/language';

interface SitemapEntry {
	loc: string;
	priority: string;
	changefreq: 'weekly' | 'monthly';
	alternates: AlternateLink[];
}

export const GET: RequestHandler = async () => {
	const homeAlternates = localizedAlternates('', `${SITE_ORIGIN}/`);

	const subpages: { path: string; priority: string; changefreq: SitemapEntry['changefreq'] }[] = [
		{ path: '/tutorials', priority: '0.9', changefreq: 'monthly' },
		{ path: '/examples', priority: '0.9', changefreq: 'weekly' },
		{ path: '/about', priority: '0.8', changefreq: 'monthly' }
	];

	const pages: SitemapEntry[] = [
		{ loc: `${SITE_ORIGIN}/`, priority: '1.0', changefreq: 'weekly', alternates: homeAlternates },
		...supportedLocales.map((l) => ({
			loc: `${SITE_ORIGIN}/${l}`,
			priority: '1.0',
			changefreq: 'weekly' as const,
			alternates: homeAlternates
		})),
		...subpages.flatMap(({ path, priority, changefreq }) => {
			const alternates = localizedAlternates(path, `${SITE_ORIGIN}/en${path}`);
			return supportedLocales.map((l) => ({
				loc: `${SITE_ORIGIN}/${l}${path}`,
				priority,
				changefreq,
				alternates
			}));
		})
	];

	const urlsXml = pages
		.map(
			(page) => `  <url>
    <loc>${page.loc}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
${page.alternates
	.map(
		(alt) =>
			`    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${alt.href}" />`
	)
	.join('\n')}
  </url>`
		)
		.join('\n');

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXml}
</urlset>
`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'max-age=0, s-maxage=3600'
		}
	});
};
