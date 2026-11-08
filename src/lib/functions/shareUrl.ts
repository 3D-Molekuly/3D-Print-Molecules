import { JOINT_PRESETS, type JointParams } from '$lib/geometry/jointGeometry';
import type {
	GluedSpheresExportMode,
	GluedSpheresMode,
	JointPresetId,
	ModelStyleId,
	MoleculeSource
} from '$lib/types';
import { looksLikeSmiles } from '$lib/molecules/queryDetection';

export interface ShareState {
	source: MoleculeSource | null;
	/** Code or name of the molecule on the source (unused when source === 'file' or null). */
	molecule: string;
	style: ModelStyleId;

	// Common settings
	quality: number;
	scale: number;
	mult: number;
	showHydrogens: boolean;

	// Ball-and-Stick & Moving Joints settings
	bondDiameterFactor: number;
	bondQuality: number;
	groupBondsSeparately: boolean;
	uniformAtomDiameter: boolean;
	showMultipleBonds: boolean;

	// Moving Joints settings
	jointPreset: JointPresetId;
	jointParams: JointParams;
	jointPreferT: number;
	jointSkipTerminal: boolean;
	jointsInRings: boolean;

	// Glued Spheres settings
	gluedMode: GluedSpheresMode;
	gluedExportMode: GluedSpheresExportMode;
	gluedPriorityOrder: string[];
	gluedGap: number;
	gluedPlateSpacing: number;
	gluedMergeSameElement: boolean;
	gluedPegHolesEnabled: boolean;
	gluedPegHoleDiameter: number;
	gluedPegHoleDepth: number;
	gluedExplodedPercent: number;
	gluedShowPartLabels: boolean;
}

const VALID_STYLES: readonly ModelStyleId[] = [
	'spheres',
	'spheres-glued',
	'ball-and-stick',
	'ball-and-stick-moving-joints',
	'sticks',
	'minecraft'
];

const SHARE_PARAM_KEYS = [
	'source',
	'src',
	'mol',
	'q',
	'style',
	'type',
	'quality',
	'scale',
	'mult',
	'hydrogens',
	'bondDia',
	'bondQuality',
	'groupBonds',
	'uniformAtoms',
	'multiBonds',
	'jointPreset',
	'jointC',
	'jointPreferT',
	'jointSkipTerm',
	'jointsInRings',
	'jointR',
	'jointRs',
	'jointRh',
	'jointNeck',
	'jointWall',
	'jointTopLen',
	'jointRadSeg',
	'jointArcSeg',
	'gluedMode',
	'gluedExport',
	'gluedPriority',
	'gluedGap',
	'gluedSpacing',
	'gluedMerge',
	'gluedPegs',
	'gluedPegDia',
	'gluedPegDepth',
	'gluedExploded',
	'gluedLabels'
] as const;

function formatNum(value: number): string {
	if (!Number.isFinite(value)) return '0';
	return String(Number(value.toFixed(4)));
}

function differs(a: number, b: number): boolean {
	return Math.abs(a - b) > 1e-6;
}

function parseBoolParam(raw: string | null, fallback: boolean): boolean {
	if (raw === null) return fallback;
	const normalized = raw.trim().toLowerCase();
	if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true;
	if (normalized === '0' || normalized === 'false' || normalized === 'no') return false;
	return fallback;
}

function parseFloatClamped(
	raw: string | null,
	fallback: number,
	min: number,
	max: number
): number {
	if (raw === null || raw.trim() === '') return fallback;
	const parsed = Number(raw);
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(max, Math.max(min, parsed));
}

function parseIntClamped(
	raw: string | null,
	fallback: number,
	min: number,
	max: number
): number {
	if (raw === null || raw.trim() === '') return fallback;
	const parsed = Math.round(Number(raw));
	if (!Number.isFinite(parsed)) return fallback;
	return Math.min(max, Math.max(min, parsed));
}

export function createDefaultShareState(style: ModelStyleId = 'spheres'): ShareState {
	const defaultPreset: JointPresetId = 'fdm';
	return {
		source: null,
		molecule: '',
		style,
		quality: 50,
		scale: style === 'ball-and-stick-moving-joints' ? 20 : 10,
		mult: 1.0,
		showHydrogens: true,
		bondDiameterFactor: 0.4,
		bondQuality: 32,
		groupBondsSeparately: false,
		uniformAtomDiameter: false,
		showMultipleBonds: false,
		jointPreset: defaultPreset,
		jointParams: { ...JOINT_PRESETS[defaultPreset] },
		jointPreferT: 0.5,
		jointSkipTerminal: true,
		jointsInRings: true,
		gluedMode: 'radical',
		gluedExportMode: 'assembled',
		gluedPriorityOrder: ['C', 'N', 'O', 'H'],
		gluedGap: 0,
		gluedPlateSpacing: 3.0,
		gluedMergeSameElement: true,
		gluedPegHolesEnabled: false,
		gluedPegHoleDiameter: 1.9,
		gluedPegHoleDepth: 3.0,
		gluedExplodedPercent: 0,
		gluedShowPartLabels: false
	};
}

export function hasShareSearchParams(searchParams: URLSearchParams): boolean {
	return SHARE_PARAM_KEYS.some((key) => searchParams.has(key));
}

const SHAREABLE_MOLECULE_SOURCES: readonly Exclude<MoleculeSource, 'file'>[] = [
	'pubchem',
	'pdb',
	'ccd',
	'cactus',
	'cod'
];

export function inferMoleculeSourceFromQuery(
	query: string
): Exclude<MoleculeSource, 'file'> {
	const trimmed = query.trim();
	if (/^cod:\s*.+$/i.test(trimmed)) return 'cod';
	if (/^ccd:\s*.+$/i.test(trimmed)) return 'ccd';
	if (/^(?:smiles|cactus):\s*.+$/i.test(trimmed)) return 'cactus';
	if (/^pdb:\s*.+$/i.test(trimmed)) return 'pdb';
	if (/^(?:conformer|formula):\s*.+$/i.test(trimmed)) return 'pubchem';
	// Pasted SMILES (e.g. ChemDraw "Copy As > SMILES") go to the SMILES -> 3D service
	if (looksLikeSmiles(trimmed)) return 'cactus';
	if (/(?=.*[a-zA-Z])^[1-9][a-zA-Z0-9]{3}(?::[a-zA-Z0-9]+)?$/.test(trimmed)) {
		return 'pdb';
	}
	return 'pubchem';
}

export function buildShareSearchParams(state: ShareState): URLSearchParams {
	const params = new URLSearchParams();

	// 1. Molecule search source & code/name (if custom file, share settings only)
	const trimmedMol = state.molecule.trim();
	if (
		state.source !== null &&
		state.source !== 'file' &&
		(SHAREABLE_MOLECULE_SOURCES as readonly string[]).includes(state.source) &&
		trimmedMol.length > 0
	) {
		params.set('source', state.source);
		params.set('mol', trimmedMol);
	} else {
		params.set('source', 'file');
	}

	// 2. Display style
	params.set('style', state.style);

	// 3. Configured parameter values
	params.set('quality', formatNum(state.quality));
	params.set('scale', formatNum(state.scale));
	params.set('mult', formatNum(state.mult));
	params.set('hydrogens', state.showHydrogens ? '1' : '0');

	const isBallAndStick =
		state.style === 'ball-and-stick' || state.style === 'ball-and-stick-moving-joints';
	const isMovingJoints = state.style === 'ball-and-stick-moving-joints';
	const isGluedSpheres = state.style === 'spheres-glued';

	if (isBallAndStick) {
		params.set('bondDia', formatNum(state.bondDiameterFactor));
		params.set('bondQuality', formatNum(state.bondQuality));
		params.set('groupBonds', state.groupBondsSeparately ? '1' : '0');
		params.set('uniformAtoms', state.uniformAtomDiameter ? '1' : '0');
		params.set('multiBonds', state.showMultipleBonds ? '1' : '0');
	}

	if (isMovingJoints) {
		const presetDefaults = JOINT_PRESETS[state.jointPreset];
		params.set('jointPreset', state.jointPreset);
		params.set('jointC', formatNum(state.jointParams.c));
		params.set('jointPreferT', formatNum(state.jointPreferT));
		params.set('jointSkipTerm', state.jointSkipTerminal ? '1' : '0');
		params.set('jointsInRings', state.jointsInRings ? '1' : '0');

		if (differs(state.jointParams.R, presetDefaults.R)) {
			params.set('jointR', formatNum(state.jointParams.R));
		}
		if (differs(state.jointParams.rs, presetDefaults.rs)) {
			params.set('jointRs', formatNum(state.jointParams.rs));
		}
		if (differs(state.jointParams.rh, presetDefaults.rh)) {
			params.set('jointRh', formatNum(state.jointParams.rh));
		}
		if (differs(state.jointParams.neck, presetDefaults.neck)) {
			params.set('jointNeck', formatNum(state.jointParams.neck));
		}
		if (differs(state.jointParams.wall, presetDefaults.wall)) {
			params.set('jointWall', formatNum(state.jointParams.wall));
		}
		if (differs(state.jointParams.topLen, presetDefaults.topLen)) {
			params.set('jointTopLen', formatNum(state.jointParams.topLen));
		}
		if (differs(state.jointParams.radialSegments, presetDefaults.radialSegments)) {
			params.set('jointRadSeg', formatNum(state.jointParams.radialSegments));
		}
		if (differs(state.jointParams.arcSegments, presetDefaults.arcSegments)) {
			params.set('jointArcSeg', formatNum(state.jointParams.arcSegments));
		}
	}

	if (isGluedSpheres) {
		params.set('uniformAtoms', state.uniformAtomDiameter ? '1' : '0');
		params.set('gluedMode', state.gluedMode);
		params.set('gluedExport', state.gluedExportMode);
		if (state.gluedMode === 'priority' && state.gluedPriorityOrder.length > 0) {
			params.set('gluedPriority', state.gluedPriorityOrder.join(','));
		}
		params.set('gluedGap', formatNum(state.gluedGap));
		params.set('gluedSpacing', formatNum(state.gluedPlateSpacing));
		params.set('gluedMerge', state.gluedMergeSameElement ? '1' : '0');
		if (state.gluedMode === 'radical') {
			params.set('gluedPegs', state.gluedPegHolesEnabled ? '1' : '0');
			if (state.gluedPegHolesEnabled) {
				params.set('gluedPegDia', formatNum(state.gluedPegHoleDiameter));
				params.set('gluedPegDepth', formatNum(state.gluedPegHoleDepth));
			}
		}
		params.set('gluedExploded', formatNum(state.gluedExplodedPercent));
		params.set('gluedLabels', state.gluedShowPartLabels ? '1' : '0');
	}

	return params;
}

export function buildShareUrl(baseUrl: string, state: ShareState): string {
	const url = new URL(baseUrl);
	const params = buildShareSearchParams(state);
	url.search = params.toString();
	return url.toString();
}

export function parseShareSearchParams(searchParams: URLSearchParams): ShareState {
	const rawStyle = (searchParams.get('style') ?? searchParams.get('type') ?? '').trim().toLowerCase();
	const style: ModelStyleId = (VALID_STYLES as readonly string[]).includes(rawStyle)
		? (rawStyle as ModelStyleId)
		: 'spheres';

	const state = createDefaultShareState(style);

	const rawSource = (searchParams.get('source') ?? searchParams.get('src') ?? '')
		.trim()
		.toLowerCase();
	const rawMol = (searchParams.get('mol') ?? searchParams.get('q') ?? '').trim();

	if (rawSource === 'file') {
		state.source = 'file';
		state.molecule = '';
	} else if (rawSource === 'smiles') {
		state.source = rawMol ? 'cactus' : 'file';
		state.molecule = rawMol;
	} else if (
		rawSource === 'pubchem' ||
		rawSource === 'pdb' ||
		rawSource === 'ccd' ||
		rawSource === 'cactus' ||
		rawSource === 'cod'
	) {
		state.source = rawMol ? rawSource : 'file';
		state.molecule = rawMol;
	} else if (rawMol) {
		state.source = inferMoleculeSourceFromQuery(rawMol);
		state.molecule = rawMol;
	} else {
		state.source = null;
		state.molecule = '';
	}

	state.quality = parseIntClamped(searchParams.get('quality'), state.quality, 0, 100);
	state.scale = parseFloatClamped(searchParams.get('scale'), state.scale, 0.5, 200);
	state.mult = parseFloatClamped(searchParams.get('mult'), state.mult, 0.1, 20);
	state.showHydrogens = parseBoolParam(searchParams.get('hydrogens'), state.showHydrogens);

	state.bondDiameterFactor = parseFloatClamped(
		searchParams.get('bondDia'),
		state.bondDiameterFactor,
		0.05,
		10
	);
	state.bondQuality = parseIntClamped(searchParams.get('bondQuality'), state.bondQuality, 3, 256);
	state.groupBondsSeparately = parseBoolParam(
		searchParams.get('groupBonds'),
		state.groupBondsSeparately
	);
	state.uniformAtomDiameter = parseBoolParam(
		searchParams.get('uniformAtoms'),
		state.uniformAtomDiameter
	);
	state.showMultipleBonds = parseBoolParam(
		searchParams.get('multiBonds'),
		state.showMultipleBonds
	);

	const rawPreset = (searchParams.get('jointPreset') ?? '').trim().toLowerCase();
	const preset: JointPresetId = rawPreset === 'sla' ? 'sla' : 'fdm';
	state.jointPreset = preset;
	const baseJointParams: JointParams = { ...JOINT_PRESETS[preset] };
	baseJointParams.c = parseFloatClamped(searchParams.get('jointC'), baseJointParams.c, 0.05, 2.0);
	baseJointParams.R = parseFloatClamped(searchParams.get('jointR'), baseJointParams.R, 0.5, 50);
	baseJointParams.rs = parseFloatClamped(searchParams.get('jointRs'), baseJointParams.rs, 0.2, 30);
	baseJointParams.rh = parseFloatClamped(searchParams.get('jointRh'), baseJointParams.rh, 0.3, 40);
	baseJointParams.neck = parseFloatClamped(
		searchParams.get('jointNeck'),
		baseJointParams.neck,
		0.2,
		30
	);
	baseJointParams.wall = parseFloatClamped(
		searchParams.get('jointWall'),
		baseJointParams.wall,
		0.2,
		20
	);
	baseJointParams.topLen = parseFloatClamped(
		searchParams.get('jointTopLen'),
		baseJointParams.topLen,
		0.1,
		30
	);
	baseJointParams.radialSegments = parseIntClamped(
		searchParams.get('jointRadSeg'),
		baseJointParams.radialSegments,
		8,
		256
	);
	baseJointParams.arcSegments = parseIntClamped(
		searchParams.get('jointArcSeg'),
		baseJointParams.arcSegments,
		1,
		64
	);
	state.jointParams = baseJointParams;
	state.jointPreferT = parseFloatClamped(
		searchParams.get('jointPreferT'),
		state.jointPreferT,
		0,
		1
	);
	state.jointSkipTerminal = parseBoolParam(
		searchParams.get('jointSkipTerm'),
		state.jointSkipTerminal
	);
	state.jointsInRings = parseBoolParam(
		searchParams.get('jointsInRings'),
		state.jointsInRings
	);

	const rawGluedMode = (searchParams.get('gluedMode') ?? '').trim().toLowerCase();
	if (rawGluedMode === 'radical' || rawGluedMode === 'priority') {
		state.gluedMode = rawGluedMode;
	}
	const rawGluedExport = (searchParams.get('gluedExport') ?? '').trim().toLowerCase();
	if (rawGluedExport === 'assembled' || rawGluedExport === 'plate') {
		state.gluedExportMode = rawGluedExport;
	}
	const rawPriority = searchParams.get('gluedPriority');
	if (rawPriority) {
		const parsedOrder = rawPriority
			.split(',')
			.map((s) => s.trim())
			.filter((s) => /^[A-Z][a-z]?$/.test(s));
		const uniqueOrder = Array.from(new Set(parsedOrder));
		if (uniqueOrder.length > 0) {
			state.gluedPriorityOrder = uniqueOrder;
		}
	}
	state.gluedGap = parseFloatClamped(searchParams.get('gluedGap'), state.gluedGap, 0, 0.3);
	state.gluedPlateSpacing = parseFloatClamped(
		searchParams.get('gluedSpacing'),
		state.gluedPlateSpacing,
		0,
		100
	);
	state.gluedMergeSameElement = parseBoolParam(
		searchParams.get('gluedMerge'),
		state.gluedMergeSameElement
	);
	state.gluedPegHolesEnabled = parseBoolParam(
		searchParams.get('gluedPegs'),
		state.gluedPegHolesEnabled
	);
	state.gluedPegHoleDiameter = parseFloatClamped(
		searchParams.get('gluedPegDia'),
		state.gluedPegHoleDiameter,
		0.5,
		20
	);
	state.gluedPegHoleDepth = parseFloatClamped(
		searchParams.get('gluedPegDepth'),
		state.gluedPegHoleDepth,
		0.5,
		50
	);
	state.gluedExplodedPercent = parseIntClamped(
		searchParams.get('gluedExploded'),
		state.gluedExplodedPercent,
		0,
		100
	);
	state.gluedShowPartLabels = parseBoolParam(
		searchParams.get('gluedLabels'),
		state.gluedShowPartLabels
	);

	return state;
}
