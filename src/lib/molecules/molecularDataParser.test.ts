import { describe, it, expect } from 'vitest';
import { parsePDB, parseSDF, computeMolecularFormula } from '$lib/molecules/molecularDataParser';
import { parsePdbQuerySpec, formatPdbQuerySpec } from '$lib/molecules/inputs';

describe('molecularDataParser (PDB, SDF V2000/V3000, formulas)', () => {
	it('parses standard PDB ATOM + HETATM lines, 2-letter elements, covalent bonds, chain filter, and water filter', async () => {
		const samplePdb = [
			'MODEL        1',
			'ATOM      1  N   ALA A   1       0.000   0.000   0.000  1.00 10.00           N  ',
			'ATOM      2  CA  ALA A   1       1.458   0.000   0.000  1.00 10.00           C  ',
			'ATOM      3  CA  ALA B   1      10.000   0.000   0.000  1.00 10.00           C  ',
			'HETATM    4 FE   HEM A 100       5.000   5.000   5.000  1.00 12.00          FE  ',
			'HETATM    5  O   HOH A 201      20.000  20.000  20.000  1.00 30.00           O  ',
			'ENDMDL',
			'MODEL        2',
			'ATOM      6  N   ALA A   1       0.100   0.100   0.100  1.00 10.00           N  ',
			'ENDMDL'
		].join('\n');

		// Default: skips Model 2 and HOH crystal water
		const allChainsNoWater = await parsePDB(samplePdb);
		expect(allChainsNoWater).toHaveLength(4);
		expect(allChainsNoWater.map((a) => a.atomType)).toEqual(['N', 'C', 'C', 'Fe']);
		// N (id 1) and CA (id 2) in chain A are 1.458 Å apart -> covalently bonded
		expect(allChainsNoWater[0].bonds?.some((b) => b.atomId === 2)).toBe(true);
		expect(allChainsNoWater[1].bonds?.some((b) => b.atomId === 1)).toBe(true);

		// Chain A filter + includeWaters
		const chainAWithWater = await parsePDB(samplePdb, { chainId: 'A', includeWaters: true });
		expect(chainAWithWater).toHaveLength(4);
		expect(chainAWithWater.map((a) => a.atomType)).toEqual(['N', 'C', 'Fe', 'O']);
	});

	it('parses V3000 SDF molblocks and computes Hill molecular formula', async () => {
		const v3000Sdf = [
			'Water V3000',
			'  RDKit          3D',
			'',
			'  0  0  0  0  0  0  0  0  0  0999 V3000',
			'M  V30 BEGIN CTAB',
			'M  V30 COUNTS 3 2 0 0 0',
			'M  V30 BEGIN ATOM',
			'M  V30 1 O 0.0000 0.0000 0.1173 0',
			'M  V30 2 H 0.0000 0.7572 -0.4692 0',
			'M  V30 3 H 0.0000 -0.7572 -0.4692 0',
			'M  V30 END ATOM',
			'M  V30 BEGIN BOND',
			'M  V30 1 1 1 2',
			'M  V30 2 1 1 3',
			'M  V30 END BOND',
			'M  V30 END CTAB',
			'M  END',
			'$$$$'
		].join('\n');

		const atoms = await parseSDF(v3000Sdf);
		expect(atoms).toHaveLength(3);
		expect(atoms[0].bonds).toHaveLength(2);
		expect(computeMolecularFormula(atoms)).toBe('H2O');
	});

	it('parses and formats PDB query specifications with chain and water flags', () => {
		expect(parsePdbQuerySpec('4hhb:A')).toEqual({
			pdbId: '4HHB',
			chainId: 'A',
			includeWaters: false
		});
		expect(parsePdbQuerySpec('pdb: 1crn+w')).toEqual({
			pdbId: '1CRN',
			chainId: undefined,
			includeWaters: true
		});
		expect(formatPdbQuerySpec('4hhb', 'B', true)).toBe('4HHB:B+w');
	});
});
