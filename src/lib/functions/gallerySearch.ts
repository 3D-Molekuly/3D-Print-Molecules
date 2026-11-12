/**
 * Text search for the printed-model gallery, working for every script the site is translated
 * into (Latin with diacritics, CJK, …).
 */
const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const SEPARATOR_RE = /[^\p{L}\p{N}\p{M}]+/gu;

/**
 * Lower-case, fold full-width forms (NFKD), strip Latin diacritics and turn formula
 * subscripts into plain digits.
 */
export function normalizeSearchText(text: string): string {
	return text
		.replace(/[₀-₉]/g, (c) => String(SUBSCRIPTS.indexOf(c)))
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
}

/** Builds the searchable index string: words separated by single spaces, with a leading space. */
export function buildSearchIndex(parts: string[]): string {
	return ' ' + normalizeSearchText(parts.join(' ')).replace(SEPARATOR_RE, ' ').trim() + ' ';
}

export function tokenizeQuery(query: string): string[] {
	return normalizeSearchText(query).split(SEPARATOR_RE).filter(Boolean);
}

/**
 * Every term must match. Latin/alphanumeric terms match from a word start ("gly" → glycine);
 * Chinese/Japanese terms match anywhere, because those scripts do not separate words by spaces.
 */
export function matchesAllTerms(index: string, terms: string[]): boolean {
	return terms.every((term) =>
		CJK_RE.test(term) ? index.includes(term) : index.includes(' ' + term)
	);
}
