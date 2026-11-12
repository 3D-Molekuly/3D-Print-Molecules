import type { SupportedLocale } from '$lib/functions/language';
import type { LocaleContent } from './types';
import { cs } from './cs';
import { en } from './en';
import { de } from './de';
import { fr } from './fr';
import { es } from './es';
import { pt } from './pt';
import { zh } from './zh';
import { ja } from './ja';

export type { LocaleContent, FaqItem } from './types';

export const CONTENT: Record<SupportedLocale, LocaleContent> = { cs, en, de, fr, es, pt, zh, ja };

export function getContent(lang: SupportedLocale): LocaleContent {
	return CONTENT[lang] ?? en;
}
