import { describe, it, expect } from 'vitest';
import {
	buildShareSearchParams,
	buildShareUrl,
	createDefaultShareState,
	hasShareSearchParams,
	inferMoleculeSourceFromQuery,
	parseShareSearchParams
} from '$lib/functions/shareUrl';
import { JOINT_PRESETS } from '$lib/geometry/jointGeometry';

describe('shareUrl serialization and parsing', () => {
	it('serializes source, molecule code/name, style, and settings in order for PubChem', () => {
		const state = createDefaultShareState('ball-and-stick');
		state.source = 'pubchem';
		state.molecule = 'aspirin';
		state.quality = 75;
		state.scale = 12.5;
		state.mult = 1.2;
		state.showHydrogens = false;
		state.bondDiameterFactor = 0.5;
		state.bondQuality = 48;
		state.groupBondsSeparately = true;
		state.uniformAtomDiameter = true;
		state.showMultipleBonds = true;

		const url = buildShareUrl('https://example.com/', state);
		const parsedUrl = new URL(url);
		const keys = Array.from(parsedUrl.searchParams.keys());

		expect(keys[0]).toBe('source');
		expect(keys[1]).toBe('mol');
		expect(keys[2]).toBe('style');
		expect(parsedUrl.searchParams.get('source')).toBe('pubchem');
		expect(parsedUrl.searchParams.get('mol')).toBe('aspirin');
		expect(parsedUrl.searchParams.get('style')).toBe('ball-and-stick');

		const restored = parseShareSearchParams(parsedUrl.searchParams);
		expect(restored.source).toBe('pubchem');
		expect(restored.molecule).toBe('aspirin');
		expect(restored.style).toBe('ball-and-stick');
		expect(restored.quality).toBe(75);
		expect(restored.scale).toBe(12.5);
		expect(restored.mult).toBe(1.2);
		expect(restored.showHydrogens).toBe(false);
		expect(restored.bondDiameterFactor).toBe(0.5);
		expect(restored.bondQuality).toBe(48);
		expect(restored.groupBondsSeparately).toBe(true);
		expect(restored.uniformAtomDiameter).toBe(true);
		expect(restored.showMultipleBonds).toBe(true);
	});

	it('shares settings only (no mol parameter) when source is custom uploaded file', () => {
		const state = createDefaultShareState('sticks');
		state.source = 'file';
		state.molecule = 'should_not_be_included.sdf';
		state.quality = 60;
		state.scale = 15;
		state.mult = 1.4;

		const params = buildShareSearchParams(state);
		expect(params.get('source')).toBe('file');
		expect(params.has('mol')).toBe(false);
		expect(params.get('style')).toBe('sticks');

		const restored = parseShareSearchParams(params);
		expect(restored.source).toBe('file');
		expect(restored.molecule).toBe('');
		expect(restored.style).toBe('sticks');
		expect(restored.quality).toBe(60);
		expect(restored.scale).toBe(15);
		expect(restored.mult).toBe(1.4);
	});

	it('round-trips PDB and COD molecule sources', () => {
		const pdbState = createDefaultShareState('minecraft');
		pdbState.source = 'pdb';
		pdbState.molecule = '1CRN';
		pdbState.scale = 8;

		const pdbRestored = parseShareSearchParams(buildShareSearchParams(pdbState));
		expect(pdbRestored.source).toBe('pdb');
		expect(pdbRestored.molecule).toBe('1CRN');
		expect(pdbRestored.style).toBe('minecraft');
		expect(pdbRestored.scale).toBe(8);

		const codState = createDefaultShareState('spheres');
		codState.source = 'cod';
		codState.molecule = '1506182';

		const codRestored = parseShareSearchParams(buildShareSearchParams(codState));
		expect(codRestored.source).toBe('cod');
		expect(codRestored.molecule).toBe('1506182');
		expect(codRestored.style).toBe('spheres');
	});

	it('round-trips ball-and-stick-moving-joints including customized advanced joint params', () => {
		const state = createDefaultShareState('ball-and-stick-moving-joints');
		state.source = 'pubchem';
		state.molecule = '2244';
		state.jointPreset = 'sla';
		state.jointParams = {
			...JOINT_PRESETS.sla,
			c: 0.18,
			R: 3.4,
			neck: 1.9,
			radialSegments: 64
		};
		state.jointPreferT = 0.65;
		state.jointSkipTerminal = false;
		state.jointsInRings = false;

		const params = buildShareSearchParams(state);
		expect(params.get('jointPreset')).toBe('sla');
		expect(params.get('jointR')).toBe('3.4');
		expect(params.has('jointRs')).toBe(false); // unchanged from SLA preset

		const restored = parseShareSearchParams(params);
		expect(restored.style).toBe('ball-and-stick-moving-joints');
		expect(restored.scale).toBe(20);
		expect(restored.jointPreset).toBe('sla');
		expect(restored.jointParams.c).toBe(0.18);
		expect(restored.jointParams.R).toBe(3.4);
		expect(restored.jointParams.neck).toBe(1.9);
		expect(restored.jointParams.rs).toBe(JOINT_PRESETS.sla.rs);
		expect(restored.jointParams.radialSegments).toBe(64);
		expect(restored.jointPreferT).toBe(0.65);
		expect(restored.jointSkipTerminal).toBe(false);
		expect(restored.jointsInRings).toBe(false);
	});

	it('round-trips spheres-glued in both radical (with peg holes) and priority modes', () => {
		const radical = createDefaultShareState('spheres-glued');
		radical.source = 'pubchem';
		radical.molecule = 'water';
		radical.gluedMode = 'radical';
		radical.gluedExportMode = 'plate';
		radical.gluedGap = 0.08;
		radical.gluedPlateSpacing = 4.5;
		radical.gluedMergeSameElement = false;
		radical.gluedPegHolesEnabled = true;
		radical.gluedPegHoleDiameter = 2.05;
		radical.gluedPegHoleDepth = 4.0;
		radical.gluedExplodedPercent = 35;
		radical.gluedShowPartLabels = true;

		const restoredRadical = parseShareSearchParams(buildShareSearchParams(radical));
		expect(restoredRadical.gluedMode).toBe('radical');
		expect(restoredRadical.gluedExportMode).toBe('plate');
		expect(restoredRadical.gluedGap).toBe(0.08);
		expect(restoredRadical.gluedPlateSpacing).toBe(4.5);
		expect(restoredRadical.gluedMergeSameElement).toBe(false);
		expect(restoredRadical.gluedPegHolesEnabled).toBe(true);
		expect(restoredRadical.gluedPegHoleDiameter).toBe(2.05);
		expect(restoredRadical.gluedPegHoleDepth).toBe(4);
		expect(restoredRadical.gluedExplodedPercent).toBe(35);
		expect(restoredRadical.gluedShowPartLabels).toBe(true);

		const priority = createDefaultShareState('spheres-glued');
		priority.source = 'file';
		priority.gluedMode = 'priority';
		priority.gluedPriorityOrder = ['O', 'N', 'C', 'H'];

		const restoredPriority = parseShareSearchParams(buildShareSearchParams(priority));
		expect(restoredPriority.source).toBe('file');
		expect(restoredPriority.gluedMode).toBe('priority');
		expect(restoredPriority.gluedPriorityOrder).toEqual(['O', 'N', 'C', 'H']);
	});

	it('correctly distinguishes 4-digit PubChem CIDs from 4-char PDB codes and detects share params', () => {
		expect(inferMoleculeSourceFromQuery('2244')).toBe('pubchem');
		expect(inferMoleculeSourceFromQuery('1CRN')).toBe('pdb');
		expect(inferMoleculeSourceFromQuery('4hhb')).toBe('pdb');
		expect(inferMoleculeSourceFromQuery('4HHB:A')).toBe('pdb');
		expect(inferMoleculeSourceFromQuery('ccd: HEM')).toBe('ccd');
		expect(inferMoleculeSourceFromQuery('smiles: C1CCCCC1')).toBe('cactus');
		expect(inferMoleculeSourceFromQuery('cod: 1506182')).toBe('cod');
		expect(inferMoleculeSourceFromQuery('caffeine')).toBe('pubchem');
		expect(inferMoleculeSourceFromQuery('H2SO4')).toBe('pubchem');
		expect(inferMoleculeSourceFromQuery('conformer:000008C40000000B')).toBe('pubchem');
		expect(inferMoleculeSourceFromQuery('CC(=O)OC1=CC=CC=C1C(=O)O')).toBe('cactus');

		const ccdState = createDefaultShareState('ball-and-stick');
		ccdState.source = 'ccd';
		ccdState.molecule = 'HEM';
		const restoredCcd = parseShareSearchParams(buildShareSearchParams(ccdState));
		expect(restoredCcd.source).toBe('ccd');
		expect(restoredCcd.molecule).toBe('HEM');

		const cactusState = createDefaultShareState('ball-and-stick');
		cactusState.source = 'cactus';
		cactusState.molecule = 'C12C3C4C1C5C2C3C45';
		const restoredCactus = parseShareSearchParams(buildShareSearchParams(cactusState));
		expect(restoredCactus.source).toBe('cactus');
		expect(restoredCactus.molecule).toBe('C12C3C4C1C5C2C3C45');

		expect(hasShareSearchParams(new URLSearchParams(''))).toBe(false);
		expect(hasShareSearchParams(new URLSearchParams('utm_source=test'))).toBe(false);
		expect(hasShareSearchParams(new URLSearchParams('source=file&style=spheres'))).toBe(true);
	});
});
