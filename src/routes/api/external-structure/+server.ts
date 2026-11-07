import type { RequestHandler } from './$types';

const VALID_ELEMENTS = new Set([
	'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
	'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
	'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
	'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
	'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
	'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
	'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb',
	'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
	'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th',
	'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
	'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds',
	'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og'
]);

interface CodRawEntry {
	file?: string | number;
	formula?: string | null;
	calcformula?: string | null;
	mineral?: string | null;
	commonname?: string | null;
	chemname?: string | null;
	title?: string | null;
	sg?: string | null;
}

export interface CodSearchResultItem {
	id: string;
	name: string;
	formula: string;
	mineral?: string;
	spaceGroup?: string;
}

function jsonResponse(data: unknown, status = 200, cacheSeconds = 300): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': status === 200 ? `public, max-age=${cacheSeconds}` : 'no-store'
		}
	});
}

/**
 * Converts a compact chemical formula (e.g. "CaCO3", "NaCl", "C8H10N4O2", "SiO2")
 * into Crystallography Open Database Hill-system format ("C Ca O3", "Cl Na", "C8 H10 N4 O2", "O2 Si").
 * Returns null if input does not look like a chemical formula.
 */
function parseToCodHillFormula(raw: string): string | null {
	const cleaned = raw.replace(/\s+/g, '');
	// Must start with uppercase letter and contain only letters and digits
	if (!/^[A-Z][A-Za-z0-9]*$/.test(cleaned)) return null;
	// Avoid treating plain English words like "Calcite" or "Cobalt" as formulas:
	// require either digits (e.g. H2O, SiO2, O2) or at least 2 distinct element tokens (e.g. NaCl, BN, FeS)
	const tokenRegex = /([A-Z][a-z]?)(\d*)/g;
	const counts = new Map<string, number>();
	let matchedLength = 0;
	let tokenCount = 0;
	let hasDigits = false;

	let match: RegExpExecArray | null;
	while ((match = tokenRegex.exec(cleaned)) !== null) {
		const el = match[1];
		const countStr = match[2];
		if (!VALID_ELEMENTS.has(el)) return null;
		matchedLength += match[0].length;
		tokenCount++;
		if (countStr.length > 0) hasDigits = true;
		const num = countStr ? parseInt(countStr, 10) : 1;
		if (!Number.isFinite(num) || num <= 0 || num > 9999) return null;
		counts.set(el, (counts.get(el) ?? 0) + num);
	}

	if (matchedLength !== cleaned.length) return null;
	if (!hasDigits && tokenCount < 2) return null;

	const orderedElements: string[] = [];
	if (counts.has('C')) {
		orderedElements.push('C');
		if (counts.has('H')) orderedElements.push('H');
		const rest = Array.from(counts.keys())
			.filter((el) => el !== 'C' && el !== 'H')
			.sort((a, b) => a.localeCompare(b));
		orderedElements.push(...rest);
	} else {
		orderedElements.push(...Array.from(counts.keys()).sort((a, b) => a.localeCompare(b)));
	}

	return orderedElements
		.map((el) => {
			const n = counts.get(el)!;
			return n === 1 ? el : `${el}${n}`;
		})
		.join(' ');
}

function cleanCodFormula(raw?: string | null): string {
	if (!raw) return '';
	return raw.replace(/^\s*-\s*/, '').replace(/\s*-\s*$/, '').trim();
}

/**
 * Reads up to `maxBytes` from a JSON array response stream so broad COD searches
 * never exhaust memory or time out, salvaging complete JSON objects if truncated.
 */
async function fetchBoundedJsonArray<T>(url: string, maxBytes = 1_500_000, timeoutMs = 12_000): Promise<T[]> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const res = await fetch(url, {
			signal: controller.signal,
			headers: { Accept: 'application/json' }
		});
		if (!res.ok) return [];
		if (!res.body) {
			const text = await res.text();
			const parsed = JSON.parse(text);
			return Array.isArray(parsed) ? parsed : [];
		}

		const reader = res.body.getReader();
		const chunks: Uint8Array[] = [];
		let totalBytes = 0;
		let truncated = false;

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			if (value) {
				chunks.push(value);
				totalBytes += value.byteLength;
				if (totalBytes >= maxBytes) {
					truncated = true;
					await reader.cancel().catch(() => {});
					break;
				}
			}
		}

		const merged = new Uint8Array(totalBytes);
		let offset = 0;
		for (const c of chunks) {
			merged.set(c, offset);
			offset += c.byteLength;
		}
		let text = new TextDecoder('utf-8').decode(merged).trim();
		if (!text || !text.startsWith('[')) return [];

		if (truncated) {
			const lastCloseBrace = text.lastIndexOf('}');
			if (lastCloseBrace === -1) return [];
			text = `${text.slice(0, lastCloseBrace + 1)}]`;
		}

		const parsed = JSON.parse(text);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	} finally {
		clearTimeout(timer);
	}
}

function normalizeCodResults(rawEntries: CodRawEntry[], queryLower: string, limit = 15): CodSearchResultItem[] {
	const seenIds = new Set<string>();
	const scored: { score: number; item: CodSearchResultItem }[] = [];

	for (const entry of rawEntries) {
		const id = String(entry.file ?? '').trim();
		if (!/^\d{4,10}$/.test(id) || seenIds.has(id)) continue;
		seenIds.add(id);

		const mineral = entry.mineral?.trim() || undefined;
		const common = entry.commonname?.trim() || '';
		const chem = entry.chemname?.trim() || '';
		const title = entry.title?.trim() || '';
		const formula = cleanCodFormula(entry.formula || entry.calcformula);
		const spaceGroup = entry.sg?.trim() || undefined;

		const primaryName = mineral || common || chem || (title.length > 90 ? `${title.slice(0, 87)}…` : title) || `COD ${id}`;

		let score = 0;
		if (mineral) score += 30;
		if (common) score += 25;
		if (chem) score += 20;
		if (formula) score += 10;

		if (mineral && mineral.toLowerCase() === queryLower) score += 100;
		else if (common && common.toLowerCase() === queryLower) score += 95;
		else if (chem && chem.toLowerCase() === queryLower) score += 90;
		else if (primaryName.toLowerCase().startsWith(queryLower)) score += 40;
		else if (primaryName.toLowerCase().includes(queryLower)) score += 20;

		scored.push({
			score,
			item: {
				id,
				name: primaryName,
				formula,
				mineral,
				spaceGroup
			}
		});
	}

	scored.sort((a, b) => b.score - a.score);
	return scored.slice(0, limit).map((s) => s.item);
}

function extractCifTag(cif: string, tag: string): string {
	const regex = new RegExp(`^${tag}\\s+(?:'([^']+)'|"([^"]+)"|(\\S+))`, 'm');
	const match = cif.match(regex);
	if (!match) return '';
	const val = (match[1] ?? match[2] ?? match[3] ?? '').trim();
	return val === '?' || val === '.' ? '' : val;
}

function isValidSdf(content: string): boolean {
	if (!content) return false;
	return (content.includes('V2000') || content.includes('V3000')) && content.includes('M  END');
}

async function handleCodSearch(rawQuery: string): Promise<Response> {
	const query = rawQuery.trim();
	if (query.length < 2 || query.length > 200) {
		return jsonResponse({ error: 'Query must be between 2 and 200 characters.' }, 400);
	}

	// Direct numeric COD ID entered into search
	if (/^\d{4,10}$/.test(query)) {
		const byIdUrl = `https://www.crystallography.net/cod/result?id=${encodeURIComponent(query)}&format=json`;
		const entries = await fetchBoundedJsonArray<CodRawEntry>(byIdUrl, 200_000, 8_000);
		const results = normalizeCodResults(entries, query.toLowerCase(), 5);
		if (results.length > 0) {
			return jsonResponse({ results }, 200, 600);
		}
		return jsonResponse({
			results: [{ id: query, name: `COD ${query}`, formula: '' }]
		});
	}

	const hillFormula = parseToCodHillFormula(query);
	let rawEntries: CodRawEntry[] = [];

	if (hillFormula) {
		const formulaUrl = `https://www.crystallography.net/cod/result?formula=${encodeURIComponent(hillFormula)}&format=json`;
		rawEntries = await fetchBoundedJsonArray<CodRawEntry>(formulaUrl);
	}

	if (rawEntries.length === 0) {
		const textUrl = `https://www.crystallography.net/cod/result?text=${encodeURIComponent(query)}&format=json`;
		rawEntries = await fetchBoundedJsonArray<CodRawEntry>(textUrl);
	}

	const results = normalizeCodResults(rawEntries, query.toLowerCase(), 15);
	return jsonResponse({ results }, 200, 600);
}

async function handleCodCif(rawId: string): Promise<Response> {
	const codId = rawId.trim();
	if (!/^\d{4,10}$/.test(codId)) {
		return jsonResponse({ error: `Invalid COD ID '${codId}'. Expected 4–10 digits.` }, 400);
	}

	const cifUrl = `https://www.crystallography.net/cod/${codId}.cif`;
	const metaUrl = `https://www.crystallography.net/cod/result?id=${codId}&format=json`;

	const [cifRes, metaEntries] = await Promise.all([
		fetch(cifUrl, { signal: AbortSignal.timeout(12_000) }).catch(() => null),
		fetchBoundedJsonArray<CodRawEntry>(metaUrl, 100_000, 5_000)
	]);

	if (!cifRes || !cifRes.ok) {
		return jsonResponse({ error: `COD entry '${codId}' not found.` }, 404);
	}

	const cif = await cifRes.text();
	if (cif.includes('404 Not Found') || cif.trim().startsWith('data_error') || !cif.includes('_cell_length_a')) {
		return jsonResponse({ error: `COD entry '${codId}' does not contain a valid crystal structure.` }, 404);
	}

	const meta = metaEntries[0];
	const nameFromCif =
		extractCifTag(cif, '_chemical_name_mineral') ||
		extractCifTag(cif, '_chemical_name_common') ||
		extractCifTag(cif, '_chemical_name_systematic');
	const formulaFromCif = extractCifTag(cif, '_chemical_formula_sum');
	const sgFromCif =
		extractCifTag(cif, '_space_group_name_H-M_alt') ||
		extractCifTag(cif, '_symmetry_space_group_name_H-M');

	const name =
		meta?.mineral?.trim() ||
		meta?.commonname?.trim() ||
		meta?.chemname?.trim() ||
		nameFromCif ||
		`COD Entry: ${codId}`;
	const formula = cleanCodFormula(meta?.formula || meta?.calcformula) || formulaFromCif;
	const spaceGroup = meta?.sg?.trim() || sgFromCif || undefined;

	return jsonResponse({ id: codId, cif, name, formula, spaceGroup }, 200, 3600);
}

async function fetchCactusText(identifier: string, representation: string, timeoutMs = 10_000): Promise<string | null> {
	const encoded = encodeURIComponent(identifier);
	const urls = [`https://cactus.nci.nih.gov/chemical/structure/${encoded}/${representation}`];

	// Apache servers in front of CACTUS may reject %2F / %5C in cis/trans SMILES unless double-encoded
	if (identifier.includes('/') || identifier.includes('\\')) {
		const doubleEncoded = encoded.replace(/%2F/gi, '%252F').replace(/%5C/gi, '%255C');
		urls.push(`https://cactus.nci.nih.gov/chemical/structure/${doubleEncoded}/${representation}`);
	}

	for (const url of urls) {
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
			if (res.ok) {
				const text = await res.text();
				if (text && !text.includes('Page not found (404)') && !text.includes('<h1>Server Error')) {
					return text;
				}
			}
		} catch {
			// Try next URL candidate
		}
	}
	return null;
}

async function fetchPubChemFallback3DSdf(identifier: string): Promise<string | null> {
	try {
		const body = new URLSearchParams({ smiles: identifier }).toString();
		const res = await fetch(
			'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/SDF?record_type=3d',
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body,
				signal: AbortSignal.timeout(10_000)
			}
		);
		if (res.ok) {
			const text = await res.text();
			if (isValidSdf(text)) return text;
		}
	} catch {
		// Ignore fallback error
	}
	return null;
}

async function handleCactus3D(rawQuery: string): Promise<Response> {
	const query = rawQuery.trim();
	if (!query || query.length > 1000) {
		return jsonResponse({ error: 'Invalid SMILES / identifier length.' }, 400);
	}

	const [cactusSdf, iupacRaw] = await Promise.all([
		fetchCactusText(query, 'sdf?get3d=true', 12_000),
		fetchCactusText(query, 'iupac_name', 3_500)
	]);

	let sdf = cactusSdf && isValidSdf(cactusSdf) ? cactusSdf : null;
	if (!sdf) {
		sdf = await fetchPubChemFallback3DSdf(query);
	}

	if (!sdf) {
		return jsonResponse(
			{ error: `Could not generate 3D coordinates for '${query}'. Verify the SMILES, InChI, or IUPAC name.` },
			404
		);
	}

	const iupacName = iupacRaw ? iupacRaw.split('\n')[0].trim() : undefined;
	return jsonResponse({ sdf, iupacName }, 200, 3600);
}

async function handleCactusImage(rawQuery: string): Promise<Response> {
	const query = rawQuery.trim();
	if (!query || query.length > 1000) {
		return new Response('Invalid query', { status: 400 });
	}

	const encoded = encodeURIComponent(query);
	const urls = [
		`https://cactus.nci.nih.gov/chemical/structure/${encoded}/image?width=240&height=240`
	];
	if (query.includes('/') || query.includes('\\')) {
		const doubleEncoded = encoded.replace(/%2F/gi, '%252F').replace(/%5C/gi, '%255C');
		urls.push(`https://cactus.nci.nih.gov/chemical/structure/${doubleEncoded}/image?width=240&height=240`);
	}

	for (const imgUrl of urls) {
		try {
			const res = await fetch(imgUrl, { signal: AbortSignal.timeout(8_000) });
			if (res.ok) {
				const contentType = res.headers.get('content-type') || 'image/gif';
				if (contentType.startsWith('image/')) {
					const buf = await res.arrayBuffer();
					return new Response(buf, {
						status: 200,
						headers: {
							'Content-Type': contentType,
							'Cache-Control': 'public, max-age=86400'
						}
					});
				}
			}
		} catch {
			// Try fallback
		}
	}

	// Fallback: PubChem 2D PNG by SMILES
	try {
		const body = new URLSearchParams({ smiles: query }).toString();
		const res = await fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/PNG', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body,
			signal: AbortSignal.timeout(8_000)
		});
		if (res.ok) {
			const buf = await res.arrayBuffer();
			return new Response(buf, {
				status: 200,
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'public, max-age=86400'
				}
			});
		}
	} catch {
		// Ignore
	}

	return new Response('Image not available', { status: 404 });
}

export const GET: RequestHandler = async ({ url }) => {
	const provider = (url.searchParams.get('provider') || '').trim().toLowerCase();

	switch (provider) {
		case 'cod-search':
			return handleCodSearch(url.searchParams.get('query') || '');
		case 'cod-cif':
			return handleCodCif(url.searchParams.get('id') || '');
		case 'cactus':
			return handleCactus3D(url.searchParams.get('query') || '');
		case 'cactus-image':
			return handleCactusImage(url.searchParams.get('query') || '');
		default:
			return jsonResponse({ error: `Unsupported provider '${provider}'.` }, 400);
	}
};
