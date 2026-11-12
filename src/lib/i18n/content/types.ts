/**
 * Longer localized content that does not live in the flat svelte-i18n JSON files:
 * SEO metadata / JSON-LD, the examples gallery and the printed-model texts.
 * One file per locale (cs.ts, en.ts, de.ts, …) implements this interface, so TypeScript
 * reports any missing string when a language is added.
 */
export interface FaqItem {
	question: string;
	answer: string;
}

export interface HowToStepText {
	name: string;
	text: string;
}

export interface PageSeoText {
	title: string;
	description: string;
	keywords: string;
}

export interface LocaleContent {
	seo: {
		siteName: string;
		/** Name of the site in another language, for JSON-LD `alternateName`. */
		alternateName: string;
		author: string;
		ogImageAlt: string;
		orgUct: string;
		orgLf1: string;
		home: PageSeoText & {
			/** og:title when a molecule is shared via `?mol=` (receives the molecule name). */
			sharedOgTitle: (molecule: string) => string;
			featureList: string[];
		};
		tutorials: PageSeoText & {
			howToName: string;
			steps: [HowToStepText, HowToStepText, HowToStepText];
			breadcrumb: string;
		};
		about: PageSeoText & { breadcrumb: string };
		examples: PageSeoText;
		demonstrations: PageSeoText;
	};
	/** FAQ shown on the home page and in the FAQPage JSON-LD. */
	faq: FaqItem[];
	gallery: {
		heading: string;
		intro: string;
		channels: string;
		aminoHeading: string;
		aminoMeta: (n: number) => string;
		aminoIntro: string;
		searchLabel: string;
		searchPlaceholder: string;
		searchClear: string;
		searchResults: (n: number) => string;
		searchEmpty: string;
		ctaHeading: string;
		ctaText: string;
		ctaButton: string;
	};
	modelCard: {
		openEditor: string;
		photoAlt: string;
		makerworldPending: string;
	};
	/**
	 * Names/descriptions of printed models keyed by model id (see `$lib/data/printedModels`).
	 * Czech and English are stored inline in printedModels.ts; other locales provide them here.
	 */
	models?: Record<string, { name: string; description: string }>;
}
