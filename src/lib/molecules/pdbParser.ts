export interface AtomCoordinate {
  atomType: string;
  x: number;
  y: number;
  z: number;
  AtomicRadius?: string; // Optional property for atomic radius
  CPKHexColor?: string;  // Optional property for CPK color
}

const pattern1 = /^HETATM\s+(\d+)\s+([A-Za-z0-9]+(?:-[A-Za-z0-9]+)?)\s+([A-Za-z0-9]+)\s*([A-Za-z]?)\s*(\d*)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(-?\d+\.\d+)\s+(\d+\.\d+)\s+(\d+\.\d+)\s*([A-Za-z]*)\s*$/;
const pattern2 = /^HETATM\s+(\d+)\s+(\S+)\s+(\w+)\s+(\w+)\s+(\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+(\S+)/;
const pattern3 = /\s*([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+([-+]?\d*\.\d+)\s+(\w+)\s*/;

export async function parsePDB(data: string | string[]): Promise<AtomCoordinate[]> {
  const lines = typeof data === 'string' ? data.split('\n') : data;
  const atomCoordinates: AtomCoordinate[] = [];

  // Create an array to store promises for element data fetching
  const fetchPromises: Promise<void>[] = [];

  for (const line of lines) {
      let match = line.match(pattern1);
      let result: AtomCoordinate | null = null;

      if (match) {
          const atom = match[11];
          const atomType = atom.replace(/\d.*/, '');
          const x = parseFloat(match[6]);
          const y = parseFloat(match[7]);
          const z = parseFloat(match[8]);
          result = { atomType, x, y, z };
      } else {
          match = line.match(pattern2);
          if (match) {
              const atom = match[2];
              const atomType = atom.replace(/\d.*/, '');
              const x = parseFloat(match[6]);
              const y = parseFloat(match[7]);
              const z = parseFloat(match[8]);
              result = { atomType, x, y, z };
          } else {
              match = line.match(pattern3);
              if (match) {
                  const atomType = match[4];
                  const x = parseFloat(match[1]);
                  const y = parseFloat(match[2]);
                  const z = parseFloat(match[3]);
                  result = { atomType, x, y, z };
              }
          }
      }

      if (result) {
          // Create a promise to fetch element data for the current atom type
          const fetchElementDataPromise = extractElementData(result.atomType).then((elementData) => {
              if (elementData) {
                  result.AtomicRadius = elementData.AtomicRadius;
                  result.CPKHexColor = elementData.CPKHexColor;
              }
          });

          fetchPromises.push(fetchElementDataPromise); // Add the promise to the array
          atomCoordinates.push(result); // Add the atom coordinate object
      }
  }

  // Wait for all element data to be fetched
  await Promise.all(fetchPromises);

  return atomCoordinates;
}

type ElementInfo = {
  AtomicRadius: string;
  CPKHexColor: string;
};

async function extractElementData(symbol: string): Promise<ElementInfo | null> {
  const url = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/periodictable/JSON'; // Moved URL here

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