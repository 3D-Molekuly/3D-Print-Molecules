import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const {
	normalizeLocale,
	localeFromAcceptLanguage,
	localeFromNavigator,
	getLocaleFromPath,
	getTargetSwitchPath,
	stripLocaleFromPath
} = await import('./language');

describe('language detection', () => {
	it('normalizes language tags to supported locales', () => {
		expect(normalizeLocale('de-AT')).toBe('de');
		expect(normalizeLocale('pt-BR')).toBe('pt');
		expect(normalizeLocale('fr')).toBe('fr');
		expect(normalizeLocale('es-419')).toBe('es');
		expect(normalizeLocale('sk')).toBe('cs');
		expect(normalizeLocale('ja')).toBe('en');
		expect(normalizeLocale(undefined)).toBe('en');
	});

	it('picks the best Accept-Language match by q-weight', () => {
		expect(localeFromAcceptLanguage('ja,de;q=0.8,en;q=0.5')).toBe('de');
		expect(localeFromAcceptLanguage('en;q=0.3,fr-CA;q=0.9')).toBe('fr');
		expect(localeFromAcceptLanguage('ja,zh')).toBe('en');
		expect(localeFromAcceptLanguage(null)).toBe('en');
	});

	it('falls through the browser language list', () => {
		expect(localeFromNavigator({ language: 'ja', languages: ['ja', 'pt-BR', 'en'] })).toBe('pt');
		expect(localeFromNavigator({ language: 'es-MX', languages: [] })).toBe('es');
	});

	it('handles locale path segments', () => {
		expect(getLocaleFromPath('/de/about')).toBe('de');
		expect(getLocaleFromPath('/es')).toBe('es');
		expect(getLocaleFromPath('/design')).toBeNull();
		expect(stripLocaleFromPath('/fr/tutorials')).toBe('/tutorials');
		expect(getTargetSwitchPath('pt', '/cs/examples')).toBe('/pt/examples');
		expect(getTargetSwitchPath('de', '/')).toBe('/de');
	});
});
