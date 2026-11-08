export interface AtomCoordinate {
  atomType: string;
  x: number;
  y: number;
  z: number;
  AtomicRadius?: string; // Optional property for atomic radius
  CPKHexColor?: string;  // Optional property for CPK color
  id?: number;           // Optional property for atom index/id
  bonds?: { atomId: number; bondType: number }[];      // Optional property for bonds
}

export interface ParsePDBOptions {
  /** Optional chain identifier filter (e.g. 'A'). */
  chainId?: string;
  /** Whether to include crystallographic water molecules (HOH, WAT, DOD). Defaults to false. */
  includeWaters?: boolean;
}

// Fallback patterns for non-standard whitespace-delimited PDB lines
const pattern1 = /^(?:ATOM|HETATM)\s+(\d+)\s+([A-Za-z0-9]+(?:-[A-Za-z0-9]+)?)\s+([A-Za-z0-9]+)\s*([A-Za-z]?)\s*(\d*)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s*([A-Za-z]*)\s*$/;
const pattern2 = /^(?:ATOM|HETATM)\s+(\d+)\s+(\S+)\s+(\w+)\s+(\w+)\s+(\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+(\S+)/;
const pattern4 = /^(?:ATOM|HETATM)\s+\d+\s+\w+\s+\w+\s+\w+\s+\d+\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+\d+\.\d+\s+\d+\.\d+\s+([A-Za-z]{1,2}).*$/;

const WATER_RESIDUES = new Set(['HOH', 'WAT', 'DOD', 'H2O']);
const STANDARD_POLYMER_RESIDUES = new Set([
  'ALA', 'ARG', 'ASN', 'ASP', 'CYS', 'GLN', 'GLU', 'GLY', 'HIS', 'ILE',
  'LEU', 'LYS', 'MET', 'PHE', 'PRO', 'SER', 'THR', 'TRP', 'TYR', 'VAL',
  'SEC', 'PYL', 'MSE',
  'A', 'C', 'G', 'U', 'DA', 'DC', 'DG', 'DT', 'DI', 'I'
]);

/** Approximate covalent radii in Å for covalent bond inference in PDB structures. */
const COVALENT_RADII_ANGSTROM: Record<string, number> = {
  H: 0.31, He: 0.28, Li: 1.28, Be: 0.96, B: 0.84, C: 0.76, N: 0.71, O: 0.66, F: 0.57, Ne: 0.58,
  Na: 1.66, Mg: 1.41, Al: 1.21, Si: 1.11, P: 1.07, S: 1.05, Cl: 1.02, Ar: 1.06,
  K: 2.03, Ca: 1.76, Sc: 1.70, Ti: 1.60, V: 1.53, Cr: 1.39, Mn: 1.39, Fe: 1.32, Co: 1.26,
  Ni: 1.24, Cu: 1.32, Zn: 1.22, Ga: 1.22, Ge: 1.20, As: 1.19, Se: 1.20, Br: 1.20, Kr: 1.16,
  Ag: 1.45, Cd: 1.44, In: 1.42, Sn: 1.39, Sb: 1.39, Te: 1.38, I: 1.39, Xe: 1.40,
  Ba: 2.15, Pt: 1.36, Au: 1.36, Hg: 1.32, Pb: 1.46, Bi: 1.48, U: 1.96
};

/** Fallback element metadata (used offline or in Node test environments). */
const FALLBACK_ELEMENTS: Record<string, { AtomicRadius: string; CPKHexColor: string }> = {
  H: { AtomicRadius: '120', CPKHexColor: 'FFFFFF' },
  He: { AtomicRadius: '140', CPKHexColor: 'D9FFFF' },
  Li: { AtomicRadius: '182', CPKHexColor: 'CC80FF' },
  Be: { AtomicRadius: '153', CPKHexColor: 'C2FF00' },
  B: { AtomicRadius: '192', CPKHexColor: 'FFB5B5' },
  C: { AtomicRadius: '170', CPKHexColor: '909090' },
  N: { AtomicRadius: '155', CPKHexColor: '3050F8' },
  O: { AtomicRadius: '152', CPKHexColor: 'FF0D0D' },
  F: { AtomicRadius: '147', CPKHexColor: '90E050' },
  Na: { AtomicRadius: '227', CPKHexColor: 'AB5CF2' },
  Mg: { AtomicRadius: '173', CPKHexColor: '8AFF00' },
  Al: { AtomicRadius: '184', CPKHexColor: 'BFA6A6' },
  Si: { AtomicRadius: '210', CPKHexColor: 'F0C8A0' },
  P: { AtomicRadius: '180', CPKHexColor: 'FF8000' },
  S: { AtomicRadius: '180', CPKHexColor: 'FFFF30' },
  Cl: { AtomicRadius: '175', CPKHexColor: '1FF01F' },
  K: { AtomicRadius: '275', CPKHexColor: '8F40D4' },
  Ca: { AtomicRadius: '231', CPKHexColor: '3DFF00' },
  Ti: { AtomicRadius: '187', CPKHexColor: 'BFC2C7' },
  Mn: { AtomicRadius: '197', CPKHexColor: '9C7AC7' },
  Fe: { AtomicRadius: '194', CPKHexColor: 'E06633' },
  Co: { AtomicRadius: '192', CPKHexColor: 'F090A0' },
  Ni: { AtomicRadius: '163', CPKHexColor: '50D050' },
  Cu: { AtomicRadius: '140', CPKHexColor: 'C88033' },
  Zn: { AtomicRadius: '139', CPKHexColor: '7D80B0' },
  Se: { AtomicRadius: '190', CPKHexColor: 'FFA100' },
  Br: { AtomicRadius: '185', CPKHexColor: 'A62929' },
  Ag: { AtomicRadius: '172', CPKHexColor: 'C0C0C0' },
  I: { AtomicRadius: '198', CPKHexColor: '940094' },
  Pt: { AtomicRadius: '175', CPKHexColor: 'D0D0E0' },
  Au: { AtomicRadius: '166', CPKHexColor: 'FFD123' }
};

function normalizeElementSymbol(raw: string): string {
  const letters = raw.replace(/[^A-Za-z]/g, '');
  if (!letters) return '';
  if (letters.length === 1) return letters.toUpperCase();
  return letters[0].toUpperCase() + letters[1].toLowerCase();
}

function inferElementFromPdbAtomName(atomNameField: string, resName: string): string {
  const trimmed = atomNameField.trim();
  if (!trimmed) return '';
  // Deuterium in neutron/NMR structures
  if (trimmed === 'D') return 'H';

  // In standard polymer residues (amino acids / nucleic acids), 'CA', 'CB', 'CD', 'CE', 'CG', etc.
  // are carbon, nitrogen, oxygen, sulfur, phosphorus, or hydrogen atoms (plus Se in MSE)
  if (STANDARD_POLYMER_RESIDUES.has(resName)) {
    if (resName === 'MSE' && trimmed.toUpperCase().startsWith('SE')) return 'Se';
    const strippedDigits = trimmed.replace(/^[0-9]+/, '');
    return strippedDigits ? strippedDigits[0].toUpperCase() : '';
  }

  // In HETATM residues, column 13 (atomNameField[0]) is blank for 1-letter elements (" C1 ", " O  ")
  // and non-blank (letter) for 2-letter elements ("FE  ", "CL  ", "MG  ", "ZN  ", "CA  ")
  if (atomNameField.length >= 2 && /[A-Za-z]/.test(atomNameField[0]) && /[A-Za-z]/.test(atomNameField[1])) {
    return normalizeElementSymbol(atomNameField.slice(0, 2));
  }

  const stripped = trimmed.replace(/^[0-9]+/, '');
  if (stripped.length >= 2 && resName.toUpperCase() === stripped.slice(0, 2).toUpperCase()) {
    return normalizeElementSymbol(stripped.slice(0, 2));
  }
  return stripped ? stripped[0].toUpperCase() : '';
}

interface RawParsedPdbAtom {
  serial: number;
  atomType: string;
  x: number;
  y: number;
  z: number;
  resName: string;
  chainId: string;
  isWater: boolean;
}

function parsePdbAtomRecord(line: string): RawParsedPdbAtom | null {
  const recordType = line.slice(0, 6).trim();
  if (recordType !== 'ATOM' && recordType !== 'HETATM') return null;

  // Fixed-column wwPDB format (coordinates in columns 31..54)
  if (line.length >= 54) {
    const altLoc = line[16] || ' ';
    if (altLoc !== ' ' && altLoc !== 'A' && altLoc !== '1') {
      return null;
    }

    const serial = parseInt(line.slice(6, 11).trim(), 10);
    const atomNameField = line.slice(12, 16);
    const resName = line.slice(17, 20).trim().toUpperCase();
    const chainId = (line[21] || '').trim();
    const x = parseFloat(line.slice(30, 38).trim());
    const y = parseFloat(line.slice(38, 46).trim());
    const z = parseFloat(line.slice(46, 54).trim());

    if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
      const colElement = line.length >= 77 ? normalizeElementSymbol(line.slice(76, 78).trim()) : '';
      const atomType = colElement || inferElementFromPdbAtomName(atomNameField, resName);
      if (atomType) {
        return {
          serial: isNaN(serial) ? 0 : serial,
          atomType,
          x,
          y,
          z,
          resName,
          chainId,
          isWater: WATER_RESIDUES.has(resName)
        };
      }
    }
  }

  // Fallback regexes for non-standard whitespace-formatted PDB lines
  const fallbackMatch =
    line.match(pattern1) ||
    line.match(pattern2) ||
    line.match(pattern4);

  if (fallbackMatch) {
    let rawEl = '';
    let x = NaN;
    let y = NaN;
    let z = NaN;
    if (fallbackMatch.length >= 12) {
      rawEl = fallbackMatch[11] || fallbackMatch[2];
      x = parseFloat(fallbackMatch[6]);
      y = parseFloat(fallbackMatch[7]);
      z = parseFloat(fallbackMatch[8]);
    } else {
      rawEl = fallbackMatch[4];
      x = parseFloat(fallbackMatch[1]);
      y = parseFloat(fallbackMatch[2]);
      z = parseFloat(fallbackMatch[3]);
    }
    const atomType = normalizeElementSymbol(rawEl);
    if (!isNaN(x) && !isNaN(y) && !isNaN(z) && atomType) {
      return {
        serial: 0,
        atomType,
        x,
        y,
        z,
        resName: '',
        chainId: '',
        isWater: false
      };
    }
  }

  return null;
}

function addUndirectedBond(atoms: AtomCoordinate[], idxA: number, idxB: number, bondType = 1): void {
  if (idxA === idxB || idxA < 0 || idxB < 0 || idxA >= atoms.length || idxB >= atoms.length) return;
  const atomA = atoms[idxA];
  const atomB = atoms[idxB];
  const idA = atomA.id!;
  const idB = atomB.id!;

  const existingAB = atomA.bonds!.find((b) => b.atomId === idB);
  if (existingAB) {
    if (bondType > existingAB.bondType) {
      existingAB.bondType = bondType;
      const existingBA = atomB.bonds!.find((b) => b.atomId === idA);
      if (existingBA) existingBA.bondType = bondType;
    }
    return;
  }

  atomA.bonds!.push({ atomId: idB, bondType });
  atomB.bonds!.push({ atomId: idA, bondType });
}

/**
 * Infers covalent bonds in O(N) using a 3D spatial hash grid (cell size 3.0 Å)
 * for atoms not already connected by explicit CONECT records.
 */
function inferPdbCovalentBonds(atoms: AtomCoordinate[], chainIds: string[]): void {
  const n = atoms.length;
  if (n < 2) return;

  const cellSize = 3.0;
  const bondTolerance = 0.42;
  const minBondDistSq = 0.4 * 0.4;
  const grid = new Map<string, number[]>();

  const cellKey = (cx: number, cy: number, cz: number) => `${cx},${cy},${cz}`;

  for (let i = 0; i < n; i++) {
    const a = atoms[i];
    const cx = Math.floor(a.x / cellSize);
    const cy = Math.floor(a.y / cellSize);
    const cz = Math.floor(a.z / cellSize);
    const key = cellKey(cx, cy, cz);
    let bucket = grid.get(key);
    if (!bucket) {
      bucket = [];
      grid.set(key, bucket);
    }
    bucket.push(i);
  }

  for (let i = 0; i < n; i++) {
    const a = atoms[i];
    const rA = COVALENT_RADII_ANGSTROM[a.atomType] ?? 0.77;
    const cx = Math.floor(a.x / cellSize);
    const cy = Math.floor(a.y / cellSize);
    const cz = Math.floor(a.z / cellSize);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = grid.get(cellKey(cx + dx, cy + dy, cz + dz));
          if (!bucket) continue;
          for (const j of bucket) {
            if (j <= i) continue;
            // Avoid spurious inter-chain bonds unless chain ID is empty
            if (chainIds[i] && chainIds[j] && chainIds[i] !== chainIds[j]) continue;

            const b = atoms[j];
            // H-H doesn't covalently bond inside biological macromolecules
            if (a.atomType === 'H' && b.atomType === 'H') continue;

            const rB = COVALENT_RADII_ANGSTROM[b.atomType] ?? 0.77;
            const maxDist = rA + rB + bondTolerance;
            const ddx = b.x - a.x;
            const ddy = b.y - a.y;
            const ddz = b.z - a.z;
            const distSq = ddx * ddx + ddy * ddy + ddz * ddz;

            if (distSq >= minBondDistSq && distSq <= maxDist * maxDist) {
              addUndirectedBond(atoms, i, j, 1);
            }
          }
        }
      }
    }
  }
}

export async function parsePDB(
  data: string | string[],
  options: ParsePDBOptions = {}
): Promise<AtomCoordinate[]> {
  const lines = typeof data === 'string' ? data.split(/\r?\n/) : data;
  const targetChain = options.chainId?.trim().toUpperCase() || '';
  const includeWaters = options.includeWaters ?? false;

  const rawAtomsAll: RawParsedPdbAtom[] = [];
  const conectPairs = new Map<string, { serialA: number; serialB: number; count: number }>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Stop after first model in multi-model NMR ensembles once atoms were read
    if (trimmed.startsWith('ENDMDL') && rawAtomsAll.length > 0) {
      break;
    }

    if (line.startsWith('CONECT')) {
      const serials: number[] = [];
      // Fixed 5-char serial fields starting at col 7 (index 6)
      for (let pos = 6; pos + 5 <= line.length; pos += 5) {
        const s = parseInt(line.slice(pos, pos + 5).trim(), 10);
        if (!isNaN(s) && s > 0) serials.push(s);
      }
      if (serials.length < 2) {
        const parts = trimmed.split(/\s+/).slice(1).map((p) => parseInt(p, 10)).filter((n) => !isNaN(n) && n > 0);
        serials.push(...parts);
      }
      if (serials.length >= 2) {
        const src = serials[0];
        for (let k = 1; k < serials.length; k++) {
          const dst = serials[k];
          if (src === dst) continue;
          const minS = Math.min(src, dst);
          const maxS = Math.max(src, dst);
          const key = `${minS}:${maxS}`;
          const existing = conectPairs.get(key);
          if (existing) {
            // Only increment bond order when seen from the same direction
            if (src < dst) existing.count = Math.min(3, existing.count + 1);
          } else {
            conectPairs.set(key, { serialA: minS, serialB: maxS, count: 1 });
          }
        }
      }
      continue;
    }

    const parsed = parsePdbAtomRecord(line);
    if (parsed) {
      if (targetChain && parsed.chainId.toUpperCase() !== targetChain) {
        continue;
      }
      rawAtomsAll.push(parsed);
    }
  }

  let selectedRawAtoms = includeWaters
    ? rawAtomsAll
    : rawAtomsAll.filter((a) => !a.isWater);

  // If the entire PDB consists exclusively of water molecules, keep them
  if (selectedRawAtoms.length === 0 && rawAtomsAll.length > 0) {
    selectedRawAtoms = rawAtomsAll;
  }

  // Preload element metadata once for all unique symbols
  const uniqueSymbols = Array.from(new Set(selectedRawAtoms.map((a) => a.atomType)));
  const elementMetaMap = new Map<string, { radius: string; color: string }>();
  await Promise.all(
    uniqueSymbols.map(async (sym) => {
      const elementData = await extractElementData(sym);
      const radiusVal = elementData ? parseFloat(elementData.AtomicRadius) : NaN;
      elementMetaMap.set(sym, {
        radius: !isNaN(radiusVal) ? (radiusVal / 150).toString() : '1.0',
        color: elementData?.CPKHexColor ? `#${elementData.CPKHexColor.replace(/^#/, '')}` : '#FFFFFF'
      });
    })
  );

  const serialToIndex = new Map<number, number>();
  const atomCoordinates: AtomCoordinate[] = [];
  const chainIds: string[] = [];

  selectedRawAtoms.forEach((raw, idx) => {
    const meta = elementMetaMap.get(raw.atomType);
    const id = idx + 1;
    if (raw.serial > 0 && !serialToIndex.has(raw.serial)) {
      serialToIndex.set(raw.serial, idx);
    }
    chainIds.push(raw.chainId);
    atomCoordinates.push({
      id,
      atomType: raw.atomType,
      x: raw.x,
      y: raw.y,
      z: raw.z,
      AtomicRadius: meta?.radius ?? '1.0',
      CPKHexColor: meta?.color ?? '#FFFFFF',
      bonds: []
    });
  });

  // 1. Apply explicit CONECT bonds
  for (const { serialA, serialB, count } of conectPairs.values()) {
    const idxA = serialToIndex.get(serialA);
    const idxB = serialToIndex.get(serialB);
    if (idxA !== undefined && idxB !== undefined) {
      addUndirectedBond(atomCoordinates, idxA, idxB, Math.max(1, Math.min(3, count)));
    }
  }

  // 2. Infer covalent bonds via spatial grid for polymer residues & ligands
  inferPdbCovalentBonds(atomCoordinates, chainIds);

  return atomCoordinates;
}

async function parseSDFV3000(lines: string[]): Promise<AtomCoordinate[]> {
  const atoms: AtomCoordinate[] = [];
  const v30IdToIndex = new Map<number, number>();
  let inAtomBlock = false;
  let inBondBlock = false;

  // Join V3000 continuation lines ending with '-'
  const joinedLines: string[] = [];
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed.startsWith('M  V30')) continue;
    const body = trimmed.slice(6).trim();
    if (joinedLines.length > 0 && joinedLines[joinedLines.length - 1].endsWith('-')) {
      joinedLines[joinedLines.length - 1] = joinedLines[joinedLines.length - 1].slice(0, -1) + body;
    } else {
      joinedLines.push(body);
    }
  }

  for (const body of joinedLines) {
    const upper = body.toUpperCase();
    if (upper === 'BEGIN ATOM') {
      inAtomBlock = true;
      inBondBlock = false;
      continue;
    }
    if (upper === 'END ATOM') {
      inAtomBlock = false;
      continue;
    }
    if (upper === 'BEGIN BOND') {
      inBondBlock = true;
      inAtomBlock = false;
      continue;
    }
    if (upper === 'END BOND') {
      inBondBlock = false;
      continue;
    }

    if (inAtomBlock) {
      const parts = body.split(/\s+/);
      if (parts.length >= 5) {
        const v30Id = parseInt(parts[0], 10);
        const atomType = normalizeElementSymbol(parts[1]);
        const x = parseFloat(parts[2]);
        const y = parseFloat(parts[3]);
        const z = parseFloat(parts[4]);
        if (!isNaN(x) && !isNaN(y) && !isNaN(z) && atomType && (await isValidAtomType(atomType))) {
          const seqId = atoms.length + 1;
          v30IdToIndex.set(v30Id, atoms.length);
          atoms.push({
            id: seqId,
            atomType,
            x,
            y,
            z,
            AtomicRadius: await getAtomicRadius(atomType),
            CPKHexColor: await getCPKColor(atomType),
            bonds: []
          });
        }
      }
    } else if (inBondBlock) {
      const parts = body.split(/\s+/);
      if (parts.length >= 4) {
        const bondType = parseInt(parts[1], 10);
        const v30Atom1 = parseInt(parts[2], 10);
        const v30Atom2 = parseInt(parts[3], 10);
        const idx1 = v30IdToIndex.get(v30Atom1);
        const idx2 = v30IdToIndex.get(v30Atom2);
        if (idx1 !== undefined && idx2 !== undefined && !isNaN(bondType)) {
          addUndirectedBond(atoms, idx1, idx2, bondType);
        }
      }
    }
  }

  return atoms;
}

export async function parseSDF(sdfData: string): Promise<AtomCoordinate[]> {
  // Only parse the first molecule record if multiple records exist separated by $$$$
  const firstRecord = sdfData.split('$$$$')[0] ?? sdfData;
  const lines = firstRecord.split(/\r?\n/);

  if (lines.some((l) => l.includes('V3000') || l.trim().startsWith('M  V30'))) {
    const v3000Atoms = await parseSDFV3000(lines);
    if (v3000Atoms.length > 0) return v3000Atoms;
  }

  const atoms: AtomCoordinate[] = [];
  let atomCount = 0; // Total number of atoms
  let bondCount = 0; // Total number of bonds
  let parsingAtoms = false;
  let parsingBonds = false;

  // First, extract the atom and bond counts from the header (4th line of the SDF V2000 format)
  if (lines.length > 3) {
      const countsLine = lines[3];
      // Standard V2000 fixed-width 3-char fields (supports 100..999 atoms without spaces, e.g. "105112")
      const fixedAtomCount = parseInt(countsLine.slice(0, 3).trim(), 10);
      const fixedBondCount = parseInt(countsLine.slice(3, 6).trim(), 10);
      if (!isNaN(fixedAtomCount) && !isNaN(fixedBondCount) && countsLine.length >= 6) {
          atomCount = fixedAtomCount;
          bondCount = fixedBondCount;
      } else {
          const counts = countsLine.trim().split(/\s+/);
          if (counts.length >= 2) {
              atomCount = parseInt(counts[0], 10);
              bondCount = parseInt(counts[1], 10);
          }
      }
  }

  // Parse atom and bond data
  for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();

      // Skip empty lines
      if (line === '') continue;
      if (line === 'M  END') break;

      // Begin parsing atoms when atom section starts
      if (!parsingAtoms && !parsingBonds && atomCount > 0 && isPossibleAtomLine(rawLine)) {
          parsingAtoms = true;
      }

      // Parse atom section
      if (parsingAtoms && atomCount > 0) {
          try {
              const atom = await parseAtomLine(rawLine, atoms.length + 1);
              atoms.push(atom);
              if (atoms.length === atomCount) {
                  parsingAtoms = false; // End of atom section
                  parsingBonds = true;  // Begin bond section
              }
          } catch (error) {
              if (error instanceof Error) {
                console.error(`Error parsing atom line ${i + 1}: ${error.message}`);
              } else {
                console.error(`Error parsing atom line ${i + 1}: ${error}`);
              }
          }
          continue;
      }

      // Parse bond section
      if (parsingBonds && bondCount > 0) {
          try {
              parseBondLine(rawLine, atoms);
              bondCount--;
              if (bondCount === 0) {
                  parsingBonds = false; // End of bond section
              }
          } catch (error) {
              if (error instanceof Error) {
                console.error(`Error parsing bond line ${i + 1}: ${error.message}`);
              } else {
                console.error(`Error parsing bond line ${i + 1}: ${error}`);
              }
          }
      }
  }

  return atoms;
}

async function parseAtomLine(line: string, id: number): Promise<AtomCoordinate> {
  const parts = line.trim().split(/\s+/);

  if (parts.length < 4) {
      throw new Error(`Invalid atom line format: "${line}"`);
  }

  const [x, y, z, rawAtomType] = parts;
  const atomType = normalizeElementSymbol(rawAtomType);
  if (!isValidFloat(x) || !isValidFloat(y) || !isValidFloat(z)) {
      throw new Error(`Coordinates must be valid numbers: "${line}"`);
  }
  if (!atomType || !(await isValidAtomType(atomType))) {
      throw new Error(`Invalid atom type "${rawAtomType}" in line: "${line}"`);
  }

  return {
      id,
      atomType,
      x: parseFloat(x),
      y: parseFloat(y),
      z: parseFloat(z),
      AtomicRadius: await getAtomicRadius(atomType),
      CPKHexColor: await getCPKColor(atomType),
      bonds: [],
  };
}

function parseBondLine(rawLine: string, atoms: AtomCoordinate[]): void {
  let atom1Index = NaN;
  let atom2Index = NaN;
  let bondType = NaN;

  // Support V2000 fixed-width 3-character bond columns when atom indices >= 100 touch (e.g. " 99100  1")
  if (rawLine.length >= 9) {
      const f1 = parseInt(rawLine.slice(0, 3).trim(), 10);
      const f2 = parseInt(rawLine.slice(3, 6).trim(), 10);
      const f3 = parseInt(rawLine.slice(6, 9).trim(), 10);
      if (!isNaN(f1) && !isNaN(f2) && !isNaN(f3)) {
          atom1Index = f1;
          atom2Index = f2;
          bondType = f3;
      }
  }

  if (isNaN(atom1Index) || isNaN(atom2Index) || isNaN(bondType)) {
      const parts = rawLine.trim().split(/\s+/);
      if (parts.length < 3) {
          throw new Error(`Invalid bond line format: "${rawLine}"`);
      }
      [atom1Index, atom2Index, bondType] = parts.map((part) => parseInt(part, 10));
  }

  if (
      isNaN(atom1Index) ||
      isNaN(atom2Index) ||
      isNaN(bondType) ||
      atom1Index < 1 ||
      atom2Index < 1 ||
      atom1Index > atoms.length ||
      atom2Index > atoms.length
  ) {
      throw new Error(`Invalid bond data: "${rawLine}"`);
  }

  addUndirectedBond(atoms, atom1Index - 1, atom2Index - 1, bondType);
}

function isValidFloat(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

function isPossibleAtomLine(line: string): boolean {
  const regex = /^\s*-?\d+\.\d+\s+-?\d+\.\d+\s+-?\d+\.\d+\s+[A-Za-z]{1,2}/;
  return regex.test(line);
}

/**
 * Computes a Hill-system molecular formula (e.g. "C9H8O4") from parsed atom coordinates.
 */
export function computeMolecularFormula(atoms: AtomCoordinate[]): string {
  if (!atoms || atoms.length === 0) return '';
  const counts = new Map<string, number>();
  for (const atom of atoms) {
    const sym = normalizeElementSymbol(atom.atomType);
    if (!sym) continue;
    counts.set(sym, (counts.get(sym) ?? 0) + 1);
  }
  const ordered: string[] = [];
  if (counts.has('C')) {
    ordered.push('C');
    if (counts.has('H')) ordered.push('H');
    const rest = Array.from(counts.keys())
      .filter((k) => k !== 'C' && k !== 'H')
      .sort((a, b) => a.localeCompare(b));
    ordered.push(...rest);
  } else {
    ordered.push(...Array.from(counts.keys()).sort((a, b) => a.localeCompare(b)));
  }
  return ordered
    .map((el) => {
      const n = counts.get(el)!;
      return n === 1 ? el : `${el}${n}`;
    })
    .join('');
}

export async function isValidAtomType(symbol: string): Promise<boolean> {
  const element = await extractElementData(symbol);
  return element !== null;
}

export async function getAtomicRadius(symbol: string): Promise<string> {
  const element = await extractElementData(symbol);
  if (element) {
    const radius = parseFloat(element.AtomicRadius);
    return !isNaN(radius) ? (radius / 150).toString() : 'N/A';
  }
  return 'N/A';
}

export async function getCPKColor(symbol: string): Promise<string> {
  const element = await extractElementData(symbol);
  return element ? `#${element.CPKHexColor.replace(/^#/, '')}` : '#FFFFFF'; // Default to white if not found
}

let cachedPeriodicTableMapPromise: Promise<Map<string, { AtomicRadius: string; CPKHexColor: string }> | null> | null = null;

async function getPeriodicTableMap(): Promise<Map<string, { AtomicRadius: string; CPKHexColor: string }> | null> {
  if (typeof fetch !== 'function' || typeof window === 'undefined') {
    return null;
  }
  if (!cachedPeriodicTableMapPromise) {
    cachedPeriodicTableMapPromise = fetch('/periodic_table.json')
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json();
        const map = new Map<string, { AtomicRadius: string; CPKHexColor: string }>();
        for (const row of data?.Table?.Row ?? []) {
          const sym = String(row?.Cell?.[1] ?? '').trim().toLowerCase();
          if (sym) {
            map.set(sym, {
              AtomicRadius: row.Cell[7] || '170',
              CPKHexColor: row.Cell[4] || 'FFFFFF'
            });
          }
        }
        return map;
      })
      .catch(() => {
        cachedPeriodicTableMapPromise = null;
        return null;
      });
  }
  return cachedPeriodicTableMapPromise;
}

// Helper function to fetch periodic table data and extract element information
export async function extractElementData(symbol: string): Promise<{ AtomicRadius: string; CPKHexColor: string } | null> {
  const normalized = normalizeElementSymbol(symbol);
  if (!normalized) return null;

  const tableMap = await getPeriodicTableMap();
  if (tableMap) {
    const found = tableMap.get(normalized.toLowerCase());
    if (found) return found;
    console.warn(`Element with symbol "${symbol}" not found.`);
    return null;
  }

  return FALLBACK_ELEMENTS[normalized] ?? null;
}

/** `cdx` / `cdxml` are ChemDraw documents (converted via OpenBabel in the browser). */
export type StructureFileFormat = 'pdb' | 'sdf' | 'cif' | 'cdx' | 'cdxml';

const EXTENSION_FORMATS: Record<string, StructureFileFormat> = {
  pdb: 'pdb',
  ent: 'pdb',
  sdf: 'sdf',
  sd: 'sdf',
  mol: 'sdf',
  mdl: 'sdf',
  cif: 'cif',
  mmcif: 'cif',
  cdx: 'cdx',
  cdxml: 'cdxml'
};

/** File-picker `accept` list for all supported structure formats. */
export const STRUCTURE_FILE_ACCEPT = '.sdf, .sd, .mol, .mdl, .pdb, .ent, .cif, .mmcif, .cdx, .cdxml';

/**
 * Splits a file name into its base name and structure format. Wrapper extensions such as
 * `.txt` (added e.g. by iOS / iCloud downloads: `molecule.sdf.txt`) are skipped.
 */
export function structureFormatFromFileName(fileName: string): { baseName: string; format: StructureFileFormat | null } {
  const parts = fileName.split('.');
  while (parts.length > 1 && ['txt', 'text'].includes(parts[parts.length - 1].toLowerCase())) {
    parts.pop();
  }
  const ext = parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  const format = EXTENSION_FORMATS[ext] ?? null;
  return { baseName: format ? parts.slice(0, -1).join('.') : parts.join('.'), format };
}

/** Guesses the structure format from the file content; null when it is not recognised. */
export function detectStructureFormat(content: string): StructureFileFormat | null {
  const text = content.replace(/^\uFEFF/, '');
  if (text.startsWith('VjCD0100')) return 'cdx';
  if (/^\s*(?:<\?xml[^>]*>\s*)?(?:<!DOCTYPE\s+CDXML|<CDXML[\s>])/i.test(text.slice(0, 600))) return 'cdxml';
  const lines = text.split(/\r?\n/);
  // MDL molfile / SDF: counts line (4th line) ends with V2000/V3000, or "M  END" is present
  if (lines.slice(0, 10).some((l) => /\bV[23]000\s*$/.test(l)) || lines.some((l) => l.startsWith('M  END'))) {
    return 'sdf';
  }
  const head = lines.slice(0, 400);
  if (head.some((l) => /^data_\S*/.test(l.trim())) && head.some((l) => l.trim().startsWith('_'))) {
    return 'cif';
  }
  if (head.some((l) => /^(ATOM  |HETATM|ATOM\s+\d|HETATM\d)/.test(l))) {
    return 'pdb';
  }
  return null;
}
