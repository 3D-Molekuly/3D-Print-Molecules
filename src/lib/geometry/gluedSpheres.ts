import * as THREE from 'three';
import type { ManifoldToplevel, Manifold, Mat4, Vec3 } from 'manifold-3d';
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
import type {
	AtomWithBonds,
	GluedSpheresConfig,
	GluedSpheresStats
} from '$lib/types';

export const LARGE_MOLECULE_ATOM_THRESHOLD = 2000;
export const SPATIAL_GRID_ATOM_THRESHOLD = 500;
export const SMALL_PART_SIZE_THRESHOLD_MM = 2.0;

/**
 * Fallback periodic table radii (in pm, from static/periodic_table.json) and CPK colors,
 * used when AtomCoordinate does not have AtomicRadius / CPKHexColor pre-populated.
 * Base radius in Å in this app is (pm / 150).
 */
const ELEMENT_DATA_FALLBACK: Record<string, { pm: number; color: string }> = {
	H: { pm: 120, color: '#FFFFFF' },
	He: { pm: 140, color: '#D9FFFF' },
	Li: { pm: 182, color: '#CC80FF' },
	Be: { pm: 153, color: '#C2FF00' },
	B: { pm: 192, color: '#FFB5B5' },
	C: { pm: 170, color: '#909090' },
	N: { pm: 155, color: '#3050F8' },
	O: { pm: 152, color: '#FF0D0D' },
	F: { pm: 147, color: '#90E050' },
	Ne: { pm: 154, color: '#B3E3F5' },
	Na: { pm: 227, color: '#AB5CF2' },
	Mg: { pm: 173, color: '#8AFF00' },
	Al: { pm: 184, color: '#BFA6A6' },
	Si: { pm: 210, color: '#F0C8A0' },
	P: { pm: 180, color: '#FF8000' },
	S: { pm: 180, color: '#FFFF30' },
	Cl: { pm: 175, color: '#1FF01F' },
	Ar: { pm: 188, color: '#80D1E3' },
	K: { pm: 275, color: '#8F40D4' },
	Ca: { pm: 231, color: '#3DFF00' },
	Fe: { pm: 194, color: '#E06633' },
	Cu: { pm: 140, color: '#C88033' },
	Zn: { pm: 139, color: '#7D80B0' },
	Br: { pm: 185, color: '#A62929' },
	I: { pm: 198, color: '#940094' }
};

let manifoldModulePromise: Promise<ManifoldToplevel> | null = null;

/**
 * Lazily loads and initializes the `manifold-3d` WASM module.
 * Safe for SSR (never imported at module evaluation time on the server).
 */
export async function getManifoldModule(): Promise<ManifoldToplevel> {
	if (!manifoldModulePromise) {
		manifoldModulePromise = (async () => {
			const Module = (await import('manifold-3d')).default;
			const isNode =
				typeof process !== 'undefined' &&
				Boolean(process.versions && process.versions.node);

			let wasm: ManifoldToplevel;
			if (isNode) {
				wasm = await Module();
			} else {
				const wasmUrlMod = await import('manifold-3d/manifold.wasm?url');
				wasm = await Module({
					locateFile: () => wasmUrlMod.default
				});
			}
			wasm.setup();
			return wasm;
		})();
	}
	return manifoldModulePromise;
}

/**
 * Returns the base radius of an atom in scene units (Å) before multiplicationFactor and mmPerUnit.
 * Matches existing Spheres representation in threejsMolecules3.ts.
 */
export function getSphereAtomBaseRadius(
	atom: AtomCoordinate,
	uniformAtomDiameter?: boolean
): number {
	if (uniformAtomDiameter) {
		return 0.6;
	}
	if (atom.AtomicRadius) {
		const parsed = parseFloat(atom.AtomicRadius);
		if (!isNaN(parsed) && parsed > 0) {
			return parsed;
		}
	}
	const fallback = ELEMENT_DATA_FALLBACK[atom.atomType];
	if (fallback) {
		return fallback.pm / 150;
	}
	return 0.5;
}

export function getAtomCPKColorHex(atom: AtomCoordinate): string {
	if (atom.CPKHexColor && atom.CPKHexColor.trim() !== '') {
		return atom.CPKHexColor.startsWith('#') ? atom.CPKHexColor : `#${atom.CPKHexColor}`;
	}
	return ELEMENT_DATA_FALLBACK[atom.atomType]?.color ?? '#808080';
}

/**
 * Returns default element priority order sorted by atomic radius descending (e.g. C > N > O > H).
 */
export function getDefaultPriorityOrder(elements: string[]): string[] {
	const unique = Array.from(new Set(elements));
	return unique.sort((a, b) => {
		const rA = ELEMENT_DATA_FALLBACK[a]?.pm ?? 150;
		const rB = ELEMENT_DATA_FALLBACK[b]?.pm ?? 150;
		if (rB !== rA) return rB - rA;
		return a.localeCompare(b);
	});
}

export interface GluedAtomInput {
	/** 1-based atom index from input */
	id: number;
	/** Element symbol, e.g. 'C', 'O', 'H' */
	atomType: string;
	/** Part name `<Element>_<id>`, e.g. `C_12` */
	partName: string;
	/** Centered position in mm */
	centerMm: [number, number, number];
	/** Sphere radius in mm */
	radiusMm: number;
	/** Color in hex format `#RRGGBB` */
	colorHex: string;
}

export type RadicalPlaneClassification =
	| 'duplicate'
	| 'disjoint'
	| 'no-cut'
	| 'swallowed'
	| 'cut';

export interface RadicalPlaneResult {
	classification: RadicalPlaneClassification;
	/** Distance between centers |c_j - c_i| in mm */
	d: number;
	/** Unit normal (c_j - c_i) / d pointing from i to j */
	normal: [number, number, number];
	/** Signed distance of radical plane from c_i along normal: (d^2 + r_i^2 - r_j^2) / (2d) */
	h: number;
	/** Signed distance of radical plane from c_j along -normal: (d^2 + r_j^2 - r_i^2) / (2d) */
	hOpposite: number;
	/** Effective distance from c_i after applying gap/2: h - gap/2 */
	hEffective: number;
	/** Radius of intersection circle a = sqrt(max(0, r_i^2 - h^2)) */
	cutCircleRadius: number;
	/** Normal to pass to Manifold.trimByPlane (points into kept half-space: -normal) */
	trimNormal: [number, number, number];
	/** Origin offset to pass to Manifold.trimByPlane in local atom coordinates: -(h - gap/2) */
	trimOffset: number;
}

/**
 * Computes the radical plane parameters for atom i (center c_i, radius r_i)
 * against neighbor j (center c_j, radius r_j), all in mm.
 *
 * Atom i keeps points p satisfying (p - c_i) · n <= h - gap/2.
 * Because Manifold.trimByPlane(normal, originOffset) keeps points satisfying
 * p · normal >= originOffset, we pass normal = -n and originOffset = -(h - gap/2).
 */
export function computeRadicalPlane(
	ci: Readonly<[number, number, number]>,
	ri: number,
	cj: Readonly<[number, number, number]>,
	rj: number,
	gap = 0
): RadicalPlaneResult {
	const dx = cj[0] - ci[0];
	const dy = cj[1] - ci[1];
	const dz = cj[2] - ci[2];
	const d = Math.hypot(dx, dy, dz);

	if (d < 1e-6) {
		return {
			classification: 'duplicate',
			d,
			normal: [0, 0, 1],
			h: 0,
			hOpposite: 0,
			hEffective: 0,
			cutCircleRadius: 0,
			trimNormal: [0, 0, -1],
			trimOffset: 0
		};
	}

	const nx = dx / d;
	const ny = dy / d;
	const nz = dz / d;

	if (d >= ri + rj) {
		const h = (d * d + ri * ri - rj * rj) / (2 * d);
		const hOpposite = (d * d + rj * rj - ri * ri) / (2 * d);
		return {
			classification: 'disjoint',
			d,
			normal: [nx, ny, nz],
			h,
			hOpposite,
			hEffective: h - gap / 2,
			cutCircleRadius: 0,
			trimNormal: [-nx, -ny, -nz],
			trimOffset: -(h - gap / 2)
		};
	}

	const h = (d * d + ri * ri - rj * rj) / (2 * d);
	const hOpposite = (d * d + rj * rj - ri * ri) / (2 * d);
	const hEffective = h - gap / 2;

	if (h >= ri) {
		return {
			classification: 'no-cut',
			d,
			normal: [nx, ny, nz],
			h,
			hOpposite,
			hEffective,
			cutCircleRadius: 0,
			trimNormal: [-nx, -ny, -nz],
			trimOffset: -hEffective
		};
	}

	if (h <= -ri || hEffective <= -ri) {
		return {
			classification: 'swallowed',
			d,
			normal: [nx, ny, nz],
			h,
			hOpposite,
			hEffective,
			cutCircleRadius: 0,
			trimNormal: [-nx, -ny, -nz],
			trimOffset: -hEffective
		};
	}

	const cutCircleRadius = Math.sqrt(Math.max(0, ri * ri - h * h));
	return {
		classification: 'cut',
		d,
		normal: [nx, ny, nz],
		h,
		hOpposite,
		hEffective,
		cutCircleRadius,
		trimNormal: [-nx, -ny, -nz],
		trimOffset: -hEffective
	};
}

/**
 * Analytical volume of the union of two spheres with radii r1, r2 at center distance d.
 */
export function analyticalTwoSpheresUnionVolume(r1: number, r2: number, d: number): number {
	const v1 = (4 / 3) * Math.PI * r1 * r1 * r1;
	const v2 = (4 / 3) * Math.PI * r2 * r2 * r2;
	if (d >= r1 + r2) {
		return v1 + v2;
	}
	if (d <= Math.abs(r1 - r2)) {
		const rMax = Math.max(r1, r2);
		return (4 / 3) * Math.PI * rMax * rMax * rMax;
	}
	const h1 = (d * d + r1 * r1 - r2 * r2) / (2 * d);
	const h2 = (d * d + r2 * r2 - r1 * r1) / (2 * d);
	const cap1Height = r1 - h1;
	const cap2Height = r2 - h2;
	const cap1Vol = (Math.PI * cap1Height * cap1Height * (3 * r1 - cap1Height)) / 3;
	const cap2Vol = (Math.PI * cap2Height * cap2Height * (3 * r2 - cap2Height)) / 3;
	return v1 + v2 - cap1Vol - cap2Vol;
}

export interface NeighborPair {
	/** Index in atoms array (0-based) */
	i: number;
	/** Index in atoms array (0-based), j > i */
	j: number;
	/** Distance between centers in mm */
	d: number;
}

/**
 * Finds all pairs of atoms (i, j) with i < j where d < r_i + r_j.
 * Uses O(n^2) for n <= 500 and a 3D spatial grid (cell size = 2 * maxRadius) for n > 500.
 */
export function findOverlappingPairs(
	atoms: ReadonlyArray<GluedAtomInput>,
	forceSpatialGrid = false
): NeighborPair[] {
	const n = atoms.length;
	const pairs: NeighborPair[] = [];
	if (n <= 1) return pairs;

	const useGrid = forceSpatialGrid || n > SPATIAL_GRID_ATOM_THRESHOLD;

	if (!useGrid) {
		for (let i = 0; i < n; i++) {
			const ai = atoms[i];
			const [xi, yi, zi] = ai.centerMm;
			const ri = ai.radiusMm;
			for (let j = i + 1; j < n; j++) {
				const aj = atoms[j];
				const rSum = ri + aj.radiusMm;
				const dx = aj.centerMm[0] - xi;
				if (Math.abs(dx) >= rSum) continue;
				const dy = aj.centerMm[1] - yi;
				if (Math.abs(dy) >= rSum) continue;
				const dz = aj.centerMm[2] - zi;
				if (Math.abs(dz) >= rSum) continue;
				const d = Math.hypot(dx, dy, dz);
				if (d < rSum) {
					pairs.push({ i, j, d });
				}
			}
		}
		return pairs;
	}

	let maxRadius = 0;
	for (let i = 0; i < n; i++) {
		if (atoms[i].radiusMm > maxRadius) {
			maxRadius = atoms[i].radiusMm;
		}
	}
	const cellSize = Math.max(2 * maxRadius, 1e-3);
	const grid = new Map<string, number[]>();

	for (let i = 0; i < n; i++) {
		const [x, y, z] = atoms[i].centerMm;
		const cx = Math.floor(x / cellSize);
		const cy = Math.floor(y / cellSize);
		const cz = Math.floor(z / cellSize);
		const key = `${cx},${cy},${cz}`;
		let bucket = grid.get(key);
		if (!bucket) {
			bucket = [];
			grid.set(key, bucket);
		}
		bucket.push(i);
	}

	for (let i = 0; i < n; i++) {
		const ai = atoms[i];
		const [xi, yi, zi] = ai.centerMm;
		const ri = ai.radiusMm;
		const cx = Math.floor(xi / cellSize);
		const cy = Math.floor(yi / cellSize);
		const cz = Math.floor(zi / cellSize);

		for (let dxCell = -1; dxCell <= 1; dxCell++) {
			for (let dyCell = -1; dyCell <= 1; dyCell++) {
				for (let dzCell = -1; dzCell <= 1; dzCell++) {
					const bucket = grid.get(`${cx + dxCell},${cy + dyCell},${cz + dzCell}`);
					if (!bucket) continue;
					for (let bIdx = 0; bIdx < bucket.length; bIdx++) {
						const j = bucket[bIdx];
						if (j <= i) continue;
						const aj = atoms[j];
						const rSum = ri + aj.radiusMm;
						const dx = aj.centerMm[0] - xi;
						if (Math.abs(dx) >= rSum) continue;
						const dy = aj.centerMm[1] - yi;
						if (Math.abs(dy) >= rSum) continue;
						const dz = aj.centerMm[2] - zi;
						if (Math.abs(dz) >= rSum) continue;
						const d = Math.hypot(dx, dy, dz);
						if (d < rSum) {
							pairs.push({ i, j, d });
						}
					}
				}
			}
		}
	}

	return pairs;
}

export interface GluedSpherePartMeshData {
	atomId: number;
	atomType: string;
	partName: string;
	colorHex: string;
	centerMm: [number, number, number];
	radiusMm: number;
	/** Flat vertex positions (x, y, z) in assembled world mm coordinates */
	positions: Float32Array;
	/** Triangle vertex indices (CCW) */
	indices: Uint32Array;
	/** Outward unit normal of the largest flat cutting face, or null if uncut sphere */
	largestCutNormal: [number, number, number] | null;
	/** Volume of the part in mm^3 */
	volumeMm3: number;
	/** Bounding box dimensions [sizeX, sizeY, sizeZ] in mm */
	bboxSizeMm: [number, number, number];
	/** Manifold status string ('NoError' when manifold) */
	status: string;
	/** True when status === 'NoError' and mesh is closed 2-manifold */
	isManifold: boolean;
	/** Neighboring part names (e.g. ['H_2', 'H_3']) */
	neighbors: string[];
	/** Number of peg holes drilled into this part */
	pegHoleCount: number;
}

export interface ComputeGluedSpheresResult {
	parts: GluedSpherePartMeshData[];
	stats: GluedSpheresStats;
	centroidMm: [number, number, number];
}

/**
 * Prepares centered, scaled GluedAtomInput[] in mm from AtomCoordinate[].
 */
export function prepareGluedAtomInputs(
	coordinates: ReadonlyArray<AtomCoordinate>,
	options: {
		showHydrogens: boolean;
		multiplicationFactor: number;
		mmPerUnit: number;
		uniformAtomDiameter?: boolean;
	}
): { atoms: GluedAtomInput[]; centroidMm: [number, number, number] } {
	const indexed: AtomWithBonds[] = coordinates.map((coord, idx) => ({
		...coord,
		id: coord.id ?? idx + 1
	}));

	const filtered = options.showHydrogens
		? indexed
		: indexed.filter((a) => a.atomType !== 'H');

	if (filtered.length === 0) {
		return { atoms: [], centroidMm: [0, 0, 0] };
	}

	let sumX = 0;
	let sumY = 0;
	let sumZ = 0;
	for (const a of filtered) {
		sumX += a.x;
		sumY += a.y;
		sumZ += a.z;
	}
	const avgX = sumX / filtered.length;
	const avgY = sumY / filtered.length;
	const avgZ = sumZ / filtered.length;

	const atoms: GluedAtomInput[] = filtered.map((a) => {
		const cx = (a.x - avgX) * options.mmPerUnit;
		const cy = (a.y - avgY) * options.mmPerUnit;
		const cz = (a.z - avgZ) * options.mmPerUnit;
		const baseR = getSphereAtomBaseRadius(a, options.uniformAtomDiameter);
		const radiusMm = baseR * options.multiplicationFactor * options.mmPerUnit;
		return {
			id: a.id,
			atomType: a.atomType,
			partName: `${a.atomType}_${a.id}`,
			centerMm: [cx, cy, cz],
			radiusMm,
			colorHex: getAtomCPKColorHex(a)
		};
	});

	return { atoms, centroidMm: [0, 0, 0] };
}

/**
 * Builds a column-major 4x4 transformation matrix (Mat4) that rotates +Z [0,0,1] to `dir`
 * and translates by `translation`.
 */
function buildCylinderTransformMat4(
	dir: Readonly<[number, number, number]>,
	translation: Readonly<[number, number, number]>
): Mat4 {
	const q = new THREE.Quaternion().setFromUnitVectors(
		new THREE.Vector3(0, 0, 1),
		new THREE.Vector3(dir[0], dir[1], dir[2]).normalize()
	);
	const m = new THREE.Matrix4().compose(
		new THREE.Vector3(translation[0], translation[1], translation[2]),
		q,
		new THREE.Vector3(1, 1, 1)
	);
	return m.elements.slice(0, 16) as unknown as Mat4;
}

/**
 * Verifies topological watertightness (every directed half-edge (u,v) has an opposite (v,u))
 * on an indexed triangle mesh.
 */
export function isMeshWatertightManifold(
	positions: Float32Array,
	indices: Uint32Array
): boolean {
	if (indices.length === 0 || indices.length % 3 !== 0) return false;
	for (let i = 0; i < positions.length; i++) {
		if (!Number.isFinite(positions[i])) return false;
	}

	// Map canonical vertex position (quantized to 1e-5) or vertex index to canonical ID
	// Manifold.getMesh() with numProp=3 already merges topological vertices into unique indices.
	const edgeCounts = new Map<string, number>();
	for (let t = 0; t < indices.length; t += 3) {
		const v0 = indices[t];
		const v1 = indices[t + 1];
		const v2 = indices[t + 2];
		if (v0 === v1 || v1 === v2 || v2 === v0) return false;

		const e01 = `${v0}->${v1}`;
		const e12 = `${v1}->${v2}`;
		const e20 = `${v2}->${v0}`;
		edgeCounts.set(e01, (edgeCounts.get(e01) ?? 0) + 1);
		edgeCounts.set(e12, (edgeCounts.get(e12) ?? 0) + 1);
		edgeCounts.set(e20, (edgeCounts.get(e20) ?? 0) + 1);
	}

	for (const [edge, count] of edgeCounts.entries()) {
		if (count !== 1) return false;
		const [u, v] = edge.split('->');
		if (edgeCounts.get(`${v}->${u}`) !== 1) return false;
	}
	return true;
}

/**
 * Finds the outward unit normal of the largest flat cutting face on a part mesh
 * by summing triangle areas whose normal aligns with each candidate cut plane normal.
 */
function findLargestCutNormalFromMesh(
	positions: Float32Array,
	indices: Uint32Array,
	candidateNormals: ReadonlyArray<[number, number, number]>,
	fallbackBestNormal: [number, number, number] | null
): [number, number, number] | null {
	if (candidateNormals.length === 0) return fallbackBestNormal;

	const areas = new Float64Array(candidateNormals.length);
	const ax = new THREE.Vector3();
	const bx = new THREE.Vector3();
	const cx = new THREE.Vector3();
	const ab = new THREE.Vector3();
	const ac = new THREE.Vector3();
	const cross = new THREE.Vector3();

	for (let t = 0; t < indices.length; t += 3) {
		const i0 = indices[t] * 3;
		const i1 = indices[t + 1] * 3;
		const i2 = indices[t + 2] * 3;
		ax.set(positions[i0], positions[i0 + 1], positions[i0 + 2]);
		bx.set(positions[i1], positions[i1 + 1], positions[i1 + 2]);
		cx.set(positions[i2], positions[i2 + 1], positions[i2 + 2]);
		ab.subVectors(bx, ax);
		ac.subVectors(cx, ax);
		cross.crossVectors(ab, ac);
		const doubleArea = cross.length();
		if (doubleArea < 1e-10) continue;
		const nx = cross.x / doubleArea;
		const ny = cross.y / doubleArea;
		const nz = cross.z / doubleArea;

		for (let k = 0; k < candidateNormals.length; k++) {
			const cn = candidateNormals[k];
			const dot = nx * cn[0] + ny * cn[1] + nz * cn[2];
			if (dot > 0.995) {
				areas[k] += 0.5 * doubleArea;
			}
		}
	}

	let bestIdx = -1;
	let bestArea = 1e-4;
	for (let k = 0; k < candidateNormals.length; k++) {
		if (areas[k] > bestArea) {
			bestArea = areas[k];
			bestIdx = k;
		}
	}

	return bestIdx >= 0 ? candidateNormals[bestIdx] : fallbackBestNormal;
}

interface ActiveRadicalCut {
	neighborIndex: number;
	neighborPartName: string;
	plane: RadicalPlaneResult;
}

/**
 * Formats a concise, readable part name for a cluster of 1 or more same-element atoms.
 * Examples:
 * - [1] -> 'O_1'
 * - [1, 2] -> 'C_1_2'
 * - [4, 5, 6, 7, 8, 9] -> 'C_4-9'
 */
export function formatClusterPartName(atomType: string, atomIds: ReadonlyArray<number>): string {
	if (atomIds.length === 0) return atomType;
	if (atomIds.length === 1) return `${atomType}_${atomIds[0]}`;

	const sorted = [...atomIds].sort((a, b) => a - b);
	const segments: string[] = [];
	let start = sorted[0];
	let end = sorted[0];

	for (let k = 1; k < sorted.length; k++) {
		if (sorted[k] === end + 1) {
			end = sorted[k];
		} else {
			segments.push(start === end ? `${start}` : end === start + 1 ? `${start}_${end}` : `${start}-${end}`);
			start = sorted[k];
			end = sorted[k];
		}
	}
	segments.push(start === end ? `${start}` : end === start + 1 ? `${start}_${end}` : `${start}-${end}`);

	if (segments.length <= 4) {
		return `${atomType}_${segments.join('_')}`;
	}
	return `${atomType}_${sorted[0]}-${sorted[sorted.length - 1]}_${sorted.length}x`;
}

/**
 * Main CSG computation for "Spheres – rozložené pro lepení".
 * Runs in Web Worker in browser or directly in Node/Vitest tests.
 */
export async function computeGluedSpheres(
	coordinates: ReadonlyArray<AtomCoordinate>,
	options: {
		quality: number;
		showHydrogens: boolean;
		multiplicationFactor: number;
		uniformAtomDiameter?: boolean;
		config: GluedSpheresConfig;
		onProgress?: (completed: number, total: number) => void;
	}
): Promise<ComputeGluedSpheresResult> {
	const wasm = await getManifoldModule();
	const { Manifold: ManifoldCtor } = wasm;

	const { config } = options;
	const isEn = config.locale === 'en';
	const mergeSameElement = Boolean(config.mergeSameElement);
	const gap = Math.max(0, Math.min(0.3, config.gap || 0));
	const segments = Math.max(16, Math.round((options.quality || 50) * 1.28));

	const { atoms, centroidMm } = prepareGluedAtomInputs(coordinates, {
		showHydrogens: options.showHydrogens,
		multiplicationFactor: options.multiplicationFactor,
		mmPerUnit: config.mmPerUnit,
		uniformAtomDiameter: options.uniformAtomDiameter
	});

	const n = atoms.length;
	const stats: GluedSpheresStats = {
		totalAtoms: n,
		generatedPartsCount: 0,
		swallowedAtoms: [],
		smallParts: [],
		skippedPegHoles: [],
		duplicateAtoms: [],
		nonManifoldParts: [],
		largeMoleculeWarning: n > LARGE_MOLECULE_ATOM_THRESHOLD,
		pegHolesCreatedCount: 0
	};

	if (n === 0) {
		return { parts: [], stats, centroidMm };
	}

	// Build priority rank map for Mode B ('priority')
	const defaultOrder = getDefaultPriorityOrder(atoms.map((a) => a.atomType));
	const fullPriorityOrder = [
		...config.priorityOrder.filter((el) => defaultOrder.includes(el)),
		...defaultOrder.filter((el) => !config.priorityOrder.includes(el))
	];
	const priorityRank = new Map<string, number>();
	fullPriorityOrder.forEach((el, idx) => {
		priorityRank.set(el, idx); // lower index = higher priority
	});

	const getPriorityComparison = (atomA: GluedAtomInput, atomB: GluedAtomInput): number => {
		const rankA = priorityRank.get(atomA.atomType) ?? 999;
		const rankB = priorityRank.get(atomB.atomType) ?? 999;
		if (rankA < rankB) return 1; // A has higher priority than B
		if (rankA > rankB) return -1; // A has lower priority than B
		return 0; // Equal priority
	};

	const rawPairs = findOverlappingPairs(atoms);

	// Track duplicate atoms and adjacency list of valid overlapping neighbors
	const skippedDuplicateAtomIndices = new Set<number>();
	const neighborsByAtom: number[][] = Array.from({ length: n }, () => []);

	for (const pair of rawPairs) {
		const ai = atoms[pair.i];
		const aj = atoms[pair.j];
		if (pair.d < 1e-6) {
			const msg = `${ai.partName} & ${aj.partName} (d ≈ 0 mm)`;
			console.warn(`[GluedSpheres] Duplicate atoms detected: ${msg}`);
			stats.duplicateAtoms.push(msg);
			skippedDuplicateAtomIndices.add(pair.j);
			continue;
		}
		if (skippedDuplicateAtomIndices.has(pair.i) || skippedDuplicateAtomIndices.has(pair.j)) {
			continue;
		}
		neighborsByAtom[pair.i].push(pair.j);
		neighborsByAtom[pair.j].push(pair.i);
	}

	// Precompute active radical cuts and swallowed status for Mode A (and equal-priority cuts in Mode B)
	const activeRadicalCutsByAtom: ActiveRadicalCut[][] = Array.from({ length: n }, () => []);
	const swallowedByAtom = new Map<number, string>();

	for (let i = 0; i < n; i++) {
		if (skippedDuplicateAtomIndices.has(i)) continue;
		const ai = atoms[i];
		for (const j of neighborsByAtom[i]) {
			const aj = atoms[j];
			// When mergeSameElement is enabled, overlapping atoms of the same element are merged rather than cut
			if (mergeSameElement && ai.atomType === aj.atomType) {
				continue;
			}
			if (config.mode === 'priority') {
				const cmp = getPriorityComparison(ai, aj);
				if (cmp > 0) {
					// Atom i has higher priority -> not cut by j
					continue;
				}
				if (cmp < 0) {
					// Atom i has lower priority -> j subtracts sphere(r_j + gap) from i
					const d = Math.hypot(
						aj.centerMm[0] - ai.centerMm[0],
						aj.centerMm[1] - ai.centerMm[1],
						aj.centerMm[2] - ai.centerMm[2]
					);
					if (d + ai.radiusMm <= aj.radiusMm + gap) {
						swallowedByAtom.set(
							i,
							isEn
								? `${ai.partName} (swallowed by atom ${aj.partName})`
								: `${ai.partName} (pohlcen atomem ${aj.partName})`
						);
						break;
					}
					continue;
				}
			}

			// Mode A ('radical') or equal priority in Mode B
			const plane = computeRadicalPlane(ai.centerMm, ai.radiusMm, aj.centerMm, aj.radiusMm, gap);
			if (plane.classification === 'swallowed') {
				swallowedByAtom.set(
					i,
					isEn
						? `${ai.partName} (swallowed by atom ${aj.partName})`
						: `${ai.partName} (pohlcen atomem ${aj.partName})`
				);
				break;
			}
			if (plane.classification === 'cut') {
				activeRadicalCutsByAtom[i].push({
					neighborIndex: j,
					neighborPartName: aj.partName,
					plane
				});
			}
		}
	}

	// Log swallowed atoms before building same-element clusters
	for (let i = 0; i < n; i++) {
		if (swallowedByAtom.has(i)) {
			const msg = swallowedByAtom.get(i)!;
			console.warn(`[GluedSpheres] Swallowed atom: ${msg}`);
			stats.swallowedAtoms.push(msg);
		}
	}

	// Pre-evaluate peg holes symmetrically on pairs (i, j) in Mode A
	const approvedPegHolePairs = new Set<string>();
	if (config.mode === 'radical' && config.pegHolesEnabled) {
		const holeDiameter = Math.max(0.5, config.pegHoleDiameter || 1.9);
		const holeDepth = Math.max(0.5, config.pegHoleDepth || 3.0);

		for (const pair of rawPairs) {
			const { i, j } = pair;
			if (
				skippedDuplicateAtomIndices.has(i) ||
				skippedDuplicateAtomIndices.has(j) ||
				swallowedByAtom.has(i) ||
				swallowedByAtom.has(j)
			) {
				continue;
			}
			const ai = atoms[i];
			const aj = atoms[j];
			if (mergeSameElement && ai.atomType === aj.atomType) {
				continue;
			}
			const cutIJ = activeRadicalCutsByAtom[i].find((c) => c.neighborIndex === j);
			const cutJI = activeRadicalCutsByAtom[j].find((c) => c.neighborIndex === i);
			if (!cutIJ || !cutJI) continue;

			const planeIJ = cutIJ.plane;
			const planeJI = cutJI.plane;
			const a = planeIJ.cutCircleRadius;
			const pairLabel = `${ai.partName}–${aj.partName}`;

			// 1. a >= 1.5 * holeDiameter
			if (a < 1.5 * holeDiameter) {
				stats.skippedPegHoles.push(
					isEn
						? `${pairLabel}: cut radius too small (a = ${a.toFixed(2)} mm < ${(1.5 * holeDiameter).toFixed(2)} mm)`
						: `${pairLabel}: malý poloměr řezu (a = ${a.toFixed(2)} mm < ${(1.5 * holeDiameter).toFixed(2)} mm)`
				);
				continue;
			}

			// 2. holeDepth < 0.6 * (r_i + h_ij) and holeDepth < 0.6 * (r_j + h_ji)
			const maxDepthI = 0.6 * (ai.radiusMm + planeIJ.h);
			const maxDepthJ = 0.6 * (aj.radiusMm + planeJI.h);
			if (holeDepth >= maxDepthI || holeDepth >= maxDepthJ) {
				stats.skippedPegHoles.push(
					isEn
						? `${pairLabel}: hole depth (${holeDepth.toFixed(1)} mm) would pierce the part (limit ${Math.min(maxDepthI, maxDepthJ).toFixed(2)} mm)`
						: `${pairLabel}: hloubka díry (${holeDepth.toFixed(1)} mm) by propíchla díl (limit ${Math.min(maxDepthI, maxDepthJ).toFixed(2)} mm)`
				);
				continue;
			}

			// 3. Center of hole lies inside actual cutting face on BOTH i and j with margin >= holeDiameter
			const checkCenterMargin = (
				atomIdx: number,
				targetNeighborIdx: number,
				targetPlane: RadicalPlaneResult
			): boolean => {
				const cx = targetPlane.normal[0] * targetPlane.hEffective;
				const cy = targetPlane.normal[1] * targetPlane.hEffective;
				const cz = targetPlane.normal[2] * targetPlane.hEffective;

				for (const otherCut of activeRadicalCutsByAtom[atomIdx]) {
					if (otherCut.neighborIndex === targetNeighborIdx) continue;
					const op = otherCut.plane;
					const dot = cx * op.normal[0] + cy * op.normal[1] + cz * op.normal[2];
					const marginToPlane = op.hEffective - dot;
					if (marginToPlane < holeDiameter) {
						return false;
					}
				}
				return true;
			};

			if (!checkCenterMargin(i, j, planeIJ) || !checkCenterMargin(j, i, planeJI)) {
				stats.skippedPegHoles.push(
					isEn
						? `${pairLabel}: hole center is too close to another cut plane (margin < ${holeDiameter.toFixed(2)} mm)`
						: `${pairLabel}: střed díry je příliš blízko jiné řezné roviny (rezerva < ${holeDiameter.toFixed(2)} mm)`
				);
				continue;
			}

			approvedPegHolePairs.add(`${Math.min(i, j)}-${Math.max(i, j)}`);
			stats.pegHolesCreatedCount++;
		}
	}

	// Build clusters of connected same-element atoms (when mergeSameElement is true) or single-atom clusters
	const clusters: number[][] = [];
	const atomToClusterIdx = new Int32Array(n).fill(-1);
	const visitedAtom = new Uint8Array(n);

	for (let i = 0; i < n; i++) {
		if (skippedDuplicateAtomIndices.has(i) || swallowedByAtom.has(i) || visitedAtom[i]) {
			continue;
		}
		if (!mergeSameElement) {
			visitedAtom[i] = 1;
			const cIdx = clusters.length;
			clusters.push([i]);
			atomToClusterIdx[i] = cIdx;
		} else {
			const comp: number[] = [];
			const queue: number[] = [i];
			visitedAtom[i] = 1;
			const targetElement = atoms[i].atomType;
			while (queue.length > 0) {
				const curr = queue.shift()!;
				comp.push(curr);
				for (const nb of neighborsByAtom[curr]) {
					if (
						!visitedAtom[nb] &&
						!skippedDuplicateAtomIndices.has(nb) &&
						!swallowedByAtom.has(nb) &&
						atoms[nb].atomType === targetElement
					) {
						visitedAtom[nb] = 1;
						queue.push(nb);
					}
				}
			}
			comp.sort((a, b) => atoms[a].id - atoms[b].id);
			const cIdx = clusters.length;
			clusters.push(comp);
			for (const memberIdx of comp) {
				atomToClusterIdx[memberIdx] = cIdx;
			}
		}
	}

	const clusterPartNames: string[] = clusters.map((comp) => {
		const el = atoms[comp[0]].atomType;
		const ids = comp.map((idx) => atoms[idx].id);
		return formatClusterPartName(el, ids);
	});

	const parts: GluedSpherePartMeshData[] = [];
	let processedAtomsCount = skippedDuplicateAtomIndices.size + swallowedByAtom.size;

	for (let cIdx = 0; cIdx < clusters.length; cIdx++) {
		const comp = clusters[cIdx];
		const firstAtom = atoms[comp[0]];
		const clusterPartName = clusterPartNames[cIdx];

		const atomWorldManifolds: Manifold[] = [];
		const candidateCutNormals: [number, number, number][] = [];
		let fallbackBestCutNormal: [number, number, number] | null = null;
		let bestCutRadius = -1;
		const neighborPartNameSet = new Set<string>();
		let pegHoleCount = 0;

		const addCandidateNormal = (normal: [number, number, number]) => {
			for (const existing of candidateCutNormals) {
				const dot =
					existing[0] * normal[0] + existing[1] * normal[1] + existing[2] * normal[2];
				if (dot > 0.999) return;
			}
			candidateCutNormals.push(normal);
		};

		for (const i of comp) {
			const ai = atoms[i];
			let currentManifold: Manifold = ManifoldCtor.sphere(ai.radiusMm, segments);

			if (config.mode === 'radical') {
				for (const cut of activeRadicalCutsByAtom[i]) {
					const nbClusterIdx = atomToClusterIdx[cut.neighborIndex];
					if (nbClusterIdx >= 0 && nbClusterIdx !== cIdx) {
						neighborPartNameSet.add(clusterPartNames[nbClusterIdx]);
					}
					const nextManifold = currentManifold.trimByPlane(
						cut.plane.trimNormal as Vec3,
						cut.plane.trimOffset
					);
					currentManifold.delete();
					currentManifold = nextManifold;

					addCandidateNormal(cut.plane.normal);
					if (cut.plane.cutCircleRadius > bestCutRadius) {
						bestCutRadius = cut.plane.cutCircleRadius;
						fallbackBestCutNormal = cut.plane.normal;
					}
				}
			} else {
				// Mode B: Priority subtraction
				for (const j of neighborsByAtom[i]) {
					if (mergeSameElement && atoms[j].atomType === ai.atomType) continue;
					const aj = atoms[j];
					const nbClusterIdx = atomToClusterIdx[j];
					if (nbClusterIdx >= 0 && nbClusterIdx !== cIdx) {
						neighborPartNameSet.add(clusterPartNames[nbClusterIdx]);
					}
					const cmp = getPriorityComparison(ai, aj);
					if (cmp > 0) {
						// Atom i has higher priority -> stays full sphere against j
						continue;
					} else if (cmp === 0) {
						// Equal priority -> radical plane
						const cut = activeRadicalCutsByAtom[i].find((c) => c.neighborIndex === j);
						if (cut) {
							const nextManifold = currentManifold.trimByPlane(
								cut.plane.trimNormal as Vec3,
								cut.plane.trimOffset
							);
							currentManifold.delete();
							currentManifold = nextManifold;
							addCandidateNormal(cut.plane.normal);
							if (cut.plane.cutCircleRadius > bestCutRadius) {
								bestCutRadius = cut.plane.cutCircleRadius;
								fallbackBestCutNormal = cut.plane.normal;
							}
						}
					} else {
						// Atom i has lower priority -> subtract neighbor sphere (r_j + gap)
						const relPos: Vec3 = [
							aj.centerMm[0] - ai.centerMm[0],
							aj.centerMm[1] - ai.centerMm[1],
							aj.centerMm[2] - ai.centerMm[2]
						];
						const subSphere = ManifoldCtor.sphere(aj.radiusMm + gap, segments);
						const translatedSub = subSphere.translate(relPos);
						subSphere.delete();

						const nextManifold = currentManifold.subtract(translatedSub);
						translatedSub.delete();
						currentManifold.delete();
						currentManifold = nextManifold;

						const plane = computeRadicalPlane(
							ai.centerMm,
							ai.radiusMm,
							aj.centerMm,
							aj.radiusMm,
							gap
						);
						if (plane.cutCircleRadius > bestCutRadius) {
							bestCutRadius = plane.cutCircleRadius;
							fallbackBestCutNormal = plane.normal;
						}
					}
				}
			}

			// Translate from local atom coordinates to centered molecule coordinates in mm
			const atomWorld = currentManifold.translate(ai.centerMm as Vec3);
			currentManifold.delete();
			if (!atomWorld.isEmpty()) {
				atomWorldManifolds.push(atomWorld);
			} else {
				atomWorld.delete();
			}
		}

		if (atomWorldManifolds.length === 0) {
			const msg = `${clusterPartName} (zcela oříznut / nulový objem)`;
			console.warn(`[GluedSpheres] Empty part after cuts: ${msg}`);
			stats.swallowedAtoms.push(msg);
			processedAtomsCount += comp.length;
			options.onProgress?.(processedAtomsCount, n);
			continue;
		}

		let worldManifold: Manifold;
		if (atomWorldManifolds.length === 1) {
			worldManifold = atomWorldManifolds[0];
		} else {
			worldManifold = ManifoldCtor.union(atomWorldManifolds);
			for (const m of atomWorldManifolds) {
				m.delete();
			}
		}

		// Subtract approved peg holes in world coordinates (Mode A)
		if (config.mode === 'radical' && config.pegHolesEnabled) {
			const holeDiameter = Math.max(0.5, config.pegHoleDiameter || 1.9);
			const holeRadius = holeDiameter / 2;
			const holeDepth = Math.max(0.5, config.pegHoleDepth || 3.0);
			const holeOvershoot = 0.1;

			for (const i of comp) {
				const ai = atoms[i];
				for (const cut of activeRadicalCutsByAtom[i]) {
					const pairKey = `${Math.min(i, cut.neighborIndex)}-${Math.max(i, cut.neighborIndex)}`;
					if (!approvedPegHolePairs.has(pairKey)) continue;

					const cylHeight = holeDepth + holeOvershoot;
					const cyl = ManifoldCtor.cylinder(
						cylHeight,
						holeRadius,
						holeRadius,
						Math.max(16, Math.min(32, segments)),
						false
					);
					const startDist = cut.plane.hEffective - holeDepth;
					const worldStartPos: [number, number, number] = [
						ai.centerMm[0] + cut.plane.normal[0] * startDist,
						ai.centerMm[1] + cut.plane.normal[1] * startDist,
						ai.centerMm[2] + cut.plane.normal[2] * startDist
					];
					const mat4 = buildCylinderTransformMat4(cut.plane.normal, worldStartPos);
					const transformedCyl = cyl.transform(mat4);
					cyl.delete();

					const withHole = worldManifold.subtract(transformedCyl);
					transformedCyl.delete();
					worldManifold.delete();
					worldManifold = withHole;
					pegHoleCount++;
				}
			}
		}

		const status = worldManifold.status();
		const isEmpty = worldManifold.isEmpty();
		const volumeMm3 = isEmpty ? 0 : worldManifold.volume();

		if (isEmpty || volumeMm3 <= 1e-6) {
			worldManifold.delete();
			const msg = isEn
				? `${clusterPartName} (completely trimmed / zero volume)`
				: `${clusterPartName} (zcela oříznut / nulový objem)`;
			console.warn(`[GluedSpheres] Empty part after cuts: ${msg}`);
			stats.swallowedAtoms.push(msg);
			processedAtomsCount += comp.length;
			options.onProgress?.(processedAtomsCount, n);
			continue;
		}

		const bbox = worldManifold.boundingBox();
		const sizeX = bbox.max[0] - bbox.min[0];
		const sizeY = bbox.max[1] - bbox.min[1];
		const sizeZ = bbox.max[2] - bbox.min[2];
		const minDim = Math.min(sizeX, sizeY, sizeZ);
		if (minDim < SMALL_PART_SIZE_THRESHOLD_MM) {
			stats.smallParts.push(
				`${clusterPartName} (${sizeX.toFixed(1)} × ${sizeY.toFixed(1)} × ${sizeZ.toFixed(1)} mm)`
			);
		}

		const mesh = worldManifold.getMesh();
		worldManifold.delete();

		// Extract 3D positions from vertProperties (stride = mesh.numProp >= 3)
		const numVert = mesh.numVert;
		const numProp = mesh.numProp;
		const vertProps = mesh.vertProperties;
		let positions: Float32Array;
		if (numProp === 3) {
			positions = new Float32Array(vertProps);
		} else {
			positions = new Float32Array(numVert * 3);
			for (let v = 0; v < numVert; v++) {
				positions[v * 3] = vertProps[v * numProp];
				positions[v * 3 + 1] = vertProps[v * numProp + 1];
				positions[v * 3 + 2] = vertProps[v * numProp + 2];
			}
		}
		const indices = new Uint32Array(mesh.triVerts);

		const watertight = status === 'NoError' && isMeshWatertightManifold(positions, indices);
		if (!watertight) {
			stats.nonManifoldParts.push(`${clusterPartName} (status: ${status})`);
		}

		const largestCutNormal = findLargestCutNormalFromMesh(
			positions,
			indices,
			candidateCutNormals,
			fallbackBestCutNormal
		);

		// Compute cluster centerMm and bounding radiusMm
		let sumCx = 0;
		let sumCy = 0;
		let sumCz = 0;
		for (const i of comp) {
			sumCx += atoms[i].centerMm[0];
			sumCy += atoms[i].centerMm[1];
			sumCz += atoms[i].centerMm[2];
		}
		const clusterCenterMm: [number, number, number] = [
			sumCx / comp.length,
			sumCy / comp.length,
			sumCz / comp.length
		];
		let clusterRadiusMm = firstAtom.radiusMm;
		if (comp.length > 1) {
			clusterRadiusMm = 0;
			for (const i of comp) {
				const ai = atoms[i];
				const dist = Math.hypot(
					ai.centerMm[0] - clusterCenterMm[0],
					ai.centerMm[1] - clusterCenterMm[1],
					ai.centerMm[2] - clusterCenterMm[2]
				);
				if (dist + ai.radiusMm > clusterRadiusMm) {
					clusterRadiusMm = dist + ai.radiusMm;
				}
			}
		}

		parts.push({
			atomId: firstAtom.id,
			atomType: firstAtom.atomType,
			partName: clusterPartName,
			colorHex: firstAtom.colorHex,
			centerMm: clusterCenterMm,
			radiusMm: clusterRadiusMm,
			positions,
			indices,
			largestCutNormal,
			volumeMm3,
			bboxSizeMm: [sizeX, sizeY, sizeZ],
			status,
			isManifold: watertight,
			neighbors: Array.from(neighborPartNameSet),
			pegHoleCount
		});

		stats.generatedPartsCount++;
		processedAtomsCount += comp.length;
		options.onProgress?.(processedAtomsCount, n);
	}

	return { parts, stats, centroidMm };
}

/**
 * Converts a GluedSpherePartMeshData into a THREE.BufferGeometry with computed normals.
 */
export function partMeshDataToBufferGeometry(part: GluedSpherePartMeshData): THREE.BufferGeometry {
	const geom = new THREE.BufferGeometry();
	geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(part.positions), 3));
	geom.setIndex(new THREE.BufferAttribute(new Uint32Array(part.indices), 1));
	geom.computeVertexNormals();
	geom.computeBoundingBox();
	geom.computeBoundingSphere();
	return geom;
}

/**
 * Orients a single part's geometry for the build plate:
 * - Rotates the part so its largest cutting face normal points down (-Z: [0, 0, -1]);
 *   uncut spheres (largestCutNormal === null) are not rotated.
 * - Translates the part so that its X/Y bounding box is centered at (0,0) and minZ = 0.
 */
export function orientPartGeometryForPlate(part: GluedSpherePartMeshData): THREE.BufferGeometry {
	const geom = partMeshDataToBufferGeometry(part);

	if (part.largestCutNormal) {
		const n = new THREE.Vector3(
			part.largestCutNormal[0],
			part.largestCutNormal[1],
			part.largestCutNormal[2]
		).normalize();
		const targetDown = new THREE.Vector3(0, 0, -1);
		const quat = new THREE.Quaternion().setFromUnitVectors(n, targetDown);
		const rotMat = new THREE.Matrix4().makeRotationFromQuaternion(quat);
		geom.applyMatrix4(rotMat);
	}

	geom.computeBoundingBox();
	const box = geom.boundingBox!;
	const centerX = (box.min.x + box.max.x) / 2;
	const centerY = (box.min.y + box.max.y) / 2;
	const minZ = box.min.z;

	geom.translate(-centerX, -centerY, -minZ);
	geom.computeVertexNormals();
	geom.computeBoundingBox();
	return geom;
}

/**
 * Arranges parts of a single element onto a 2D build plate grid (minZ = 0)
 * using their bounding boxes and the given spacing (default 3 mm).
 */
export function arrangeElementPartsOnPlate(
	parts: ReadonlyArray<GluedSpherePartMeshData>,
	spacingMm = 3.0
): {
	group: THREE.Group;
	partTransforms: { partName: string; geometry: THREE.BufferGeometry }[];
} {
	const group = new THREE.Group();
	const partTransforms: { partName: string; geometry: THREE.BufferGeometry }[] = [];
	if (parts.length === 0) return { group, partTransforms };

	const oriented = parts.map((p) => {
		const geom = orientPartGeometryForPlate(p);
		const box = geom.boundingBox!;
		const width = box.max.x - box.min.x;
		const depth = box.max.y - box.min.y;
		return { part: p, geom, width, depth };
	});

	const cols = Math.max(1, Math.ceil(Math.sqrt(oriented.length)));
	const rows = Math.ceil(oriented.length / cols);

	const colWidths = new Float64Array(cols);
	const rowDepths = new Float64Array(rows);

	oriented.forEach((item, idx) => {
		const col = idx % cols;
		const row = Math.floor(idx / cols);
		if (item.width > colWidths[col]) colWidths[col] = item.width;
		if (item.depth > rowDepths[row]) rowDepths[row] = item.depth;
	});

	const colCenters = new Float64Array(cols);
	let cursorX = 0;
	for (let c = 0; c < cols; c++) {
		colCenters[c] = cursorX + colWidths[c] / 2;
		cursorX += colWidths[c] + spacingMm;
	}
	const totalWidth = cursorX > 0 ? cursorX - spacingMm : 0;

	const rowCenters = new Float64Array(rows);
	let cursorY = 0;
	for (let r = 0; r < rows; r++) {
		rowCenters[r] = cursorY + rowDepths[r] / 2;
		cursorY += rowDepths[r] + spacingMm;
	}
	const totalDepth = cursorY > 0 ? cursorY - spacingMm : 0;

	oriented.forEach((item, idx) => {
		const col = idx % cols;
		const row = Math.floor(idx / cols);
		const x = colCenters[col] - totalWidth / 2;
		const y = rowCenters[row] - totalDepth / 2;

		item.geom.translate(x, y, 0);
		item.geom.computeBoundingBox();

		const mat = new THREE.MeshStandardMaterial({
			color: new THREE.Color(item.part.colorHex)
		});
		const mesh = new THREE.Mesh(item.geom, mat);
		mesh.name = item.part.partName;
		group.add(mesh);
		partTransforms.push({ partName: item.part.partName, geometry: item.geom });
	});

	group.updateMatrixWorld(true);
	return { group, partTransforms };
}

function localizeWarningEntry(entry: string, isEn: boolean): string {
	if (isEn) {
		return entry
			.replace(/\(pohlcen atomem ([^)]+)\)/g, '(swallowed by atom $1)')
			.replace(/\(zcela oříznut \/ nulový objem\)/g, '(completely trimmed / zero volume)')
			.replace(/malý poloměr řezu/g, 'cut radius too small')
			.replace(/hloubka díry \(([^)]+)\) by propíchla díl \(limit ([^)]+)\)/g, 'hole depth ($1) would pierce the part (limit $2)')
			.replace(/střed díry je příliš blízko jiné řezné roviny \(rezerva < ([^)]+)\)/g, 'hole center is too close to another cut plane (margin < $1)');
	}
	return entry
		.replace(/\(swallowed by atom ([^)]+)\)/g, '(pohlcen atomem $1)')
		.replace(/\(completely trimmed \/ zero volume\)/g, '(zcela oříznut / nulový objem)')
		.replace(/cut radius too small/g, 'malý poloměr řezu')
		.replace(/hole depth \(([^)]+)\) would pierce the part \(limit ([^)]+)\)/g, 'hloubka díry ($1) by propíchla díl (limit $2)')
		.replace(/hole center is too close to another cut plane \(margin < ([^)]+)\)/g, 'střed díry je příliš blízko jiné řezné roviny (rezerva < $1)');
}

/**
 * Generates the contents of `navod.txt` (Czech) or `assembly_guide.txt` (English)
 * for assembling the glued spheres model.
 */
export function generateAssemblyGuideTxt(
	parts: ReadonlyArray<GluedSpherePartMeshData>,
	stats: GluedSpheresStats,
	config: GluedSpheresConfig,
	localeOverride?: 'cs' | 'en',
	structureImageFileName?: string | null
): string {
	const isEn = (localeOverride ?? config.locale) === 'en';
	const lines: string[] = [];

	if (isEn) {
		lines.push('================================================================');
		lines.push('  MODEL ASSEMBLY GUIDE – Spheres SPLIT FOR GLUING');
		lines.push('================================================================');
		lines.push('');
		lines.push(
			`Splitting mode:     ${
				config.mode === 'radical'
					? 'Mode A – Radical planes'
					: 'Mode B – Priority subtraction'
			}`
		);
		if (config.mode === 'priority') {
			lines.push(`Priority order:     ${config.priorityOrder.join(' > ')}`);
		}
		lines.push(`Model scale:        ${config.mmPerUnit} mm / Å`);
		lines.push(`Tolerance (gap):    ${config.gap.toFixed(2)} mm`);
		lines.push(
			`Filament peg holes: ${
				config.mode === 'radical' && config.pegHolesEnabled
					? `YES (diameter ${config.pegHoleDiameter.toFixed(2)} mm, depth ${config.pegHoleDepth.toFixed(1)} mm, created pairs: ${stats.pegHolesCreatedCount})`
					: 'NO'
			}`
		);
		lines.push(
			`Export mode:        ${
				config.exportMode === 'plate'
					? `Arranged on build plate (spacing ${config.plateSpacing.toFixed(1)} mm)`
					: 'Assembled (absolute coordinates)'
			}`
		);
		lines.push(
			`Merge same element: ${
				(config.mergeSameElement ?? true)
					? 'YES (touching atoms of the same element form a single part)'
					: 'NO (each atom separate)'
			}`
		);
		lines.push(`Total parts:        ${parts.length}`);
		lines.push('');
		lines.push('----------------------------------------------------------------');
		lines.push('  PHOTO ATTACHMENT (folder guide_photos/)');
		lines.push('----------------------------------------------------------------');
		lines.push('In the ZIP archive you will find the guide_photos/ folder with reference');
		lines.push('images of the slightly exploded model (Exploded view) and enabled');
		lines.push('part ID labels from 4 camera angles:');
		if (structureImageFileName) {
			lines.push(`  - guide_photos/${structureImageFileName.padEnd(21)} (2D chemical structure / reference)`);
		}
		lines.push('  - guide_photos/1_front_view.png     (front view +Z)');
		lines.push('  - guide_photos/2_back_view.png      (back view -Z)');
		lines.push('  - guide_photos/3_side_view.png      (side view +X)');
		lines.push('  - guide_photos/4_isometric_view.png (isometric 3D overview)');
		lines.push('');
		lines.push('----------------------------------------------------------------');
		lines.push('  LIST OF PARTS AND THEIR NEIGHBORS');
		lines.push('----------------------------------------------------------------');
		lines.push('Format: Part_ID | Element | Center [x, y, z] (mm) | Neighboring parts');
		lines.push('');

		for (const p of parts) {
			const [cx, cy, cz] = p.centerMm;
			const coordsStr = `[${cx.toFixed(2)}, ${cy.toFixed(2)}, ${cz.toFixed(2)}]`;
			const neighborsStr =
				p.neighbors.length > 0 ? p.neighbors.join(', ') : '(no neighbors – full sphere)';
			const holesNote = p.pegHoleCount > 0 ? ` (peg holes: ${p.pegHoleCount})` : '';
			lines.push(
				`${p.partName.padEnd(8)} | ${p.atomType.padEnd(5)} | ${coordsStr.padEnd(26)} | Neighbors: ${neighborsStr}${holesNote}`
			);
		}

		if (
			stats.swallowedAtoms.length > 0 ||
			stats.smallParts.length > 0 ||
			stats.skippedPegHoles.length > 0 ||
			stats.duplicateAtoms.length > 0
		) {
			lines.push('');
			lines.push('----------------------------------------------------------------');
			lines.push('  NOTICES AND WARNINGS');
			lines.push('----------------------------------------------------------------');
			if (stats.swallowedAtoms.length > 0) {
				lines.push(
					`Swallowed atoms (${stats.swallowedAtoms.length}): ${stats.swallowedAtoms.map((s) => localizeWarningEntry(s, true)).join(', ')}`
				);
			}
			if (stats.smallParts.length > 0) {
				lines.push(
					`Parts smaller than 2 mm (${stats.smallParts.length}): ${stats.smallParts.join(', ')}`
				);
			}
			if (stats.skippedPegHoles.length > 0) {
				lines.push(`Skipped peg holes (${stats.skippedPegHoles.length}):`);
				for (const s of stats.skippedPegHoles) {
					lines.push(`  - ${localizeWarningEntry(s, true)}`);
				}
			}
			if (stats.duplicateAtoms.length > 0) {
				lines.push(
					`Duplicate atoms (${stats.duplicateAtoms.length}): ${stats.duplicateAtoms.join(', ')}`
				);
			}
		}

		lines.push('');
		return lines.join('\n');
	}

	lines.push('================================================================');
	lines.push('  NÁVOD NA SKLÁDÁNÍ MODELU – Spheres (rozložené pro lepení)');
	lines.push('================================================================');
	lines.push('');
	lines.push(`Režim dělení:       ${config.mode === 'radical' ? 'Režim A – Radikální roviny' : 'Režim B – Odečítání podle priority'}`);
	if (config.mode === 'priority') {
		lines.push(`Pořadí priorit:     ${config.priorityOrder.join(' > ')}`);
	}
	lines.push(`Měřítko modelu:     ${config.mmPerUnit} mm / Å`);
	lines.push(`Tolerance (gap):    ${config.gap.toFixed(2)} mm`);
	lines.push(
		`Díry pro kolík:     ${
			config.mode === 'radical' && config.pegHolesEnabled
				? `ANO (průměr ${config.pegHoleDiameter.toFixed(2)} mm, hloubka ${config.pegHoleDepth.toFixed(1)} mm, vytvořených párů: ${stats.pegHolesCreatedCount})`
				: 'NE'
		}`
	);
	lines.push(`Režim exportu:      ${config.exportMode === 'plate' ? `Rozloženo na podložku (rozestup ${config.plateSpacing.toFixed(1)} mm)` : 'Složeno (absolutní souřadnice)'}`);
	lines.push(`Sloučení stejných:  ${(config.mergeSameElement ?? true) ? 'ANO (dotýkající se atomy stejného prvku tvoří jeden díl)' : 'NE (každý atom zvlášť)'}`);
	lines.push(`Celkem dílů:        ${parts.length}`);
	lines.push('');
	lines.push('----------------------------------------------------------------');
	lines.push('  FOTOGRAFICKÁ PŘÍLOHA (složka navod_foto/)');
	lines.push('----------------------------------------------------------------');
	lines.push('V archivu ZIP naleznete složku navod_foto/ s přehledovými snímky');
	lines.push('modelu v lehce rozloženém stavu (Exploded view) a se zapnutými');
	lines.push('popisky ID dílů ze 4 pohledů:');
	if (structureImageFileName) {
		lines.push(`  - navod_foto/${structureImageFileName.padEnd(23)} (2D chemická struktura / přehled)`);
	}
	lines.push('  - navod_foto/1_predni_pohled.png      (přední pohled +Z)');
	lines.push('  - navod_foto/2_zadni_pohled.png       (zadní pohled -Z)');
	lines.push('  - navod_foto/3_bocni_pohled.png       (boční pohled +X)');
	lines.push('  - navod_foto/4_izometricky_pohled.png (izometrický 3D přehled)');
	lines.push('');
	lines.push('----------------------------------------------------------------');
	lines.push('  SEZNAM DÍLŮ A JEJICH SOUSEDŮ');
	lines.push('----------------------------------------------------------------');
	lines.push('Formát: ID_dílu | Prvek | Střed [x, y, z] (mm) | Sousední díly');
	lines.push('');

	for (const p of parts) {
		const [cx, cy, cz] = p.centerMm;
		const coordsStr = `[${cx.toFixed(2)}, ${cy.toFixed(2)}, ${cz.toFixed(2)}]`;
		const neighborsStr = p.neighbors.length > 0 ? p.neighbors.join(', ') : '(žádní sousedé – celá koule)';
		const holesNote = p.pegHoleCount > 0 ? ` (díry pro kolík: ${p.pegHoleCount})` : '';
		lines.push(
			`${p.partName.padEnd(8)} | ${p.atomType.padEnd(5)} | ${coordsStr.padEnd(26)} | Sousedí s: ${neighborsStr}${holesNote}`
		);
	}

	if (
		stats.swallowedAtoms.length > 0 ||
		stats.smallParts.length > 0 ||
		stats.skippedPegHoles.length > 0 ||
		stats.duplicateAtoms.length > 0
	) {
		lines.push('');
		lines.push('----------------------------------------------------------------');
		lines.push('  UPOZORNĚNÍ A VAROVÁNÍ');
		lines.push('----------------------------------------------------------------');
		if (stats.swallowedAtoms.length > 0) {
			lines.push(
				`Pohlcené atomy (${stats.swallowedAtoms.length}): ${stats.swallowedAtoms.map((s) => localizeWarningEntry(s, false)).join(', ')}`
			);
		}
		if (stats.smallParts.length > 0) {
			lines.push(`Díly menší než 2 mm (${stats.smallParts.length}): ${stats.smallParts.join(', ')}`);
		}
		if (stats.skippedPegHoles.length > 0) {
			lines.push(`Přeskočené díry pro kolík (${stats.skippedPegHoles.length}):`);
			for (const s of stats.skippedPegHoles) {
				lines.push(`  - ${localizeWarningEntry(s, false)}`);
			}
		}
		if (stats.duplicateAtoms.length > 0) {
			lines.push(`Duplicitní atomy (${stats.duplicateAtoms.length}): ${stats.duplicateAtoms.join(', ')}`);
		}
	}

	lines.push('');
	return lines.join('\n');
}
