import { describe, expect, it } from 'vitest';
import { buildSearchIndex, matchesAllTerms, tokenizeQuery } from './gallerySearch';

const search = (parts: string[], query: string) =>
	matchesAllTerms(buildSearchIndex(parts), tokenizeQuery(query));

describe('gallery search', () => {
	it('matches Latin terms from a word start, ignoring diacritics and case', () => {
		expect(search(['glycine', 'Glycin'], 'GLY')).toBe(true);
		expect(search(['Kyselina glutamová'], 'glutamova')).toBe(true);
		expect(search(['glycine'], 'cine')).toBe(false);
	});

	it('matches formulas written with subscripts or full-width digits', () => {
		expect(search(['Ala · C₃H₇NO₂'], 'c3h7')).toBe(true);
		expect(search(['Ala · C₃H₇NO₂'], 'Ｃ３Ｈ７')).toBe(true);
	});

	it('matches Chinese and Japanese terms anywhere in the text', () => {
		expect(search(['葡萄糖', '生物体的主要能量来源'], '葡萄')).toBe(true);
		expect(search(['葡萄糖'], '萄糖')).toBe(true);
		expect(search(['グルコース'], 'グルコース')).toBe(true);
		expect(search(['トリプトファン'], 'ファン')).toBe(true);
		expect(search(['グルコース'], '果糖')).toBe(false);
	});

	it('requires every term to match', () => {
		expect(search(['ATP', 'adenosine triphosphate'], 'atp adeno')).toBe(true);
		expect(search(['ATP'], 'atp glucose')).toBe(false);
	});
});
