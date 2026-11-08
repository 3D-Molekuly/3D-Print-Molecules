// Minimal ChemDraw CDXML reader: turns the structures of a CDXML document into an MDL V2000
// molfile (2D, implicit hydrogens). The OpenBabel WASM build bundled with Kekule reads binary
// .cdx but not .cdxml (it is compiled without libxml2), so CDXML is handled here.

const SYMBOLS_BY_Z = [
  '', 'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne', 'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar',
  'K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr',
  'Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe',
  'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd', 'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb', 'Lu',
  'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn',
  'Fr', 'Ra', 'Ac', 'Th', 'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm', 'Md', 'No', 'Lr',
  'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og'
];

/** ChemDraw's default bond length is 14.4 pt; molfiles conventionally use ~1.5 units. */
const POINTS_TO_ANGSTROM = 1.5 / 14.4;

interface CdxAtom {
  id: string;
  symbol: string;
  x: number;
  y: number;
  charge: number;
}

interface CdxBond {
  begin: string;
  end: string;
  order: number;
  /** MDL bond stereo: 1 = wedge, 6 = hashed wedge, 4 = either (wavy), seen from `begin`. */
  stereo: number;
}

/** Maps ChemDraw's bond Display to MDL stereo; "...End" variants point the other way. */
function bondStereo(display: string | null): { stereo: number; reversed: boolean } {
  switch (display) {
    case 'WedgeBegin':
    case 'HollowWedgeBegin':
      return { stereo: 1, reversed: false };
    case 'WedgeEnd':
    case 'HollowWedgeEnd':
      return { stereo: 1, reversed: true };
    case 'WedgedHashBegin':
      return { stereo: 6, reversed: false };
    case 'WedgedHashEnd':
      return { stereo: 6, reversed: true };
    case 'Wavy':
    case 'WavyWedgeBegin':
      return { stereo: 4, reversed: false };
    case 'WavyWedgeEnd':
      return { stereo: 4, reversed: true };
    default:
      return { stereo: 0, reversed: false };
  }
}

function bondOrder(raw: string | null): number | null {
  const order = (raw ?? '1').trim().toLowerCase();
  if (order === '1' || order === 'dative' || order === 'ionic') return 1;
  if (order === '2') return 2;
  if (order === '3') return 3;
  if (order === '1.5') return 4; // aromatic
  if (order === '2.5' || order === '3.5') return 2;
  return null; // hydrogen / half bonds are not covalent bonds
}

function childElements(el: Element, tag: string): Element[] {
  return Array.from(el.children).filter((c) => c.tagName === tag);
}

/**
 * Collects atoms and bonds of a <fragment>. Abbreviations (nicknames such as "Ph", "OMe",
 * "Boc") carry their expansion as a nested fragment whose ExternalConnectionPoint marks where
 * the outer bond attaches; they are inlined so the structure is complete.
 */
function collectFragment(fragment: Element, atoms: CdxAtom[], bonds: CdxBond[], redirect: Map<string, string>) {
  for (const node of childElements(fragment, 'n')) {
    const id = node.getAttribute('id') ?? '';
    const nodeType = node.getAttribute('NodeType') ?? 'Element';
    const nested = childElements(node, 'fragment')[0];

    if (nested && /^(Fragment|Nickname|Unspecified|GenericNickname)$/.test(nodeType)) {
      const innerAtoms: CdxAtom[] = [];
      const innerBonds: CdxBond[] = [];
      collectFragment(nested, innerAtoms, innerBonds, redirect);
      const connectionIds = new Set(
        childElements(nested, 'n')
          .filter((n) => n.getAttribute('NodeType') === 'ExternalConnectionPoint')
          .map((n) => n.getAttribute('id') ?? '')
      );
      // The inner atom bonded to the connection point takes the place of this node
      for (const b of innerBonds) {
        if (connectionIds.has(b.begin)) redirect.set(id, b.end);
        else if (connectionIds.has(b.end)) redirect.set(id, b.begin);
      }
      if (!redirect.has(id) && innerAtoms.length > 0) redirect.set(id, innerAtoms[0].id);
      atoms.push(...innerAtoms);
      bonds.push(...innerBonds.filter((b) => !connectionIds.has(b.begin) && !connectionIds.has(b.end)));
      continue;
    }

    if (nodeType === 'ExternalConnectionPoint') {
      atoms.push({ id, symbol: '*', x: 0, y: 0, charge: 0 });
      continue;
    }
    if (nodeType !== 'Element') continue; // text labels, unknown generic groups

    const z = Number(node.getAttribute('Element') ?? '6');
    const symbol = SYMBOLS_BY_Z[z];
    if (!symbol) continue;
    const [px, py] = (node.getAttribute('p') ?? '0 0').split(/\s+/).map(Number);
    atoms.push({
      id,
      symbol,
      x: (px || 0) * POINTS_TO_ANGSTROM,
      y: -(py || 0) * POINTS_TO_ANGSTROM, // CDXML y grows downwards
      charge: Math.round(Number(node.getAttribute('Charge') ?? '0')) || 0
    });
  }

  for (const b of childElements(fragment, 'b')) {
    const order = bondOrder(b.getAttribute('Order'));
    const begin = b.getAttribute('B');
    const end = b.getAttribute('E');
    if (order === null || !begin || !end) continue;
    const { stereo, reversed } = bondStereo(b.getAttribute('Display'));
    bonds.push(reversed ? { begin: end, end: begin, order, stereo } : { begin, end, order, stereo });
  }
}

function pad(value: string | number, width: number): string {
  return String(value).padStart(width, ' ');
}

/**
 * Converts a CDXML document to an MDL V2000 molfile (header marked "2D"). All structures on
 * the page end up in one molfile as disconnected fragments. Throws when no atoms are found.
 */
export function cdxmlToMolfile(cdxml: string, parser: { parseFromString(s: string, type: string): Document } = new DOMParser()): string {
  // The DOCTYPE points to a remote DTD; drop it so no parser tries to resolve it
  const doc = parser.parseFromString(cdxml.replace(/<!DOCTYPE[^>]*>/i, ''), 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('The CDXML document is not valid XML.');
  }

  const atoms: CdxAtom[] = [];
  const bonds: CdxBond[] = [];
  const redirect = new Map<string, string>();
  // Top-level fragments only (nested ones belong to nicknames and are inlined)
  const fragments = Array.from(doc.getElementsByTagName('fragment')).filter(
    (f) => !f.parentElement || f.parentElement.tagName !== 'n'
  );
  for (const fragment of fragments) collectFragment(fragment, atoms, bonds, redirect);

  const realAtoms = atoms.filter((a) => a.symbol !== '*');
  if (realAtoms.length === 0) throw new Error('No structure was found in the ChemDraw document.');

  const indexById = new Map<string, number>();
  realAtoms.forEach((a, i) => indexById.set(a.id, i + 1));
  const resolve = (id: string): number | undefined => {
    let current = id;
    for (let guard = 0; guard < 10 && redirect.has(current); guard++) current = redirect.get(current)!;
    return indexById.get(current);
  };

  const seen = new Set<string>();
  const bondLines: string[] = [];
  for (const b of bonds) {
    const i = resolve(b.begin);
    const j = resolve(b.end);
    if (!i || !j || i === j) continue;
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (seen.has(key)) continue;
    seen.add(key);
    bondLines.push(`${pad(i, 3)}${pad(j, 3)}${pad(b.order, 3)}${pad(b.order === 1 ? b.stereo : 0, 3)}  0  0  0`);
  }

  const lines = [
    'ChemDraw structure',
    `  ${'CDXML'.padEnd(8, ' ')}${'0'.repeat(10)}2D`,
    '',
    `${pad(realAtoms.length, 3)}${pad(bondLines.length, 3)}  0  0  0  0  0  0  0  0999 V2000`,
    ...realAtoms.map(
      (a) =>
        `${pad(a.x.toFixed(4), 10)}${pad(a.y.toFixed(4), 10)}${pad('0.0000', 10)} ${a.symbol.padEnd(3, ' ')} 0  0  0  0  0  0  0  0  0  0  0  0`
    ),
    ...bondLines
  ];
  const charged = realAtoms.map((a, i) => ({ i: i + 1, c: a.charge })).filter((a) => a.c !== 0);
  for (let k = 0; k < charged.length; k += 8) {
    const chunk = charged.slice(k, k + 8);
    lines.push(`M  CHG${pad(chunk.length, 3)}${chunk.map((a) => `${pad(a.i, 4)}${pad(a.c, 4)}`).join('')}`);
  }
  lines.push('M  END');
  return lines.join('\n');
}
