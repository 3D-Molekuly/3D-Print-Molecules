import type { RequestHandler } from './$types';
import { SITE_ORIGIN, type AlternateLink } from '$lib/seo';

interface SitemapEntry {
	loc: string;
	priority: string;
	changefreq: 'weekly' | 'monthly';
	alternates: AlternateLink[];
}

export const GET: RequestHandler = async () => {
	const homeAlternates: AlternateLink[] = [
		{ hreflang: 'cs', href: `${SITE_ORIGIN}/cs` },
		{ hreflang: 'en', href: `${SITE_ORIGIN}/en` },
		{ hreflang: 'x-default', href: `${SITE_ORIGIN}/` }
	];

	const tutorialsAlternates: AlternateLink[] = [
		{ hreflang: 'cs', href: `${SITE_ORIGIN}/cs/tutorials` },
		{ hreflang: 'en', href: `${SITE_ORIGIN}/en/tutorials` },
		{ hreflang: 'x-default', href: `${SITE_ORIGIN}/en/tutorials` }
	];

	const aboutAlternates: AlternateLink[] = [
		{ hreflang: 'cs', href: `${SITE_ORIGIN}/cs/about` },
		{ hreflang: 'en', href: `${SITE_ORIGIN}/en/about` },
		{ hreflang: 'x-default', href: `${SITE_ORIGIN}/en/about` }
	];

	const examplesAlternates: AlternateLink[] = [
		{ hreflang: 'cs', href: `${SITE_ORIGIN}/cs/examples` },
		{ hreflang: 'en', href: `${SITE_ORIGIN}/en/examples` },
		{ hreflang: 'x-default', href: `${SITE_ORIGIN}/en/examples` }
	];

	const pages: SitemapEntry[] = [
		{ loc: `${SITE_ORIGIN}/`, priority: '1.0', changefreq: 'weekly', alternates: homeAlternates },
		{ loc: `${SITE_ORIGIN}/cs`, priority: '1.0', changefreq: 'weekly', alternates: homeAlternates },
		{ loc: `${SITE_ORIGIN}/en`, priority: '1.0', changefreq: 'weekly', alternates: homeAlternates },
		{
			loc: `${SITE_ORIGIN}/cs/tutorials`,
			priority: '0.9',
			changefreq: 'monthly',
			alternates: tutorialsAlternates
		},
		{
			loc: `${SITE_ORIGIN}/en/tutorials`,
			priority: '0.9',
			changefreq: 'monthly',
			alternates: tutorialsAlternates
		},
		{
			loc: `${SITE_ORIGIN}/cs/examples`,
			priority: '0.9',
			changefreq: 'weekly',
			alternates: examplesAlternates
		},
		{
			loc: `${SITE_ORIGIN}/en/examples`,
			priority: '0.9',
			changefreq: 'weekly',
			alternates: examplesAlternates
		},
		{
			loc: `${SITE_ORIGIN}/cs/about`,
			priority: '0.8',
			changefreq: 'monthly',
			alternates: aboutAlternates
		},
		{
			loc: `${SITE_ORIGIN}/en/about`,
			priority: '0.8',
			changefreq: 'monthly',
			alternates: aboutAlternates
		}
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
