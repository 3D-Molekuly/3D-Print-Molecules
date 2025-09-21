// Type definitions for clarity
interface CovalentRadii {
  [key: string]: number;
}

interface Cell {
  a: number;
  b: number;
  c: number;
  alpha: number;
  beta: number;
  gamma: number;
}

interface Atom {
  label: string;
  symbol: string;
  xf: number;
  yf: number;
  zf: number;
}

interface Coords {
  x: number;
  y: number;
  z: number;
}

const BOND_TOLERANCE = 0.45; // Å


function getCovalentRadiiMap(covalentRadiiData: any[]): CovalentRadii {
  return Object.fromEntries(
    covalentRadiiData
      .filter((entry: any) => entry.r)
      .map((entry: any) => {
        const symbol = entry.Symbol.replace(/\s*\(.*\)/, '');
        const r_value = parseFloat(entry.r.replace(/\(.*\)/, ''));
        return [symbol, r_value];
      })
  );
}

// *** FIX 1: Made cifFloat more robust ***
function cifFloat(value: string): number {
  if (typeof value !== 'string') {
      return NaN; // Return Not-a-Number for invalid input
  }
  return parseFloat(value.replace(/\(.*\)/, ''));
}


// *** FIX 2: Added validation inside parseCif ***
function parseCif(cifContent: string): { cell: Cell; atoms: Atom[] } {
  const cell: Partial<Cell> = {};
  const atoms: Atom[] = [];
  const lines = cifContent.split('\n');

  let loopMode = false;
  let headers: string[] = [];
  let atomDataIndices: { [key: string]: number } = {};

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;

    // Use a more robust split for values that might contain spaces if quoted
    const parts = trimmedLine.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];

    if (trimmedLine.startsWith('_cell_length_a')) cell.a = cifFloat(parts[1]);
    else if (trimmedLine.startsWith('_cell_length_b')) cell.b = cifFloat(parts[1]);
    else if (trimmedLine.startsWith('_cell_length_c')) cell.c = cifFloat(parts[1]);
    else if (trimmedLine.startsWith('_cell_angle_alpha')) cell.alpha = (Math.PI / 180) * cifFloat(parts[1]);
    else if (trimmedLine.startsWith('_cell_angle_beta')) cell.beta = (Math.PI / 180) * cifFloat(parts[1]);
    else if (trimmedLine.startsWith('_cell_angle_gamma')) cell.gamma = (Math.PI / 180) * cifFloat(parts[1]);
    else if (trimmedLine.startsWith('loop_')) {
      loopMode = true;
      headers = [];
      atomDataIndices = {};
    } else if (loopMode && trimmedLine.startsWith('_atom_site_')) {
      headers.push(trimmedLine);
    } else if (loopMode && headers.length > 0 && !trimmedLine.startsWith('_')) {
      if (Object.keys(atomDataIndices).length === 0) {
        atomDataIndices['_atom_site_label'] = headers.indexOf('_atom_site_label');
        atomDataIndices['_atom_site_type_symbol'] = headers.indexOf('_atom_site_type_symbol');
        atomDataIndices['_atom_site_fract_x'] = headers.indexOf('_atom_site_fract_x');
        atomDataIndices['_atom_site_fract_y'] = headers.indexOf('_atom_site_fract_y');
        atomDataIndices['_atom_site_fract_z'] = headers.indexOf('_atom_site_fract_z');
      }

      const label = parts[atomDataIndices['_atom_site_label']];
      const symbol = parts[atomDataIndices['_atom_site_type_symbol']];
      const x_str = parts[atomDataIndices['_atom_site_fract_x']];
      const y_str = parts[atomDataIndices['_atom_site_fract_y']];
      const z_str = parts[atomDataIndices['_atom_site_fract_z']];

      // Check that all required parts exist before parsing
      if (!label || !symbol || !x_str || !y_str || !z_str) {
          console.warn("Skipping malformed or incomplete atom data line:", trimmedLine);
          continue; // Skip to the next line
      }

      const xf = cifFloat(x_str);
      const yf = cifFloat(y_str);
      const zf = cifFloat(z_str);

      // Also check that parsing was successful
      if (!isNaN(xf) && !isNaN(yf) && !isNaN(zf)) {
          atoms.push({ label, symbol, xf, yf, zf });
      } else {
          console.warn("Could not parse coordinates from line:", trimmedLine);
      }
    } else if (loopMode && trimmedLine.startsWith('_')) {
        // End of the atom loop
        loopMode = false;
    }
  }

  if (!cell.a || !cell.b || !cell.c || !cell.alpha || !cell.beta || !cell.gamma) {
    throw new Error('Missing cell parameters in CIF file.');
  }

  return { cell: cell as Cell, atoms };
}

function fracToCart(cell: Cell, xf: number, yf: number, zf: number): Coords {
  const { a, b, c, alpha, beta, gamma } = cell;

  const cos_alpha = Math.cos(alpha);
  const cos_beta = Math.cos(beta);
  const cos_gamma = Math.cos(gamma);
  const sin_gamma = Math.sin(gamma);

  const v = Math.sqrt(1 - cos_alpha**2 - cos_beta**2 - cos_gamma**2 + 2 * cos_alpha * cos_beta * cos_gamma);
  
  const x = a * xf + b * cos_gamma * yf + c * cos_beta * zf;
  const y = b * sin_gamma * yf + c * (cos_alpha - cos_beta * cos_gamma) / sin_gamma * zf;
  const z = c * v / sin_gamma * zf;

  return { x, y, z };
}

function generateBonds(atoms: Atom[], coords: Coords[], covalentRadii: CovalentRadii): [number, number, number][] {
  const bonds: [number, number, number][] = [];
  const n = atoms.length;
  for (let i = 0; i < n; i++) {
    const sym1 = atoms[i].symbol;
    const { x: x1, y: y1, z: z1 } = coords[i];
    const r1 = covalentRadii[sym1] || 0.77;
    for (let j = i + 1; j < n; j++) {
      const sym2 = atoms[j].symbol;
      const { x: x2, y: y2, z: z2 } = coords[j];
      const r2 = covalentRadii[sym2] || 0.77;
      const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
      if (dist <= r1 + r2 + BOND_TOLERANCE) {
        bonds.push([i + 1, j + 1, 1]);
      }
    }
  }
  return bonds;
}

function writeSdf(atoms: Atom[], coords: Coords[], bonds: [number, number, number][]): string {
  let sdf = "Converted from CIF\n";
  sdf += "  - Generated by SvelteKit\n\n";
  sdf += `${atoms.length.toString().padStart(3)}${bonds.length.toString().padStart(3)}  0  0  0  0            999 V2000\n`;
  
  atoms.forEach((atom, i) => {
    const { x, y, z } = coords[i];
    const symbol = atom.symbol.padEnd(3);
    sdf += `${x.toFixed(4).padStart(10)}${y.toFixed(4).padStart(10)}${z.toFixed(4).padStart(10)} ${symbol} 0  0  0  0  0  0  0  0  0  0  0  0\n`;
  });

  bonds.forEach(([a1, a2, order]) => {
    sdf += `${a1.toString().padStart(3)}${a2.toString().padStart(3)}${order.toString().padStart(3)}  0  0  0  0\n`;
  });

  sdf += "M  END\n$$$$\n";
  return sdf;
}

export async function cifToSdf(cifContent: string): Promise<string> {
  try {
    // Load covalent radii data from the static folder
    const response = await fetch('/CSWiki_CovalentRadius.json');
    if (!response.ok) throw new Error('Failed to load covalent radii data');
    const covalentRadiiData = await response.json();
    const covalentRadii = getCovalentRadiiMap(covalentRadiiData);

    const { cell, atoms } = parseCif(cifContent);
    const coords = atoms.map(atom => fracToCart(cell, atom.xf, atom.yf, atom.zf));
    const bonds = generateBonds(atoms, coords, covalentRadii);
    return writeSdf(atoms, coords, bonds);
  } catch(error) {
    console.error("Failed to convert CIF to SDF:", error);
    throw error;
  }
}