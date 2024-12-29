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

//for parsePDB
const pattern1 = /^HETATM\s+(\d+)\s+([A-Za-z0-9]+(?:-[A-Za-z0-9]+)?)\s+([A-Za-z0-9]+)\s*([A-Za-z]?)\s*(\d*)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s*([A-Za-z]*)\s*$/;
const pattern2 = /^HETATM\s+(\d+)\s+(\S+)\s+(\w+)\s+(\w+)\s+(\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+(\S+)/;
const pattern3 = /\s*([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+(\w+)\s*/;
const pattern4 = /HETATM\s+\d+\s+\w+\s+\w+\s+\w+\s+\d+\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+\d+\.\d+\s+\d+\.\d+\s+([A-Z]).*$/;

const cleanElement = (element: string): string => {
  // Removes numbers and special characters from the element
  return element.replace(/[^A-Z]/g, '');
};

const parseLine = (line: string, pattern: RegExp, atomIndex: number, xIndex: number, yIndex: number, zIndex: number): AtomCoordinate | null => {
  const match = line.match(pattern);
  if (match) {
    const atomType = cleanElement(match[atomIndex]);
    const x = parseFloat(match[xIndex]);
    const y = parseFloat(match[yIndex]);
    const z = parseFloat(match[zIndex]);

    if (!isNaN(x) && !isNaN(y) && !isNaN(z) && typeof atomType === 'string' && atomType) {
      return { atomType, x, y, z };
    } else {
      console.warn(`Invalid data at line: ${line}`);
    }
  }
  return null;
};

type ElementInfo = {
  AtomicRadius: string;
  CPKHexColor: string;
};

export async function parsePDB(data: string | string[]): Promise<AtomCoordinate[]> {
  const lines = typeof data === 'string' ? data.split('\n') : data;
  const atomCoordinates: AtomCoordinate[] = [];
  const fetchPromises: Promise<void>[] = [];

  for (const line of lines) {
    let result: AtomCoordinate | null = null;

    result = parseLine(line, pattern1, 11, 6, 7, 8) ||
             parseLine(line, pattern2, 2, 6, 7, 8) ||
             parseLine(line, pattern4, 4, 1, 2, 3) ||
             parseLine(line, pattern3, 4, 1, 2, 3);

    if (result) {
      const fetchElementDataPromise = extractElementData(result.atomType).then((elementData) => {
        if (elementData) {
          result!.AtomicRadius = (parseFloat(elementData.AtomicRadius) / 150).toString();
          result!.CPKHexColor = `#${elementData.CPKHexColor.replace(/^#/, '')}`;
        }
      });

      fetchPromises.push(fetchElementDataPromise);
      atomCoordinates.push(result);
    }
  }

  await Promise.all(fetchPromises);
  return atomCoordinates;
}

export async function parseSDF(sdfData: string): Promise<AtomCoordinate[]> {
  const lines = sdfData.split('\n');
  const atoms: AtomCoordinate[] = [];
  let atomCount = 0; // Total number of atoms
  let bondCount = 0; // Total number of bonds
  let parsingAtoms = false;
  let parsingBonds = false;

  // First, extract the atom and bond counts from the header (e.g., in the 4th line of the SDF format)
  if (lines.length > 3) {
      const countsLine = lines[3].trim();
      const counts = countsLine.split(/\s+/);
      if (counts.length >= 2) {
          atomCount = parseInt(counts[0], 10);
          bondCount = parseInt(counts[1], 10);
      }
  }

  // Parse atom and bond data
  for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (line === '') continue;

      // Begin parsing atoms when atom section starts
      if (!parsingAtoms && atomCount > 0 && isPossibleAtomLine(line)) {
          parsingAtoms = true;
      }

      // Parse atom section
      if (parsingAtoms && atomCount > 0) {
          try {
              const atom = await parseAtomLine(line, atoms.length + 1);
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
              parseBondLine(line, atoms);
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

  const [x, y, z, atomType] = parts;
  if (!isValidFloat(x) || !isValidFloat(y) || !isValidFloat(z)) {
      throw new Error(`Coordinates must be valid numbers: "${line}"`);
  }
  if (!await isValidAtomType(atomType)) {
      throw new Error(`Invalid atom type "${atomType}" in line: "${line}"`);
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

function parseBondLine(line: string, atoms: AtomCoordinate[]): void {
  const parts = line.trim().split(/\s+/);

  if (parts.length < 3) {
      throw new Error(`Invalid bond line format: "${line}"`);
  }

  const [atom1Index, atom2Index, bondType] = parts.map((part) => parseInt(part, 10));

  if (
      isNaN(atom1Index) ||
      isNaN(atom2Index) ||
      isNaN(bondType) ||
      atom1Index < 1 ||
      atom2Index < 1 ||
      atom1Index > atoms.length ||
      atom2Index > atoms.length
  ) {
      throw new Error(`Invalid bond data: "${line}"`);
  }

  // Update the bond information in the corresponding atoms
  atoms[atom1Index - 1].bonds?.push({ atomId: atom2Index, bondType });
  atoms[atom2Index - 1].bonds?.push({ atomId: atom1Index, bondType });
}

function isValidFloat(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

function isPossibleAtomLine(line: string): boolean {
  const regex = /^\s*-?\d+\.\d+\s+-?\d+\.\d+\s+-?\d+\.\d+\s+[A-Za-z]{1,2}/;
  return regex.test(line);
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

// Helper function to fetch periodic table data and extract element information
export async function extractElementData(symbol: string): Promise<{ AtomicRadius: string; CPKHexColor: string } | null> {
  const url = '/periodic_table.json'; //From: https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Find the element by its symbol
    const element = data.Table.Row.find((row: any) => {
      const elementSymbol = row.Cell[1]; // Symbol is at index 1
      return elementSymbol.toLowerCase() === symbol.toLowerCase();
    });

    if (element) {
      const atomicRadius = element.Cell[7] || 'N/A'; // Atomic Radius at index 7
      const cpkColor = element.Cell[4] || 'N/A'; // CPKHexColor at index 4

      return {
        AtomicRadius: atomicRadius,
        CPKHexColor: cpkColor,
      };
    } else {
      console.warn(`Element with symbol "${symbol}" not found.`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching or processing data:', error);
    return null;
  }
}