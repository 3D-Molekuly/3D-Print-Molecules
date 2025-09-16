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

    setTableInfo(iupacName, cid, molecularFormula);
    setImage(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`);
  } else {
    console.error("Error fetching PubChem properties.");
  }
}

  // New function for PubChem with autocomplete
  export async function fetchPubChemDataWithAutocomplete(
    inputStr: string,
    setTableInfo: (first: string, second: string, third: string) => void,
    setImage: (url: string) => void
  ): Promise<string> { // Returns the name to save to history
    let cid: string | null = null;
    const allDigits = /^\d+$/.test(inputStr);
    let nameToSave = inputStr; // Default to the user's input

    if (!allDigits) {
      // First try autocomplete API for better name matching
      try {
        const autocompleteUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(inputStr)}?limit=1`;
        const autocompleteResponse = await fetch(autocompleteUrl);

        if (autocompleteResponse.ok) {
          const autocompleteData = await autocompleteResponse.json();
          if (autocompleteData.dictionary_terms && autocompleteData.dictionary_terms.compound && autocompleteData.dictionary_terms.compound.length > 0) {
            const suggestedName = autocompleteData.dictionary_terms.compound[0];
            nameToSave = suggestedName; // Capture the autocompleted name for history
            console.log(`Autocomplete suggested: ${suggestedName}`);

            // Use the suggested name to get CID
            const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(suggestedName)}/cids/JSON`;
            const response = await fetch(pubchemUrl);
            if (response.ok) {
              const data = await response.json();
              cid = data.IdentifierList?.CID?.[0] || null;
            }
          }
        }
      } catch (error) {
        console.log("Autocomplete failed, trying direct name search:", error);
      }

      // If autocomplete didn't work, fall back to direct name search (handles text names and CAS numbers)
      if (!cid) {
        const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(inputStr)}/cids/JSON`;
        const response = await fetch(pubchemUrl);
        if (response.ok) {
          const data = await response.json();
          cid = data.IdentifierList?.CID?.[0] || null;
          if (!cid) {
            console.error("CID not found for the given name.");
            return nameToSave;
          }
        } else {
          console.error("Error fetching CID.");
          return nameToSave;
        }
      }
    } else {
      // If the input is all digits, treat it as a CID
      cid = inputStr;
    }

    if (!cid) {
      console.error("Could not determine CID.");
      return nameToSave;
    }

    // Fetch properties and synonyms using the found CID
    const pubchemPropertyUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName,MolecularFormula/JSON`;
    const pubchemSynonymsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`;

    const [propertyResponse, synonymsResponse] = await Promise.all([
      fetch(pubchemPropertyUrl),
      fetch(pubchemSynonymsUrl)
    ]);

    if (propertyResponse.ok) {
      const propertyData = await propertyResponse.json();
      const properties = propertyData.PropertyTable.Properties[0];
      const iupacName = properties.IUPACName;
      const molecularFormula = properties.MolecularFormula;

      // If the original input was a number (CID) or CAS number,
      // replace it with the proper chemical name for the search history.
      // We check against the original `inputStr` for robustness.
      const originalInputIsCas = /^\d{2,7}-\d{2}-\d$/.test(inputStr);
      const originalInputIsCID = /^\d+$/.test(inputStr);

      if ((originalInputIsCID || originalInputIsCas) && iupacName) {
        nameToSave = iupacName;
      }

      let displayName = iupacName || ''; // Default to IUPAC Name

      if (synonymsResponse.ok) {
        const synonymsData = await synonymsResponse.json();
        const synonyms: string[] = synonymsData.InformationList?.Information[0]?.Synonym;
        if (synonyms && synonyms.length > 0) {
          displayName = synonyms.slice(0, 5).join(', '); // Use first 5 synonyms for display
        }
      }

      setTableInfo(displayName, cid, molecularFormula);
      setImage(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`);
    } else {
      console.error("Error fetching PubChem properties.");
    }

    return nameToSave; // Return the resolved name for history
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
