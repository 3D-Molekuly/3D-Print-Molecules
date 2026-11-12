import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { DEFAULT_OG_IMAGE, getRouteSeo, SITE_ORIGIN } from './seo';
import { reroute } from '../hooks';
import { GET as getSitemap } from '../routes/sitemap.xml/+server';
import { load as loadEnDemo } from '../routes/en/demonstrations/+page.server';
import { load as loadCsDemo } from '../routes/cs/demonstrations/+page.server';

describe('getRouteSeo', () => {
	it('generates canonical, hreflang, and valid JSON-LD for root and localized homepages', () => {
		const rootEn = getRouteSeo(new URL('https://3dmolekuly.vscht.cz/'), 'en');
		expect(rootEn.canonicalUrl).toBe('https://3dmolekuly.vscht.cz/');
		expect(rootEn.robots).toBe('index, follow');
		expect(rootEn.ogImage).toBe(DEFAULT_OG_IMAGE);
		expect(rootEn.alternates).toEqual([
			{ hreflang: 'cs', href: `${SITE_ORIGIN}/cs` },
			{ hreflang: 'en', href: `${SITE_ORIGIN}/en` },
			{ hreflang: 'de', href: `${SITE_ORIGIN}/de` },
			{ hreflang: 'fr', href: `${SITE_ORIGIN}/fr` },
			{ hreflang: 'es', href: `${SITE_ORIGIN}/es` },
			{ hreflang: 'pt', href: `${SITE_ORIGIN}/pt` },
			{ hreflang: 'zh-Hans', href: `${SITE_ORIGIN}/zh` },
			{ hreflang: 'ja', href: `${SITE_ORIGIN}/ja` },
			{ hreflang: 'x-default', href: `${SITE_ORIGIN}/` }
		]);

		const csHome = getRouteSeo(new URL('https://3dmolekuly.vscht.cz/cs/'), 'en');
		expect(csHome.lang).toBe('cs');
		expect(csHome.canonicalUrl).toBe('https://3dmolekuly.vscht.cz/cs');
		expect(csHome.ogLocale).toBe('cs_CZ');
		expect(csHome.title).toContain('3D Tisk Molekul');

		// Verify JSON-LD parses cleanly and has valid Offer currency + FAQPage
		const jsonRaw = csHome.jsonLdHtml
			.replace(/^<script type="application\/ld\+json">/, '')
			.replace(/<\/script>$/, '');
		const parsed = JSON.parse(jsonRaw);
		expect(parsed['@graph']).toHaveLength(2);
		expect(parsed['@graph'][0]['@type']).toBe('WebApplication');
		expect(parsed['@graph'][0].offers.priceCurrency).toBe('CZK');
		expect(parsed['@graph'][1]['@type']).toBe('FAQPage');
	});

	it('strips share query parameters from canonical URL while enriching og:title for shared molecules', () => {
		const shared = getRouteSeo(
			new URL('https://3dmolekuly.vscht.cz/?source=pubchem&mol=caffeine&style=ball-and-stick'),
			'cs'
		);
		expect(shared.canonicalUrl).toBe('https://3dmolekuly.vscht.cz/');
		expect(shared.ogTitle).toContain('caffeine');
		expect(shared.ogUrl).toBe(
			'https://3dmolekuly.vscht.cz/?source=pubchem&mol=caffeine&style=ball-and-stick'
		);
	});

	it('provides unique titles, descriptions, and HowTo/AboutPage schemas for subpages', () => {
		const csTut = getRouteSeo(new URL('https://3dmolekuly.vscht.cz/cs/tutorials'), 'en');
		const enAbout = getRouteSeo(new URL('https://3dmolekuly.vscht.cz/en/about'), 'cs');
		const home = getRouteSeo(new URL('https://3dmolekuly.vscht.cz/cs'), 'cs');

		expect(csTut.lang).toBe('cs');
		expect(csTut.title).not.toBe(home.title);
		expect(csTut.description).not.toBe(home.description);
		expect(csTut.canonicalUrl).toBe('https://3dmolekuly.vscht.cz/cs/tutorials');
		expect(csTut.alternates).toEqual([
			{ hreflang: 'cs', href: 'https://3dmolekuly.vscht.cz/cs/tutorials' },
			{ hreflang: 'en', href: 'https://3dmolekuly.vscht.cz/en/tutorials' },
			{ hreflang: 'de', href: 'https://3dmolekuly.vscht.cz/de/tutorials' },
			{ hreflang: 'fr', href: 'https://3dmolekuly.vscht.cz/fr/tutorials' },
			{ hreflang: 'es', href: 'https://3dmolekuly.vscht.cz/es/tutorials' },
			{ hreflang: 'pt', href: 'https://3dmolekuly.vscht.cz/pt/tutorials' },
			{ hreflang: 'zh-Hans', href: 'https://3dmolekuly.vscht.cz/zh/tutorials' },
			{ hreflang: 'ja', href: 'https://3dmolekuly.vscht.cz/ja/tutorials' },
			{ hreflang: 'x-default', href: 'https://3dmolekuly.vscht.cz/en/tutorials' }
		]);

		expect(enAbout.lang).toBe('en');
		expect(enAbout.canonicalUrl).toBe('https://3dmolekuly.vscht.cz/en/about');
	});

	it('localizes og:locale and canonical for the new languages', () => {
		const de = getRouteSeo(new URL('https://3dmolekuly.vscht.cz/de/about'), 'en');
		expect(de.lang).toBe('de');
		expect(de.ogLocale).toBe('de_DE');
		expect(de.ogLocaleAlternate).toContain('cs_CZ');
		expect(de.ogLocaleAlternate).not.toContain('de_DE');
		expect(de.canonicalUrl).toBe('https://3dmolekuly.vscht.cz/de/about');

		const zh = getRouteSeo(new URL('https://3dmolekuly.vscht.cz/zh/tutorials'), 'en');
		expect(zh.lang).toBe('zh');
		expect(zh.ogLocale).toBe('zh_CN');
		expect(zh.jsonLdHtml).toContain('"inLanguage":"zh-Hans"');
	});

	it('marks unfinished demonstrations pages as noindex, nofollow', () => {
		const demo = getRouteSeo(new URL('https://3dmolekuly.vscht.cz/cs/demonstrations'), 'cs');
		expect(demo.robots).toBe('noindex, nofollow');
	});

	it('reroutes /cs and /en homepages to / while keeping subpages untouched', () => {
		expect(reroute({ url: new URL('https://3dmolekuly.vscht.cz/cs'), fetch } as any)).toBe('/');
		expect(reroute({ url: new URL('https://3dmolekuly.vscht.cz/en/'), fetch } as any)).toBe('/');
		expect(reroute({ url: new URL('https://3dmolekuly.vscht.cz/de'), fetch } as any)).toBe('/');
		expect(reroute({ url: new URL('https://3dmolekuly.vscht.cz/pt/'), fetch } as any)).toBe('/');
		expect(
			reroute({ url: new URL('https://3dmolekuly.vscht.cz/cs/tutorials'), fetch } as any)
		).toBeUndefined();
	});

	it('serves a multilingual XML sitemap for https://3dmolekuly.vscht.cz', async () => {
		const response = await getSitemap({} as any);
		expect(response.headers.get('Content-Type')).toContain('application/xml');
		const xml = await response.text();
		expect(xml).toContain('<loc>https://3dmolekuly.vscht.cz/</loc>');
		expect(xml).toContain('<loc>https://3dmolekuly.vscht.cz/cs</loc>');
		expect(xml).toContain('<loc>https://3dmolekuly.vscht.cz/en</loc>');
		expect(xml).toContain('<loc>https://3dmolekuly.vscht.cz/cs/tutorials</loc>');
		expect(xml).toContain('<loc>https://3dmolekuly.vscht.cz/en/tutorials</loc>');
		expect(xml).toContain('<loc>https://3dmolekuly.vscht.cz/cs/about</loc>');
		expect(xml).toContain('<loc>https://3dmolekuly.vscht.cz/en/about</loc>');
		expect(xml).toContain('<loc>https://3dmolekuly.vscht.cz/cs/examples</loc>');
		expect(xml).toContain('<loc>https://3dmolekuly.vscht.cz/en/examples</loc>');
		for (const l of ['de', 'fr', 'es', 'pt', 'ja']) {
			expect(xml).toContain(`<loc>https://3dmolekuly.vscht.cz/${l}/tutorials</loc>`);
			expect(xml).toContain(`hreflang="${l}"`);
		}
		expect(xml).toContain('<loc>https://3dmolekuly.vscht.cz/zh/tutorials</loc>');
		expect(xml).toContain('hreflang="zh-Hans"');
		expect(xml).toContain('xhtml:link rel="alternate" hreflang="cs"');
		expect(xml).not.toContain('demonstrations');
		expect(xml).not.toContain('vercel.app');
	});

	it('indexes the examples gallery with hreflang and a CollectionPage JSON-LD', () => {
		const ex = getRouteSeo(new URL('https://3dmolekuly.vscht.cz/cs/examples'), 'cs');
		expect(ex.robots).toBe('index, follow');
		expect(ex.canonicalUrl).toBe('https://3dmolekuly.vscht.cz/cs/examples');
		expect(ex.alternates.map((a) => a.href)).toContain('https://3dmolekuly.vscht.cz/en/examples');
		expect(ex.jsonLdHtml).toContain('"@type":"CollectionPage"');
		expect(ex.jsonLdHtml).toContain('makerworld.com');
	});

	it('redirects demonstrations routes permanently (301) to the localized examples gallery', () => {
		try {
			loadEnDemo({} as any);
			expect.fail('Expected 301 redirect');
		} catch (err: any) {
			expect(err.status).toBe(301);
			expect(err.location).toBe('/en/examples');
		}

		try {
			loadCsDemo({} as any);
			expect.fail('Expected 301 redirect');
		} catch (err: any) {
			expect(err.status).toBe(301);
			expect(err.location).toBe('/cs/examples');
		}
	});

	it('ensures robots.txt does not disallow demonstrations pages so crawlers follow 301 redirects', () => {
		const robots = fs.readFileSync('static/robots.txt', 'utf-8');
		expect(robots).not.toContain('Disallow: /cs/demonstrations');
		expect(robots).not.toContain('Disallow: /en/demonstrations');
		expect(robots).toContain('Sitemap: https://3dmolekuly.vscht.cz/sitemap.xml');
	});
});
