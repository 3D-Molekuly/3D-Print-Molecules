// Pure helpers that classify free-text search input (molecular formulas, SMILES, conformer IDs).
// Kept free of browser APIs so they can be unit-tested in Node.

const ELEMENT_SYMBOLS = new Set([
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar',
  'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
  'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe',
  'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
  'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn',
  'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr',
  'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og', 'D'
]);

const SUBSCRIPT_DIGITS: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9'
};

type FormulaToken = { symbol: string; count: string } | { group: FormulaToken[]; count: string };

/**
 * Parses a formula like "Ca(OH)2" case-sensitively. Returns null when the string is not a
 * sequence of valid element symbols, counts and parenthesised groups.
 */
function parseFormulaStrict(input: string): FormulaToken[] | null {
  let pos = 0;
  const parseSeq = (closing: string | null): FormulaToken[] | null => {
    const tokens: FormulaToken[] = [];
    while (pos < input.length) {
      const ch = input[pos];
      if (closing && ch === closing) return tokens;
      if (ch === '(' || ch === '[') {
        pos++;
        const inner = parseSeq(ch === '(' ? ')' : ']');
        if (!inner || inner.length === 0 || input[pos] !== (ch === '(' ? ')' : ']')) return null;
        pos++;
        const count = readCount();
        tokens.push({ group: inner, count });
        continue;
      }
      if (!/[A-Z]/.test(ch)) return null;
      const two = input.slice(pos, pos + 2);
      let symbol = '';
      if (two.length === 2 && /[a-z]/.test(two[1]) && ELEMENT_SYMBOLS.has(two)) {
        symbol = two;
      } else if (ELEMENT_SYMBOLS.has(ch)) {
        symbol = ch;
      } else {
        return null;
      }
      pos += symbol.length;
      tokens.push({ symbol, count: readCount() });
    }
    return closing ? null : tokens;
  };
  const readCount = (): string => {
    const m = /^\d+/.exec(input.slice(pos));
    if (!m) return '';
    pos += m[0].length;
    return m[0];
  };
  const result = parseSeq(null);
  return result && pos === input.length ? result : null;
}

function countElementTokens(tokens: FormulaToken[]): number {
  return tokens.reduce((n, t) => n + ('symbol' in t ? 1 : countElementTokens(t.group)), 0);
}

/**
 * Re-capitalises an all-lowercase formula ("h2so4" -> "H2SO4"). Several readings may be valid
 * ("co2" = CO2 or Co2); the one with the most element tokens wins, which favours common
 * light-element compounds.
 */
function recapitaliseLowercaseFormula(input: string): string | null {
  let best: { text: string; tokens: number } | null = null;
  const walk = (pos: number, acc: string, tokens: number) => {
    if (best && best.tokens >= tokens + (input.length - pos)) return; // cannot beat the best
    if (pos === input.length) {
      if (!best || tokens > best.tokens) best = { text: acc, tokens };
      return;
    }
    const ch = input[pos];
    if (/\d/.test(ch)) {
      if (pos === 0 || input[pos - 1] === '(') return;
      walk(pos + 1, acc + ch, tokens);
      return;
    }
    if (ch === '(' || ch === ')') {
      walk(pos + 1, acc + ch, tokens);
      return;
    }
    if (!/[a-z]/.test(ch)) return;
    const one = ch.toUpperCase();
    if (ELEMENT_SYMBOLS.has(one)) walk(pos + 1, acc + one, tokens + 1);
    if (pos + 1 < input.length && /[a-z]/.test(input[pos + 1])) {
      const two = one + input[pos + 1];
      if (ELEMENT_SYMBOLS.has(two)) walk(pos + 2, acc + two, tokens + 1);
    }
  };
  walk(0, '', 0);
  const found = best as { text: string; tokens: number } | null;
  return found && parseFormulaStrict(found.text) ? found.text : null;
}

export interface FormulaQuery {
  /** Formula in PubChem's notation, e.g. "H2SO4". */
  formula: string;
  /**
   * True when the input can only sensibly be a formula (it contains a count, e.g. "CO2", "h2o").
   * Digit-free inputs such as "NaCl" or "HCl" are tried as names first.
   */
  confident: boolean;
}

/**
 * Recognises loosely typed molecular formulas: "H2O", "h2so4", "H₂O", "Ca(OH)2", "C6H12O6".
 * Returns null for anything that is not a formula (names, CAS numbers, CIDs, SMILES...).
 */
export function detectFormulaQuery(rawInput: string): FormulaQuery | null {
  let input = rawInput.trim().replace(/^formula:\s*/i, '');
  const explicit = input !== rawInput.trim();
  input = input.replace(/[₀-₉]/g, (d) => SUBSCRIPT_DIGITS[d] ?? d).replace(/\s+/g, '');
  if (!input || input.length > 40 || /^\d/.test(input) || !/[A-Za-z]/.test(input)) return null;
  if (!/^[A-Za-z0-9()[\]]+$/.test(input)) return null;
  if (!explicit && looksLikeSmiles(input)) return null; // e.g. "C1CCCCC1"

  const hasDigit = /\d/.test(input);
  const strict = parseFormulaStrict(input);
  if (strict) {
    const elementTokens = countElementTokens(strict);
    // A lone element symbol ("Fe", "He") is better served by the name search
    if (!hasDigit && elementTokens < 2 && !explicit) return null;
    return { formula: input.replace(/\[/g, '(').replace(/]/g, ')'), confident: hasDigit || explicit };
  }

  // Lower-case typing ("h2o", "nacl") only counts with a digit, so words like "coin" stay names
  if (input === input.toLowerCase() && (hasDigit || explicit)) {
    const recapitalised = recapitaliseLowercaseFormula(input.replace(/\[/g, '(').replace(/]/g, ')'));
    if (recapitalised) return { formula: recapitalised, confident: true };
  }
  return null;
}

const SMILES_ORGANIC = new Set(['B', 'C', 'N', 'O', 'P', 'S', 'F', 'I', 'Cl', 'Br', 'b', 'c', 'n', 'o', 'p', 's']);

/**
 * Strict SMILES check for free-text input. Only strings that contain SMILES-specific syntax
 * (bonds `=#`, branches, brackets, stereo, or paired ring closures) qualify, so names like
 * "(R)-limonene" and formulas like "CO2" / "C60" are not mistaken for SMILES.
 */
export function looksLikeSmiles(rawInput: string): boolean {
  const input = rawInput.trim();
  if (!input || /\s/.test(input) || input.length > 500) return false;
  if (!/^[A-Za-z0-9@+\-[\]()=#$:/\\.%*]+$/.test(input)) return false;

  let i = 0;
  let depth = 0;
  let atoms = 0;
  let hasSyntax = false;
  const openRings = new Set<string>();

  while (i < input.length) {
    const ch = input[i];
    if (ch === '[') {
      const end = input.indexOf(']', i);
      if (end < 0) return false;
      const inner = input.slice(i + 1, end);
      if (!/^\d*[A-Za-z*][a-z]?[@A-Za-z0-9+\-:]*$/.test(inner)) return false;
      atoms++;
      hasSyntax = true;
      i = end + 1;
      continue;
    }
    if (ch === '(' || ch === ')') {
      depth += ch === '(' ? 1 : -1;
      if (depth < 0) return false;
      hasSyntax = true;
      i++;
      continue;
    }
    if ('=#$/\\@'.includes(ch)) {
      hasSyntax = true;
      i++;
      continue;
    }
    if ('-.:'.includes(ch)) {
      i++;
      continue;
    }
    if (ch === '%') {
      const ring = input.slice(i, i + 3);
      if (!/^%\d\d$/.test(ring) || atoms === 0) return false;
      if (openRings.has(ring)) openRings.delete(ring);
      else openRings.add(ring);
      i += 3;
      continue;
    }
    if (/\d/.test(ch)) {
      if (atoms === 0) return false;
      if (openRings.has(ch)) {
        openRings.delete(ch);
        hasSyntax = true; // a closed ring is unmistakably SMILES (e.g. C1CCCCC1)
      } else {
        openRings.add(ch);
      }
      i++;
      continue;
    }
    if (ch === '*') {
      atoms++;
      i++;
      continue;
    }
    const two = input.slice(i, i + 2);
    if (two === 'Cl' || two === 'Br') {
      atoms++;
      i += 2;
      continue;
    }
    if (SMILES_ORGANIC.has(ch)) {
      atoms++;
      i++;
      continue;
    }
    return false;
  }
  return depth === 0 && openRings.size === 0 && atoms > 0 && hasSyntax;
}

/** Plain carbon-chain SMILES without special syntax ("CCO", "CCCC"), valid but ambiguous. */
export function looksLikeSimpleSmiles(rawInput: string): boolean {
  const input = rawInput.trim();
  return /^(?:Cl|Br|[BCNOPSFI])+$/.test(input) && /C.*C|C.*[NOS]|[NOS].*C/.test(input) && input.length >= 3;
}

const CONFORMER_ID = /^[0-9A-F]{16}$/i;

/** Parses "conformer:000008C400000003" (the share/history form of a PubChem conformer). */
export function parseConformerQuery(rawInput: string): string | null {
  const m = /^conformer:\s*([0-9A-Fa-f]{16})$/.exec(rawInput.trim());
  return m && CONFORMER_ID.test(m[1]) ? m[1].toUpperCase() : null;
}

export function formatConformerQuery(conformerId: string): string {
  return `conformer:${conformerId.toUpperCase()}`;
}
