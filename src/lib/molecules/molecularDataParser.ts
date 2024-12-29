export interface AtomCoordinate {
  atomType: string;
  x: number;
  y: number;
  z: number;
  AtomicRadius?: string; // Optional property for atomic radius
  CPKHexColor?: string;  // Optional property for CPK color
  id?: number;           // Optional property for atom index/id
  bonds?: number[];      // Optional property for bonds
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

export async function extractElementData(symbol: string): Promise<ElementInfo | null> {
  const url = '/periodic_table.json'; //From: https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Find the element by symbol
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

export async function parseSDF(data: string): Promise<AtomCoordinate[]> {
  const lines = data.split("\n");
  const atomCoordinates: AtomCoordinate[] = [];
  const bondConnections: [number, number][] = [];
  const fetchPromises: Promise<void>[] = [];

  // Parse header to get the atom and bond count
  const headerLine = lines[3];
  const atomCount = parseInt(headerLine.slice(0, 3).trim(), 10);
  const bondCount = parseInt(headerLine.slice(3, 6).trim(), 10);

  // Parse atoms
  for (let i = 4; i < 4 + atomCount; i++) {
    const line = lines[i];
    const x = parseFloat(line.slice(0, 10).trim());
    const y = parseFloat(line.slice(10, 20).trim());
    const z = parseFloat(line.slice(20, 30).trim());
    const atomType = cleanElement(line.slice(31, 34).trim());

    if (!isNaN(x) && !isNaN(y) && !isNaN(z) && atomType) {
      const atom: AtomCoordinate = {
        atomType,
        x,
        y,
        z,
        id: i - 4 + 1, // Atom index starts from 1
        bonds: [],
      };

      // Fetch additional data like AtomicRadius and CPKHexColor
      const fetchElementDataPromise = extractElementData(atomType).then((elementData) => {
        if (elementData) {
          atom.AtomicRadius = (parseFloat(elementData.AtomicRadius) / 150).toString();
          atom.CPKHexColor = `#${elementData.CPKHexColor.replace(/^#/, '')}`;
        }
      });

      fetchPromises.push(fetchElementDataPromise);
      atomCoordinates.push(atom);
    }
  }

  // Parse bonds
  for (let i = 4 + atomCount; i < 4 + atomCount + bondCount; i++) {
    const line = lines[i];
    const atom1 = parseInt(line.slice(0, 3).trim(), 10);
    const atom2 = parseInt(line.slice(3, 6).trim(), 10);

    if (!isNaN(atom1) && !isNaN(atom2)) {
      bondConnections.push([atom1, atom2]);

      // Add bond connections to respective atoms
      const atom1Index = atom1 - 1; // Convert to zero-based index
      const atom2Index = atom2 - 1;
      if (atomCoordinates[atom1Index]) {
        atomCoordinates[atom1Index].bonds!.push(atom2);
      }
      if (atomCoordinates[atom2Index]) {
        atomCoordinates[atom2Index].bonds!.push(atom1);
      }
    }
  }

  // Wait for all fetch operations to complete
  await Promise.all(fetchPromises);

  return atomCoordinates;
}

export async function parseSDF2(data: string): Promise<AtomCoordinate[]> {
  const lines = data.split('\n'); // Rozdělení na řádky
  const atomCoordinates: AtomCoordinate[] = [];
  const fetchPromises: Promise<void>[] = [];

  // Regexy pro parsování
  const headerRegex = /^\s*(\d+)\s+(\d+)/; // Počet atomů a vazeb
  const atomRegex = /^\s*(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+([A-Za-z]{1,2})/; // Souřadnice + typ atomu
  const bondRegex = /^\s*(\d+)\s+(\d+)/; // Vazby mezi atomy

  // Hledání hlavičky
  const headerLineIndex = lines.findIndex(line => headerRegex.test(line));
  if (headerLineIndex === -1) {
    throw new Error('Invalid SDF format: Header line not found.');
  }

  const headerMatch = lines[headerLineIndex].match(headerRegex);
  const atomCount = parseInt(headerMatch![1], 10); // Počet atomů
  const bondCount = parseInt(headerMatch![2], 10); // Počet vazeb

  // Parsování atomů
  for (let i = 1; i <= atomCount; i++) {
    const atomLine = lines[headerLineIndex + i];
    const atomMatch = atomLine.match(atomRegex);
    if (atomMatch) {
      const x = parseFloat(atomMatch[1]);
      const y = parseFloat(atomMatch[2]);
      const z = parseFloat(atomMatch[3]);
      const atomType = atomMatch[4];

      const atom: AtomCoordinate = {
        atomType,
        x,
        y,
        z,
        id: i, // Jedinečné ID atomu
        bonds: [], // Vazby se přidají později
      };

      // Fetch additional data like AtomicRadius and CPKHexColor
      const fetchElementDataPromise = extractElementData(atomType).then((elementData) => {
        if (elementData) {
          atom.AtomicRadius = (parseFloat(elementData.AtomicRadius) / 150).toString();
          atom.CPKHexColor = `#${elementData.CPKHexColor.replace(/^#/, '')}`;
        }
      });

      fetchPromises.push(fetchElementDataPromise);
      atomCoordinates.push(atom);
    } else {
      throw new Error(`Invalid SDF format: Atom line ${i} is not valid.`);
    }
  }

  // Parsování vazeb
  for (let i = 1; i <= bondCount; i++) {
    const bondLine = lines[headerLineIndex + atomCount + i];
    const bondMatch = bondLine.match(bondRegex);
    if (bondMatch) {
      const atom1Index = parseInt(bondMatch[1], 10) - 1;
      const atom2Index = parseInt(bondMatch[2], 10) - 1;
      if (atomCoordinates[atom1Index]) {
        atomCoordinates[atom1Index].bonds!.push(atom2Index + 1);
      }
      if (atomCoordinates[atom2Index]) {
        atomCoordinates[atom2Index].bonds!.push(atom1Index + 1);
      }
    } else {
      throw new Error(`Invalid SDF format: Bond line ${i} is not valid.`);
    }
  }

  // Wait for all fetch operations to complete
  await Promise.all(fetchPromises);

  return atomCoordinates;
}