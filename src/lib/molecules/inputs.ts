// src/lib/molecule_data.ts
export function determineInputType(inputStr: string): string {
  const casPattern = /^\d{2,7}-\d{2}-\d$/;
  if (/^\d+$/.test(inputStr) || /^[a-zA-Z]+$/.test(inputStr) || casPattern.test(inputStr)) {
    return "CID";
  } else if (/^[a-zA-Z0-9]{4}$/.test(inputStr)) {
    return "PDB";
  } else if (typeof window !== 'undefined' && window.FileReader) {
    return "File";
  } else {
    return "Unknown";
  }
}

export async function fetchPubChemData(
  inputStr: string,
  setTableInfo: (first: string, second: string, third: string) => void,
  setImage: (url: string) => void
) {
  let cid: string | null = null;

  const allDigits = /^\d+$/.test(inputStr);
  if (!allDigits) {
    const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${inputStr}/cids/JSON`;
    const response = await fetch(pubchemUrl);

    if (response.ok) {
      const data = await response.json();
      cid = data.IdentifierList?.CID?.[0] || null;

      if (!cid) {
        console.error("CID not found for the given name.");
        return;
      }
    } else {
      console.error("Error fetching CID.");
      return;
    }
  } else {
    cid = inputStr;
  }

  const pubchemPropertyUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName,MolecularFormula/JSON`;
  const propertyResponse = await fetch(pubchemPropertyUrl);

  if (propertyResponse.ok) {
    const propertyData = await propertyResponse.json();
    const properties = propertyData.PropertyTable.Properties[0];
    const iupacName = properties.IUPACName;
    const molecularFormula = properties.MolecularFormula;

    setTableInfo(iupacName, molecularFormula, cid);
    setImage(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`);
  } else {
    console.error("Error fetching PubChem properties.");
  }
}

export async function fetchPDBData(
  pdbCode: string,
  setTableInfo: (first: string, second: string, third: string) => void,
  setImage: (url: string) => void
) {
  const graphqlUrl = "https://data.rcsb.org/graphql";
  const query = `
    query ($id: String!) {
      entry(entry_id: $id) {
        struct {
          title
        }
        rcsb_entry_info {
          molecular_weight
        }
      }
    }
  `;

  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id: pdbCode } })
  });

  if (response.ok) {
    const data = await response.json();
    const entry = data.data.entry;
    const proteinName = entry.struct.title;
    const molecularWeight = entry.rcsb_entry_info.molecular_weight;

    setTableInfo(proteinName, pdbCode, `${molecularWeight} kDa`);
    setImage(`https://cdn.rcsb.org/images/structures/${pdbCode.toLowerCase()}_assembly-1.jpeg`);
  } else {
    console.error("Error fetching PDB data");
  }
}
