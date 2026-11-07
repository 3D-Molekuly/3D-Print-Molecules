// src/lib/molecules/inputs.ts
import { cifToSdf } from '$lib/utils/cifToSdf';

export interface PdbSearchHit {
  id: string;
  title: string;
  molecularWeight?: string;
  atomCount?: number;
}

export interface CcdSearchHit {
  id: string;
  name: string;
  formula: string;
  weight?: number;
}

export interface CodSearchHit {
  id: string;
  name: string;
  formula: string;
  mineral?: string;
  spaceGroup?: string;
}

export interface CodLoadedEntry {
  id: string;
  sdf: string;
  name: string;
  formula: string;
  spaceGroup?: string;
}

export interface CcdLoadedLigand {
  id: string;
  sdf: string;
  name: string;
  formula: string;
  imageUrl: string;
}

export interface CactusLoadedMolecule {
  query: string;
  sdf: string;
  iupacName?: string;
  imageUrl: string;
}

export function parsePdbQuerySpec(rawQuery: string): { pdbId: string; chainId?: string; includeWaters?: boolean } {
  const cleaned = rawQuery.replace(/^pdb:\s*/i, '').trim();
  // Support optional "+w" / "+hoh" suffix for crystal waters and ":Chain" for chain selection (e.g. "4HHB:A" or "1CRN+w")
  const includeWaters = /\+(?:w|hoh|waters?)$/i.test(cleaned);
  const withoutWaterFlag = cleaned.replace(/\+(?:w|hoh|waters?)$/i, '').trim();
  const [rawPdb, rawChain] = withoutWaterFlag.split(':');
  const pdbId = (rawPdb || '').trim().toUpperCase();
  const chainId = rawChain?.trim() ? rawChain.trim() : undefined;
  return { pdbId, chainId, includeWaters };
}

export function formatPdbQuerySpec(pdbId: string, chainId?: string, includeWaters?: boolean): string {
  let out = pdbId.trim().toUpperCase();
  if (chainId && chainId.trim()) {
    out += `:${chainId.trim()}`;
  }
  if (includeWaters) {
    out += '+w';
  }
  return out;
}

export function determineInputType(inputStr: string): string {
  const casPattern = /^\d{2,7}-\d{2}-\d$/;
  if (/^\d+$/.test(inputStr) || /^[a-zA-Z]+$/.test(inputStr) || casPattern.test(inputStr)) {
    return "CID";
  } else if (/^[a-zA-Z0-9]{4}(?::[a-zA-Z0-9]+)?$/.test(inputStr)) {
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
    const pubchemUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(inputStr)}/cids/JSON`;
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

    setTableInfo(displayName, String(cid), molecularFormula);
    setImage(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`);
  } else {
    console.error("Error fetching PubChem properties.");
  }

  return nameToSave; // Return the resolved name for history
}

export async function fetchPDBData(
  pdbQuery: string,
  setTableInfo: (first: string, second: string, third: string) => void,
  setImage: (url: string) => void
) {
  const { pdbId, chainId } = parsePdbQuerySpec(pdbQuery);
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
    body: JSON.stringify({ query, variables: { id: pdbId } })
  });

  if (response.ok) {
    const data = await response.json();
    const entry = data?.data?.entry;
    if (entry) {
      const proteinName = entry.struct?.title || pdbId;
      const molecularWeight = entry.rcsb_entry_info?.molecular_weight;
      const weightText = molecularWeight != null ? `${molecularWeight} kDa` : '';
      const desc = chainId ? `${weightText ? `${weightText} · ` : ''}Chain ${chainId}` : weightText;

      setTableInfo(proteinName, pdbId, desc);
      setImage(`https://cdn.rcsb.org/images/structures/${pdbId.toLowerCase()}_assembly-1.jpeg`);
    }
  } else {
    console.error("Error fetching PDB data");
  }
}

export async function searchPDBEntries(rawQuery: string, limit = 8): Promise<PdbSearchHit[]> {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  const candidateIds: string[] = [];
  const { pdbId: maybeCode } = parsePdbQuerySpec(trimmed);
  if (/^[1-9][A-Z0-9]{3}$/.test(maybeCode)) {
    candidateIds.push(maybeCode);
  }

  const searchPayload = {
    query: {
      type: 'terminal',
      service: 'full_text',
      parameters: { value: trimmed }
    },
    return_type: 'entry',
    request_options: {
      paginate: { start: 0, rows: limit }
    }
  };

  try {
    const res = await fetch('https://search.rcsb.org/rcsbsearch/v2/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchPayload)
    });
    if (res.ok && res.status !== 204) {
      const data = await res.json();
      for (const hit of data?.result_set ?? []) {
        const id = String(hit?.identifier ?? '').trim().toUpperCase();
        if (id && !candidateIds.includes(id)) {
          candidateIds.push(id);
        }
      }
    }
  } catch (err) {
    console.warn('RCSB PDB search failed:', err);
  }

  const idsToFetch = candidateIds.slice(0, limit);
  if (idsToFetch.length === 0) return [];

  const gqlQuery = `
    query ($ids: [String!]!) {
      entries(entry_ids: $ids) {
        rcsb_id
        struct {
          title
        }
        rcsb_entry_info {
          molecular_weight
          deposited_atom_count
        }
      }
    }
  `;

  try {
    const gqlRes = await fetch('https://data.rcsb.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gqlQuery, variables: { ids: idsToFetch } })
    });
    if (!gqlRes.ok) return idsToFetch.map((id) => ({ id, title: id }));
    const gqlData = await gqlRes.json();
    const byId = new Map<string, PdbSearchHit>();
    for (const entry of gqlData?.data?.entries ?? []) {
      if (!entry?.rcsb_id) continue;
      const id = String(entry.rcsb_id).toUpperCase();
      const mw = entry.rcsb_entry_info?.molecular_weight;
      byId.set(id, {
        id,
        title: entry.struct?.title || id,
        molecularWeight: mw != null ? `${Number(mw).toFixed(1)} kDa` : undefined,
        atomCount: entry.rcsb_entry_info?.deposited_atom_count ?? undefined
      });
    }
    return idsToFetch.map((id) => byId.get(id)).filter((x): x is PdbSearchHit => Boolean(x));
  } catch {
    return idsToFetch.map((id) => ({ id, title: id }));
  }
}

export async function searchCCDLigands(rawQuery: string, limit = 8): Promise<CcdSearchHit[]> {
  const trimmed = rawQuery.trim();
  if (!trimmed) return [];

  const candidateIds: string[] = [];
  if (/^[A-Za-z0-9]{1,5}$/.test(trimmed)) {
    candidateIds.push(trimmed.toUpperCase());
  }

  const nodes: Record<string, unknown>[] = [
    {
      type: 'terminal',
      service: 'text_chem',
      parameters: {
        attribute: 'chem_comp.name',
        operator: 'contains_words',
        value: trimmed
      }
    },
    {
      type: 'terminal',
      service: 'text_chem',
      parameters: {
        attribute: 'rcsb_chem_comp_synonyms.name',
        operator: 'contains_words',
        value: trimmed
      }
    }
  ];

  if (/^[A-Za-z0-9]{1,5}$/.test(trimmed)) {
    nodes.unshift({
      type: 'terminal',
      service: 'text_chem',
      parameters: {
        attribute: 'rcsb_chem_comp_container_identifiers.comp_id',
        operator: 'exact_match',
        value: trimmed.toUpperCase()
      }
    });
  }

  const searchPayload = {
    query: {
      type: 'group',
      logical_operator: 'or',
      nodes
    },
    return_type: 'mol_definition',
    request_options: {
      paginate: { start: 0, rows: limit }
    }
  };

  try {
    let res = await fetch('https://search.rcsb.org/rcsbsearch/v2/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchPayload)
    });

    if (!res.ok || res.status === 204) {
      res = await fetch('https://search.rcsb.org/rcsbsearch/v2/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            type: 'terminal',
            service: 'full_text',
            parameters: { value: trimmed }
          },
          return_type: 'mol_definition',
          request_options: { paginate: { start: 0, rows: limit } }
        })
      });
    }

    if (res.ok && res.status !== 204) {
      const data = await res.json();
      for (const hit of data?.result_set ?? []) {
        const id = String(hit?.identifier ?? '').trim().toUpperCase();
        // Skip BIRD PRD_* identifiers when downloading standard CCD SDF files unless standard code
        if (id && !id.startsWith('PRD_') && !candidateIds.includes(id)) {
          candidateIds.push(id);
        }
      }
    }
  } catch (err) {
    console.warn('RCSB CCD search failed:', err);
  }

  const idsToFetch = candidateIds.slice(0, limit);
  if (idsToFetch.length === 0) return [];

  const gqlQuery = `
    query ($ids: [String!]!) {
      chem_comps(comp_ids: $ids) {
        rcsb_id
        chem_comp {
          id
          name
          formula
          formula_weight
        }
      }
    }
  `;

  try {
    const gqlRes = await fetch('https://data.rcsb.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gqlQuery, variables: { ids: idsToFetch } })
    });
    if (!gqlRes.ok) return [];
    const gqlData = await gqlRes.json();
    const byId = new Map<string, CcdSearchHit>();
    for (const item of gqlData?.data?.chem_comps ?? []) {
      const id = String(item?.rcsb_id || item?.chem_comp?.id || '').toUpperCase();
      if (!id) continue;
      byId.set(id, {
        id,
        name: item?.chem_comp?.name || id,
        formula: item?.chem_comp?.formula || '',
        weight: item?.chem_comp?.formula_weight ?? undefined
      });
    }
    return idsToFetch.map((id) => byId.get(id)).filter((x): x is CcdSearchHit => Boolean(x));
  } catch {
    return [];
  }
}

function sdfHasUsable3DCoordinates(sdf: string): boolean {
  if (!sdf || (!sdf.includes('V2000') && !sdf.includes('V3000'))) return false;
  const coordLines = sdf
    .split(/\r?\n/)
    .filter((l) => /^\s*-?\d+\.\d+\s+-?\d+\.\d+\s+-?\d+\.\d+\s+[A-Za-z]{1,2}/.test(l));

  if (coordLines.length === 0) {
    return sdf.includes('M  V30 BEGIN ATOM');
  }
  if (coordLines.length === 1) return true;

  // Reject degenerate _ideal.sdf files where all coordinates are 0.000
  return coordLines.some((line) => {
    const [x, y, z] = line.trim().split(/\s+/).map(Number);
    return Math.abs(x) > 1e-4 || Math.abs(y) > 1e-4 || Math.abs(z) > 1e-4;
  });
}

export async function fetchCCDLigandData(rawCompId: string): Promise<CcdLoadedLigand> {
  const cleaned = rawCompId.replace(/^ccd:\s*/i, '').trim().toUpperCase();
  if (!/^[A-Z0-9]{1,5}$/.test(cleaned)) {
    throw new Error(`Invalid PDB ligand ID '${rawCompId}'. Use a 1–5 character CCD code (e.g. HEM, ATP, CLA).`);
  }

  const idealUrl = `https://files.rcsb.org/ligands/download/${encodeURIComponent(cleaned)}_ideal.sdf`;
  const modelUrl = `https://files.rcsb.org/ligands/download/${encodeURIComponent(cleaned)}_model.sdf`;

  const gqlQuery = `
    query ($ids: [String!]!) {
      chem_comps(comp_ids: $ids) {
        rcsb_id
        chem_comp {
          name
          formula
        }
      }
    }
  `;

  const [idealRes, gqlRes] = await Promise.all([
    fetch(idealUrl).catch(() => null),
    fetch('https://data.rcsb.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gqlQuery, variables: { ids: [cleaned] } })
    }).catch(() => null)
  ]);

  let sdf = '';
  if (idealRes && idealRes.ok) {
    const candidate = await idealRes.text();
    if (sdfHasUsable3DCoordinates(candidate)) {
      sdf = candidate;
    }
  }

  if (!sdf) {
    const modelRes = await fetch(modelUrl).catch(() => null);
    if (modelRes && modelRes.ok) {
      const candidate = await modelRes.text();
      if (sdfHasUsable3DCoordinates(candidate)) {
        sdf = candidate;
      }
    }
  }

  if (!sdf) {
    throw new Error(`3D coordinates for ligand '${cleaned}' were not found in RCSB CCD.`);
  }

  let name = cleaned;
  let formula = '';
  if (gqlRes && gqlRes.ok) {
    try {
      const gqlData = await gqlRes.json();
      const comp = gqlData?.data?.chem_comps?.[0]?.chem_comp;
      if (comp?.name) name = comp.name;
      if (comp?.formula) formula = comp.formula;
    } catch {
      // Ignore metadata parse failure
    }
  }

  return {
    id: cleaned,
    sdf,
    name,
    formula,
    imageUrl: `https://cdn.rcsb.org/images/structures/${cleaned.toLowerCase()}.svg`
  };
}

export async function fetchCactus3DSdf(rawQuery: string): Promise<CactusLoadedMolecule> {
  const cleaned = rawQuery.replace(/^(?:smiles|cactus):\s*/i, '').trim();
  if (!cleaned) {
    throw new Error('Please enter a SMILES, InChI, or IUPAC name.');
  }

  const res = await fetch(`/api/external-structure?provider=cactus&query=${encodeURIComponent(cleaned)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.sdf) {
    throw new Error(data?.error || `Could not resolve 3D structure for '${cleaned}'.`);
  }

  return {
    query: cleaned,
    sdf: data.sdf,
    iupacName: data.iupacName || undefined,
    imageUrl: `/api/external-structure?provider=cactus-image&query=${encodeURIComponent(cleaned)}`
  };
}

export async function searchCODEntries(rawQuery: string): Promise<CodSearchHit[]> {
  const trimmed = rawQuery.trim();
  if (trimmed.length < 2) return [];

  const res = await fetch(`/api/external-structure?provider=cod-search&query=${encodeURIComponent(trimmed)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'COD search failed.');
  }
  return Array.isArray(data?.results) ? data.results : [];
}

export async function fetchCODEntry(codId: string): Promise<CodLoadedEntry> {
  const trimmed = codId.replace(/^cod:\s*/i, '').trim();
  const res = await fetch(`/api/external-structure?provider=cod-cif&id=${encodeURIComponent(trimmed)}`);
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data?.cif) {
    throw new Error(data?.error || `COD entry '${trimmed}' not found.`);
  }

  const sdf = await cifToSdf(data.cif);
  return {
    id: data.id || trimmed,
    sdf,
    name: data.name || `COD Entry: ${trimmed}`,
    formula: data.formula || '',
    spaceGroup: data.spaceGroup || undefined
  };
}

export async function fetchCODSdf(codId: string): Promise<string> {
  const entry = await fetchCODEntry(codId);
  return entry.sdf;
}
