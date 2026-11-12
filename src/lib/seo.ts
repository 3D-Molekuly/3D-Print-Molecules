import {
	getLocaleFromPath,
	stripLocaleFromPath,
	supportedLocales,
	OG_LOCALES,
	HREFLANG,
	type SupportedLocale
} from '$lib/functions/language';
import { PRINTED_MODELS, AMINO_ACIDS, modelText } from '$lib/data/printedModels';
import { CONTENT, getContent, type FaqItem } from '$lib/i18n/content';

export type { FaqItem };

export const SITE_ORIGIN = 'https://3dmolekuly.vscht.cz';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/favicon/screenshots/screenshot-wide.png`;

export interface AlternateLink {
	hreflang: string;
	href: string;
}

export interface SeoMetadata {
	lang: SupportedLocale;
	title: string;
	description: string;
	keywords: string;
	author: string;
	siteName: string;
	canonicalUrl: string;
	ogUrl: string;
	ogTitle: string;
	ogDescription: string;
	ogImage: string;
	ogImageAlt: string;
	ogLocale: string;
	ogLocaleAlternate: string[];
	robots: string;
	alternates: AlternateLink[];
	jsonLdHtml: string;
}

export const HOME_FAQ = Object.fromEntries(
	supportedLocales.map((l) => [l, CONTENT[l].faq])
) as Record<SupportedLocale, FaqItem[]>;

/** hreflang alternates for a localized page; `x-default` points at `xDefault`. */
export function localizedAlternates(subpath: string, xDefault: string): AlternateLink[] {
	return [
		...supportedLocales.map((l) => ({ hreflang: HREFLANG[l], href: `${SITE_ORIGIN}/${l}${subpath}` })),
		{ hreflang: 'x-default' as const, href: xDefault }
	];
}

export function normalizePathname(pathname: string): string {
	if (!pathname || pathname === '/') return '/';
	const stripped = pathname.replace(/\/+$/, '');
	return stripped || '/';
}

type RouteKind = 'home' | 'tutorials' | 'about' | 'examples' | 'demonstrations' | 'other';

function classifyRoute(pathname: string): { kind: RouteKind; baseSubpath: string } {
	const clean = normalizePathname(pathname);
	if (clean === '/' || stripLocaleFromPath(clean) === '') {
		return { kind: 'home', baseSubpath: '' };
	}
	const withoutLocale = stripLocaleFromPath(clean);
	if (withoutLocale === '/tutorials') {
		return { kind: 'tutorials', baseSubpath: '/tutorials' };
	}
	if (withoutLocale === '/about') {
		return { kind: 'about', baseSubpath: '/about' };
	}
	if (withoutLocale === '/examples') {
		return { kind: 'examples', baseSubpath: '/examples' };
	}
	if (withoutLocale === '/demonstrations') {
		return { kind: 'demonstrations', baseSubpath: '/demonstrations' };
	}
	return { kind: 'other', baseSubpath: withoutLocale || '/' };
}

function serializeJsonLdToScriptTag(data: unknown): string {
	const safeJson = JSON.stringify(data).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${safeJson}</script>`;
}

export function getRouteSeo(url: URL, fallbackLocale: SupportedLocale = 'en'): SeoMetadata {
	const cleanPath = normalizePathname(url.pathname);
	const pathLocale = getLocaleFromPath(cleanPath);
	const lang: SupportedLocale = pathLocale ?? fallbackLocale;
	const text = getContent(lang).seo;
	const { kind, baseSubpath } = classifyRoute(cleanPath);

	const siteName = text.siteName;
	const author = text.author;
	const ogLocale = OG_LOCALES[lang];
	const ogLocaleAlternate = supportedLocales.filter((l) => l !== lang).map((l) => OG_LOCALES[l]);
	const ogImageAlt = text.ogImageAlt;

	let canonicalUrl = `${SITE_ORIGIN}${cleanPath === '/' ? '/' : cleanPath}`;
	let alternates: AlternateLink[] = [];

	if (kind === 'home') {
		alternates = localizedAlternates('', `${SITE_ORIGIN}/`);
	} else if (kind === 'tutorials' || kind === 'about' || kind === 'examples') {
		canonicalUrl = `${SITE_ORIGIN}/${lang}${baseSubpath}`;
		alternates = localizedAlternates(baseSubpath, `${SITE_ORIGIN}/en${baseSubpath}`);
	}

	let robots = 'index, follow';
	let ogUrl = canonicalUrl;
	let jsonLdData: Record<string, unknown>;

	const organizations = [
		{ '@type': 'EducationalOrganization', name: text.orgUct, url: 'https://kuhv.vscht.cz' },
		{ '@type': 'EducationalOrganization', name: text.orgLf1, url: 'https://www.lf1.cuni.cz' }
	];

	const pageText =
		kind === 'tutorials' || kind === 'about' || kind === 'examples' || kind === 'demonstrations'
			? text[kind]
			: text.home;
	const { title, description, keywords } = pageText;
	let ogTitle = title;
	const ogDescription = description;

	const breadcrumb = (name: string) => ({
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: siteName, item: `${SITE_ORIGIN}/${lang}` },
			{ '@type': 'ListItem', position: 2, name, item: canonicalUrl }
		]
	});

	if (kind === 'tutorials') {
		jsonLdData = {
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'HowTo',
					name: text.tutorials.howToName,
					description,
					inLanguage: HREFLANG[lang],
					image: DEFAULT_OG_IMAGE,
					totalTime: 'PT3M',
					tool: [
						{ '@type': 'HowToTool', name: 'PrusaSlicer / Bambu Studio / OrcaSlicer / Cura' }
					],
					step: text.tutorials.steps.map((step, index) => ({
						'@type': 'HowToStep',
						position: index + 1,
						name: step.name,
						text: step.text
					}))
				},
				breadcrumb(text.tutorials.breadcrumb)
			]
		};
	} else if (kind === 'about') {
		jsonLdData = {
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'AboutPage',
					name: title,
					description,
					url: canonicalUrl,
					inLanguage: HREFLANG[lang],
					about: {
						'@type': 'WebApplication',
						name: siteName,
						url: SITE_ORIGIN
					},
					author: organizations
				},
				breadcrumb(text.about.breadcrumb)
			]
		};
	} else if (kind === 'examples') {
		jsonLdData = {
			'@context': 'https://schema.org',
			'@type': 'CollectionPage',
			name: title,
			description,
			url: canonicalUrl,
			inLanguage: HREFLANG[lang],
			isPartOf: { '@type': 'WebSite', name: siteName, url: `${SITE_ORIGIN}/` },
			mainEntity: {
				'@type': 'ItemList',
				itemListElement: [...PRINTED_MODELS, ...AMINO_ACIDS].map((model, index) => {
					const { name, description: modelDescription } = modelText(model, lang);
					return {
						'@type': 'ListItem',
						position: index + 1,
						item: {
							'@type': '3DModel',
							name,
							description: modelDescription,
							image: model.image,
							url: model.printablesUrl,
							sameAs: model.makerworldUrl
								? [model.printablesUrl, model.makerworldUrl]
								: [model.printablesUrl],
							isAccessibleForFree: true,
							encodingFormat: ['model/3mf', 'model/stl']
						}
					};
				})
			}
		};
	} else if (kind === 'demonstrations') {
		robots = 'noindex, nofollow';
		jsonLdData = {
			'@context': 'https://schema.org',
			'@type': 'WebPage',
			name: title,
			url: canonicalUrl,
			inLanguage: lang
		};
	} else {
		// Home / Editor ('/', '/cs', '/en', …) and fallback
		const sharedMol = (url.searchParams.get('mol') ?? url.searchParams.get('q') ?? '').trim();
		if (sharedMol && sharedMol.length <= 80) {
			ogTitle = text.home.sharedOgTitle(sharedMol);
			ogUrl = `${SITE_ORIGIN}${cleanPath === '/' ? '/' : cleanPath}${url.search}`;
		}

		const faqEntities = HOME_FAQ[lang].map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer
			}
		}));

		jsonLdData = {
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'WebApplication',
					name: siteName,
					alternateName: text.alternateName,
					url: canonicalUrl,
					description,
					inLanguage: supportedLocales.map((l) => HREFLANG[l]),
					applicationCategory: 'EducationalApplication',
					operatingSystem: 'Any',
					browserRequirements: 'Requires JavaScript and WebGL',
					isAccessibleForFree: true,
					image: DEFAULT_OG_IMAGE,
					screenshot: DEFAULT_OG_IMAGE,
					offers: {
						'@type': 'Offer',
						price: '0',
						priceCurrency: 'CZK'
					},
					featureList: text.home.featureList,
					author: organizations
				},
				{
					'@type': 'FAQPage',
					mainEntity: faqEntities
				}
			]
		};
	}

	return {
		lang,
		title,
		description,
		keywords,
		author,
		siteName,
		canonicalUrl,
		ogUrl,
		ogTitle,
		ogDescription,
		ogImage: DEFAULT_OG_IMAGE,
		ogImageAlt,
		ogLocale,
		ogLocaleAlternate,
		robots,
		alternates,
		jsonLdHtml: serializeJsonLdToScriptTag(jsonLdData)
	};
}
