import { getLocaleFromPath, type SupportedLocale } from '$lib/functions/language';

export const SITE_ORIGIN = 'https://3dmolekuly.vscht.cz';
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/favicon/screenshots/screenshot-wide.png`;

export interface FaqItem {
	question: string;
	answer: string;
}

export interface AlternateLink {
	hreflang: 'cs' | 'en' | 'x-default';
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
	ogLocale: 'cs_CZ' | 'en_US';
	ogLocaleAlternate: 'cs_CZ' | 'en_US';
	robots: string;
	alternates: AlternateLink[];
	jsonLdHtml: string;
}

export const HOME_FAQ: Record<SupportedLocale, FaqItem[]> = {
	cs: [
		{
			question: 'Jaké zdroje dat a formáty souborů aplikace podporuje?',
			answer:
				'Molekuly můžete vyhledat přímo podle názvu, CID nebo CAS čísla v databázi PubChem, pomocí 4místného kódu proteinu v RCSB PDB, případně přes ID v Crystallography Open Database (COD). Nahrát lze i vlastní soubory ve formátech .sdf, .pdb a .cif.'
		},
		{
			question: 'Jak vytisknout molekulu vícebarevně na 3D tiskárně?',
			answer:
				'Pro tiskárny s vícemateriálovou jednotkou (AMS, MMU, více extruderů) stáhněte přímo soubor .3MF, který již obsahuje rozdělené části a přiřazené barvy atomů (CPK). Pro běžné jednobarevné tiskárny využijte režim Spheres SPLIT FOR GLUING, který vygeneruje samostatné vodotěsné díly s plochami pro slepení či kolíky z 1,75mm filamentu.'
		},
		{
			question: 'Se kterými slicery jsou exportované modely kompatibilní?',
			answer:
				'Exportované soubory .3MF a .STL fungují v programech PrusaSlicer, Bambu Studio, OrcaSlicer i Ultimaker Cura. Tlačítko Slice navíc umožňuje otevřít vygenerovaný .3MF model přímo ve zvoleném desktopovém sliceru.'
		},
		{
			question: 'Je aplikace 3D Tisk Molekul zdarma pro školy a výuku?',
			answer:
				'Ano, nástroj vyvinutý ve spolupráci VŠCHT Praha a 1. lékařské fakulty Univerzity Karlovy je zcela zdarma bez registrace pro studenty, pedagogy, vědce i nadšence do 3D tisku.'
		}
	],
	en: [
		{
			question: 'Which molecular databases and file formats are supported?',
			answer:
				'You can search molecules directly by name, CID, or CAS number from PubChem, by 4-character entry ID from RCSB PDB, or by crystal ID from the Crystallography Open Database (COD). You can also upload custom .sdf, .pdb, and .cif structure files.'
		},
		{
			question: 'How do I print multicolor molecular models?',
			answer:
				'For multi-material 3D printers (AMS, MMU, toolchangers), export directly to .3MF with pre-assigned CPK atom colors and multi-part geometry. For single-extruder printers without multi-color hardware, choose the Spheres SPLIT FOR GLUING mode to generate separate watertight parts ready for gluing with optional 1.75 mm filament alignment pegs.'
		},
		{
			question: 'Which 3D printing slicers are supported?',
			answer:
				'Exported .3MF and .STL files work seamlessly in PrusaSlicer, Bambu Studio, OrcaSlicer, and Ultimaker Cura. You can also launch the model directly in your desktop slicer using the built-in Slice button.'
		},
		{
			question: 'Is 3D Printing Molecules free for education and research?',
			answer:
				'Yes, this web application developed by UCT Prague and the First Faculty of Medicine at Charles University is completely free to use with no account required for educators, students, researchers, and makers.'
		}
	]
};

export function normalizePathname(pathname: string): string {
	if (!pathname || pathname === '/') return '/';
	const stripped = pathname.replace(/\/+$/, '');
	return stripped || '/';
}

type RouteKind = 'home' | 'tutorials' | 'about' | 'demonstrations' | 'other';

function classifyRoute(pathname: string): { kind: RouteKind; baseSubpath: string } {
	const clean = normalizePathname(pathname);
	if (clean === '/' || clean === '/cs' || clean === '/en') {
		return { kind: 'home', baseSubpath: '' };
	}
	const withoutLocale = clean.replace(/^\/(cs|en)(?=\/|$)/, '');
	if (withoutLocale === '/tutorials') {
		return { kind: 'tutorials', baseSubpath: '/tutorials' };
	}
	if (withoutLocale === '/about') {
		return { kind: 'about', baseSubpath: '/about' };
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
	const isCs = lang === 'cs';
	const { kind, baseSubpath } = classifyRoute(cleanPath);

	const siteName = isCs ? '3D Tisk Molekul' : '3D Printing Molecules';
	const author = isCs
		? 'VŠCHT Praha, 1. lékařská fakulta UK'
		: 'UCT Prague, First Faculty of Medicine – Charles University';
	const ogLocale = isCs ? 'cs_CZ' : 'en_US';
	const ogLocaleAlternate = isCs ? 'en_US' : 'cs_CZ';
	const ogImageAlt = isCs
		? 'Ukázka webové aplikace 3D Tisk Molekul pro přípravu 3MF a STL modelů molekul'
		: '3D Printing Molecules web application interface for generating 3MF and STL molecular models';

	let canonicalUrl = `${SITE_ORIGIN}${cleanPath === '/' ? '/' : cleanPath}`;
	let alternates: AlternateLink[] = [];

	if (kind === 'home') {
		alternates = [
			{ hreflang: 'cs', href: `${SITE_ORIGIN}/cs` },
			{ hreflang: 'en', href: `${SITE_ORIGIN}/en` },
			{ hreflang: 'x-default', href: `${SITE_ORIGIN}/` }
		];
	} else if (kind === 'tutorials' || kind === 'about') {
		canonicalUrl = `${SITE_ORIGIN}/${lang}${baseSubpath}`;
		alternates = [
			{ hreflang: 'cs', href: `${SITE_ORIGIN}/cs${baseSubpath}` },
			{ hreflang: 'en', href: `${SITE_ORIGIN}/en${baseSubpath}` },
			{ hreflang: 'x-default', href: `${SITE_ORIGIN}/en${baseSubpath}` }
		];
	}

	let title: string;
	let description: string;
	let keywords: string;
	let robots = 'index, follow';
	let ogTitle: string;
	let ogDescription: string;
	let ogUrl = canonicalUrl;
	let jsonLdData: Record<string, unknown>;

	const organizations = [
		{
			'@type': 'EducationalOrganization',
			name: isCs
				? 'Ústav učitelství chemie a humanitních věd VŠCHT Praha'
				: 'University of Chemistry and Technology, Prague (UCT Prague)',
			url: 'https://kuhv.vscht.cz'
		},
		{
			'@type': 'EducationalOrganization',
			name: isCs
				? '1. lékařská fakulta Univerzity Karlovy'
				: 'First Faculty of Medicine, Charles University',
			url: 'https://www.lf1.cuni.cz'
		}
	];

	if (kind === 'tutorials') {
		title = isCs
			? 'Návod: Jak připravit a vytisknout 3D model molekuly | 3D Tisk Molekul'
			: 'Tutorial: How to Prepare & 3D Print Molecule Models | 3D Printing Molecules';
		description = isCs
			? 'Podrobný návod krok za krokem: import molekul z PubChem, PDB, COD nebo souborů SDF/CIF, volba reprezentace a export barevného 3MF či STL modelu do sliceru.'
			: 'Step-by-step guide to importing molecules from PubChem, PDB, COD, or SDF/CIF files, customizing 3D representations, and exporting multicolor 3MF/STL models for your slicer.';
		keywords = isCs
			? 'návod 3D tisk molekul, jak vytisknout molekulu, vícebarevný tisk 3MF, PrusaSlicer multi-part object, Bambu Studio molekuly, PubChem STL návod'
			: 'how to 3D print molecules, molecular model tutorial, multicolor 3MF slicer guide, PrusaSlicer multi-part object, Bambu Studio molecule print';
		ogTitle = title;
		ogDescription = description;
		jsonLdData = {
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'HowTo',
					name: isCs
						? 'Jak připravit 3D model molekuly pro tisk'
						: 'How to prepare a molecular model for 3D printing',
					description,
					inLanguage: lang,
					image: DEFAULT_OG_IMAGE,
					totalTime: 'PT3M',
					tool: [
						{ '@type': 'HowToTool', name: 'PrusaSlicer / Bambu Studio / OrcaSlicer / Cura' }
					],
					step: [
						{
							'@type': 'HowToStep',
							position: 1,
							name: isCs ? 'Výběr nebo nahrání molekuly' : 'Select or upload a molecule',
							text: isCs
								? 'Vyhledejte sloučeninu v databázi PubChem, PDB či COD nebo nahrajte vlastní soubor .sdf, .pdb nebo .cif.'
								: 'Search for a compound in PubChem, PDB, or COD, or upload your own .sdf, .pdb, or .cif file.'
						},
						{
							'@type': 'HowToStep',
							position: 2,
							name: isCs ? 'Volba reprezentace a parametrů' : 'Choose representation and settings',
							text: isCs
								? 'Vyberte styl modelu (Spheres, Split for Gluing, Ball-and-Stick, Moving Joints, Sticks) a upravte měřítko, kvalitu sítě nebo tloušťku vazeb.'
								: 'Select a model style (Spheres, Split for Gluing, Ball-and-Stick, Moving Joints, Sticks) and adjust scale, mesh quality, or bond diameter.'
						},
						{
							'@type': 'HowToStep',
							position: 3,
							name: isCs ? 'Export do 3MF nebo STL a slicing' : 'Export to 3MF or STL and slice',
							text: isCs
								? 'Stáhněte barevný .3MF soubor nebo ZIP s oddělenými STL díly a otevřete model ve sliceru jako vícedílný objekt.'
								: 'Download the colored .3MF file or ZIP of separate STL parts and import the model into your 3D slicer as a multi-part object.'
						}
					]
				},
				{
					'@type': 'BreadcrumbList',
					itemListElement: [
						{
							'@type': 'ListItem',
							position: 1,
							name: siteName,
							item: `${SITE_ORIGIN}/${lang}`
						},
						{
							'@type': 'ListItem',
							position: 2,
							name: isCs ? 'Návod' : 'Tutorial',
							item: canonicalUrl
						}
					]
				}
			]
		};
	} else if (kind === 'about') {
		title = isCs
			? 'O projektu VŠCHT Praha a 1. LF UK | 3D Tisk Molekul'
			: 'About the Project – UCT Prague & Charles University | 3D Printing Molecules';
		description = isCs
			? 'Akademický projekt VŠCHT Praha a 1. lékařské fakulty UK zpřístupňující rychlou přípravu a vícebarevný 3D tisk modelů bioorganických i anorganických molekul.'
			: 'Academic collaboration between UCT Prague and Charles University making multicolor 3D printing of molecular models fast and accessible for educators, students, and researchers.';
		keywords = isCs
			? 'VŠCHT Praha, 1. LF UK, výuka chemie 3D tisk, didaktické pomůcky chemie, modely molekul pro školy'
			: 'UCT Prague, Charles University, chemistry education 3D printing, molecular teaching aids, academic open-source tool';
		ogTitle = title;
		ogDescription = description;
		jsonLdData = {
			'@context': 'https://schema.org',
			'@graph': [
				{
					'@type': 'AboutPage',
					name: title,
					description,
					url: canonicalUrl,
					inLanguage: lang,
					about: {
						'@type': 'WebApplication',
						name: siteName,
						url: SITE_ORIGIN
					},
					author: organizations
				},
				{
					'@type': 'BreadcrumbList',
					itemListElement: [
						{
							'@type': 'ListItem',
							position: 1,
							name: siteName,
							item: `${SITE_ORIGIN}/${lang}`
						},
						{
							'@type': 'ListItem',
							position: 2,
							name: isCs ? 'O nás' : 'About',
							item: canonicalUrl
						}
					]
				}
			]
		};
	} else if (kind === 'demonstrations') {
		robots = 'noindex, nofollow';
		title = isCs ? `Příklady | ${siteName}` : `Examples | ${siteName}`;
		description = isCs
			? 'Ukázky vytištěných 3D modelů molekul.'
			: 'Examples of 3D printed molecular models.';
		keywords = isCs ? '3D tisk molekul, příklady' : '3D printing molecules, examples';
		ogTitle = title;
		ogDescription = description;
		jsonLdData = {
			'@context': 'https://schema.org',
			'@type': 'WebPage',
			name: title,
			url: canonicalUrl,
			inLanguage: lang
		};
	} else {
		// Home / Editor ('/', '/cs', '/en') and fallback
		title = isCs
			? '3D Tisk Molekul – Generátor 3MF a STL modelů z PubChem, PDB a CIF'
			: '3D Printing Molecules – Free PubChem, PDB & CIF to 3MF/STL Generator';
		description = isCs
			? 'Bezplatná webová aplikace VŠCHT Praha a 1. LF UK pro přípravu vícebarevných 3D modelů molekul k tisku. Převeďte struktury z PubChem, PDB, COD, SDF a CIF do 3MF nebo STL.'
			: 'Free web app by UCT Prague & Charles University to visualize and convert molecules from PubChem, PDB, COD, SDF, and CIF into multicolor 3D-printable 3MF and STL models.';
		keywords = isCs
			? '3D tisk molekul, 3D modely molekul, chemie 3D tisk, PubChem do STL, PDB do 3MF, vícebarevný 3D tisk, molekulové modely, PrusaSlicer, Bambu Studio, VŠCHT Praha'
			: '3D print molecules, molecular 3D printing, PubChem to STL, PDB to 3MF, CIF to STL, multicolor molecule model, chemistry teaching models, PrusaSlicer, Bambu Studio';

		const sharedMol = (url.searchParams.get('mol') ?? url.searchParams.get('q') ?? '').trim();
		if (sharedMol && sharedMol.length <= 80) {
			ogTitle = isCs
				? `${sharedMol} – 3D model molekuly k tisku | ${siteName}`
				: `${sharedMol} – 3D Printable Molecule Model | ${siteName}`;
			ogUrl = `${SITE_ORIGIN}${cleanPath === '/' ? '/' : cleanPath}${url.search}`;
		} else {
			ogTitle = title;
		}
		ogDescription = description;

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
					alternateName: isCs ? '3D Printing Molecules' : '3D Tisk Molekul',
					url: canonicalUrl,
					description,
					inLanguage: ['cs', 'en'],
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
					featureList: isCs
						? [
								'Import struktur z PubChem, RCSB PDB a Crystallography Open Database (COD)',
								'Nahrání vlastních souborů .sdf, .pdb a .cif',
								'Vícebarevný export do .3MF a oddělených .STL souborů',
								'Režimy Spheres, Split for Gluing, Ball-and-Stick, Print-in-Place Moving Joints, Sticks a Minecraft',
								'Přímé otevření v PrusaSlicer, Bambu Studio, OrcaSlicer a Ultimaker Cura'
							]
						: [
								'Import molecular structures from PubChem, RCSB PDB, and Crystallography Open Database (COD)',
								'Upload custom .sdf, .pdb, and .cif files',
								'Multicolor .3MF and multi-part .STL export',
								'Spheres, Split for Gluing, Ball-and-Stick, Print-in-Place Moving Joints, Sticks, and Minecraft modes',
								'Direct one-click launch in PrusaSlicer, Bambu Studio, OrcaSlicer, and Ultimaker Cura'
							],
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
