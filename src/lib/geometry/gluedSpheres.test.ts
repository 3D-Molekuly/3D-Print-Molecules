import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import {
	analyticalTwoSpheresUnionVolume,
	arrangeElementPartsOnPlate,
	computeGluedSpheres,
	computeRadicalPlane,
	findOverlappingPairs,
	generateAssemblyGuideTxt,
	getManifoldModule,
	isMeshWatertightManifold,
	orientPartGeometryForPlate,
	type GluedAtomInput
} from '$lib/geometry/gluedSpheres';
import {
	buildGroupFromGluedSpheresResult,
	buildGluedSpheresZip,
	generateModel3MFBlob,
	validateGluedSpheresManifold
} from '$lib/threejsFc/threejsMolecules3';
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
import type { GluedSpheresConfig } from '$lib/types';

function makeDefaultConfig(overrides: Partial<GluedSpheresConfig> = {}): GluedSpheresConfig {
	return {
		mode: 'radical',
		priorityOrder: ['C', 'N', 'O', 'H'],
		gap: 0,
		pegHolesEnabled: false,
		pegHoleDiameter: 1.9,
		pegHoleDepth: 3.0,
		exportMode: 'assembled',
		plateSpacing: 3.0,
		explodedFactor: 0,
		showPartLabels: false,
		mmPerUnit: 10,
		...overrides
	};
}

/** Realistic 3D coordinates of water (H2O) in Å */
function makeWaterCoords(): AtomCoordinate[] {
	return [
		{ id: 1, atomType: 'O', x: 0.0, y: 0.0, z: 0.1173 },
		{ id: 2, atomType: 'H', x: 0.0, y: 0.7572, z: -0.4692 },
		{ id: 3, atomType: 'H', x: 0.0, y: -0.7572, z: -0.4692 }
	];
}

/** Realistic 3D coordinates of benzene (C6H6) in Å */
function makeBenzeneCoords(): AtomCoordinate[] {
	const rC = 1.397;
	const rH = 2.481;
	const coords: AtomCoordinate[] = [];
	for (let k = 0; k < 6; k++) {
		const angle = (k * Math.PI) / 3;
		coords.push({
			id: k + 1,
			atomType: 'C',
			x: rC * Math.cos(angle),
			y: rC * Math.sin(angle),
			z: 0
		});
	}
	for (let k = 0; k < 6; k++) {
		const angle = (k * Math.PI) / 3;
		coords.push({
			id: k + 7,
			atomType: 'H',
			x: rH * Math.cos(angle),
			y: rH * Math.sin(angle),
			z: 0
		});
	}
	return coords;
}

/** Realistic 3D coordinates of caffeine (C8H10N4O2, 24 atoms) from PubChem CID 2519 in Å */
function makeCaffeineCoords(): AtomCoordinate[] {
	return [
		{ id: 1, atomType: 'O', x: 0.47, y: 2.5688, z: 0.0006 },
		{ id: 2, atomType: 'O', x: -3.1271, y: -0.4436, z: -0.0003 },
		{ id: 3, atomType: 'N', x: -0.9686, y: -1.3125, z: 0.0 },
		{ id: 4, atomType: 'N', x: 2.2182, y: 0.1412, z: -0.0003 },
		{ id: 5, atomType: 'N', x: -1.3477, y: 1.0716, z: -0.0001 },
		{ id: 6, atomType: 'N', x: 1.4119, y: -1.9372, z: 0.0002 },
		{ id: 7, atomType: 'C', x: 0.8579, y: -0.6842, z: 0.0 },
		{ id: 8, atomType: 'C', x: 0.3897, y: 0.5626, z: 0.0 },
		{ id: 9, atomType: 'C', x: -0.245, y: 1.5665, z: 0.0002 },
		{ id: 10, atomType: 'C', x: -1.9037, y: -0.2194, z: -0.0002 },
		{ id: 11, atomType: 'C', x: 2.5029, y: -1.198, z: 0.0001 },
		{ id: 12, atomType: 'C', x: -1.4296, y: -2.6997, z: 0.0001 },
		{ id: 13, atomType: 'C', x: 3.1856, y: 1.2297, z: 0.0002 },
		{ id: 14, atomType: 'C', x: -2.2886, y: 2.1924, z: 0.0001 },
		{ id: 15, atomType: 'H', x: 3.5162, y: -1.5761, z: 0.0002 },
		{ id: 16, atomType: 'H', x: -1.0736, y: -3.2266, z: 0.8899 },
		{ id: 17, atomType: 'H', x: -2.5218, y: -2.7306, z: 0.0003 },
		{ id: 18, atomType: 'H', x: -1.0739, y: -3.2267, z: -0.8898 },
		{ id: 19, atomType: 'H', x: 2.6626, y: 2.1879, z: -0.0018 },
		{ id: 20, atomType: 'H', x: 3.8165, y: 1.1586, z: 0.8902 },
		{ id: 21, atomType: 'H', x: 3.8191, y: 1.1564, z: -0.8878 },
		{ id: 22, atomType: 'H', x: -1.7376, y: 3.1351, z: -0.0005 },
		{ id: 23, atomType: 'H', x: -2.9222, y: 2.1389, z: -0.8892 },
		{ id: 24, atomType: 'H', x: -2.9212, y: 2.1397, z: 0.8902 }
	];
}

describe('Glued Spheres – Radical planes & CSG geometry', () => {
	it('1. Radical plane math: equal spheres cut at midpoint, h_ij + h_ji = d, and trimByPlane keeps (p - c_i)·n <= h - gap/2', async () => {
		// Two identical spheres: r1 = r2 = 10 mm, distance d = 14 mm
		const pEqual = computeRadicalPlane([0, 0, 0], 10, [14, 0, 0], 10, 0);
		expect(pEqual.classification).toBe('cut');
		expect(pEqual.d).toBeCloseTo(14, 9);
		expect(pEqual.h).toBeCloseTo(7, 9);
		expect(pEqual.hOpposite).toBeCloseTo(7, 9);
		expect(pEqual.h + pEqual.hOpposite).toBeCloseTo(pEqual.d, 9);

		// Two different spheres: r1 = 12 mm, r2 = 8 mm, centers at [-3, 2, 5] and [7, -4, 9]
		const c1: [number, number, number] = [-3, 2, 5];
		const c2: [number, number, number] = [7, -4, 9];
		const p12 = computeRadicalPlane(c1, 12, c2, 8, 0.2);
		const p21 = computeRadicalPlane(c2, 8, c1, 12, 0.2);

		expect(p12.classification).toBe('cut');
		expect(p21.classification).toBe('cut');
		expect(p12.h + p21.h).toBeCloseTo(p12.d, 9);
		expect(p12.cutCircleRadius).toBeCloseTo(p21.cutCircleRadius, 9);

		// Verify trimByPlane orientation directly with manifold-3d:
		// Sphere at origin r = 10, neighbor at +X (d = 12, r = 10 -> h = 6, gap = 0.2 -> hEffective = 5.9).
		// Points kept in local coordinates must satisfy x <= 5.9, so boundingBox.max[0] == 5.9 and min[0] == -10.
		const wasm = await getManifoldModule();
		const plane = computeRadicalPlane([0, 0, 0], 10, [12, 0, 0], 10, 0.2);
		expect(plane.trimNormal).toEqual([-1, -0, -0]);
		expect(plane.trimOffset).toBeCloseTo(-5.9, 9);

		const s = wasm.Manifold.sphere(10, 64);
		const trimmed = s.trimByPlane(plane.trimNormal, plane.trimOffset);
		const bbox = trimmed.boundingBox();
		s.delete();
		trimmed.delete();

		expect(bbox.min[0]).toBeCloseTo(-10, 2);
		expect(bbox.max[0]).toBeCloseTo(5.9, 2);
	});

	it('2. Two spheres: sum of part volumes matches analytical union volume within 1%', async () => {
		// Sphere 1 at (0,0,0), r1 = 11.33 mm (C), Sphere 2 at (1.4 Å -> 14 mm, 0, 0), r2 = 10.13 mm (O)
		const coords: AtomCoordinate[] = [
			{ id: 1, atomType: 'C', x: 0, y: 0, z: 0, AtomicRadius: '1.1333333' },
			{ id: 2, atomType: 'O', x: 1.4, y: 0, z: 0, AtomicRadius: '1.0133333' }
		];

		const res = await computeGluedSpheres(coords, {
			quality: 96,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			config: makeDefaultConfig({ mmPerUnit: 10, gap: 0 })
		});

		expect(res.parts.length).toBe(2);
		const sumVolume = res.parts[0].volumeMm3 + res.parts[1].volumeMm3;
		const analyticalVolume = analyticalTwoSpheresUnionVolume(11.333333, 10.133333, 14.0);
		const relError = Math.abs(sumVolume - analyticalVolume) / analyticalVolume;
		expect(relError).toBeLessThan(0.01);
	});

	it('3. Water, benzene, and caffeine: all parts are manifold and pairwise intersection volume is ~0', async () => {
		const wasm = await getManifoldModule();

		const molecules = [
			{ name: 'water', coords: makeWaterCoords() },
			{ name: 'benzene', coords: makeBenzeneCoords() },
			{ name: 'caffeine', coords: makeCaffeineCoords() }
		];

		for (const mol of molecules) {
			const res = await computeGluedSpheres(mol.coords, {
				quality: 36,
				showHydrogens: true,
				multiplicationFactor: 1.0,
				config: makeDefaultConfig({ mmPerUnit: 10, gap: 0 })
			});

			expect(res.parts.length).toBe(mol.coords.length);
			expect(res.stats.nonManifoldParts).toEqual([]);

			// Reconstruct Manifold objects from output meshes to verify status === 'NoError' and pairwise intersection === 0
			const partManifolds = res.parts.map((part) => {
				expect(part.status).toBe('NoError');
				expect(part.isManifold).toBe(true);
				expect(isMeshWatertightManifold(part.positions, part.indices)).toBe(true);

				const mesh = new wasm.Mesh({
					numProp: 3,
					vertProperties: part.positions,
					triVerts: part.indices
				});
				const m = wasm.Manifold.ofMesh(mesh);
				expect(m.status()).toBe('NoError');
				return { part, m };
			});

			const byName = new Map(partManifolds.map((pm) => [pm.part.partName, pm]));
			const checkedPairs = new Set<string>();

			for (const { part, m } of partManifolds) {
				for (const nbrName of part.neighbors) {
					const nbr = byName.get(nbrName);
					if (!nbr) continue;
					const key =
						part.partName < nbrName
							? `${part.partName}|${nbrName}`
							: `${nbrName}|${part.partName}`;
					if (checkedPairs.has(key)) continue;
					checkedPairs.add(key);

					const inter = m.intersect(nbr.m);
					const interVol = inter.isEmpty() ? 0 : inter.volume();
					inter.delete();
					expect(interVol).toBeLessThan(1e-3);
				}
			}

			for (const pm of partManifolds) {
				pm.m.delete();
			}
		}
	});

	it('4. Sphere inside another sphere produces warning and no part for the swallowed sphere', async () => {
		// Small H sphere (r = 8 mm) placed at distance 1 mm from large C sphere (r = 15 mm) -> d + r_H = 9 <= 15
		const coords: AtomCoordinate[] = [
			{ id: 1, atomType: 'C', x: 0, y: 0, z: 0, AtomicRadius: '1.5' },
			{ id: 2, atomType: 'H', x: 0.1, y: 0, z: 0, AtomicRadius: '0.8' }
		];

		const res = await computeGluedSpheres(coords, {
			quality: 32,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			config: makeDefaultConfig({ mmPerUnit: 10 })
		});

		expect(res.parts.length).toBe(1);
		expect(res.parts[0].partName).toBe('C_1');
		expect(res.stats.swallowedAtoms.length).toBe(1);
		expect(res.stats.swallowedAtoms[0]).toContain('H_2');
	});

	it('5. Performance: caffeine completes under 1 s; >2000 atoms triggers largeMoleculeWarning and uses spatial grid', async () => {
		// Warm up WASM first
		await getManifoldModule();

		const start = performance.now();
		const res = await computeGluedSpheres(makeCaffeineCoords(), {
			quality: 32,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			config: makeDefaultConfig({ mmPerUnit: 10 })
		});
		const elapsedMs = performance.now() - start;

		expect(res.parts.length).toBe(24);
		expect(elapsedMs).toBeLessThan(1000);

		// Verify spatial grid matches O(n^2) and >2000 atoms sets largeMoleculeWarning
		const manyCoords: AtomCoordinate[] = [];
		for (let i = 0; i < 2005; i++) {
			manyCoords.push({
				id: i + 1,
				atomType: 'C',
				x: (i % 20) * 5.0,
				y: Math.floor(i / 20) * 5.0,
				z: 0,
				AtomicRadius: '1.0'
			});
		}
		// Quick check with 0 overlapping pairs on 2005 spaced atoms
		const largeRes = await computeGluedSpheres(manyCoords, {
			quality: 12,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			config: makeDefaultConfig({ mmPerUnit: 10 })
		});
		expect(largeRes.stats.largeMoleculeWarning).toBe(true);
		expect(largeRes.stats.totalAtoms).toBe(2005);

		// Verify spatial grid vs O(n^2) on caffeine atoms
		const sampleAtoms: GluedAtomInput[] = makeCaffeineCoords().map((c, idx) => ({
			id: idx + 1,
			atomType: c.atomType,
			partName: `${c.atomType}_${idx + 1}`,
			centerMm: [c.x * 10, c.y * 10, c.z * 10],
			radiusMm: 10,
			colorHex: '#808080'
		}));
		const pairsBrute = findOverlappingPairs(sampleAtoms, false);
		const pairsGrid = findOverlappingPairs(sampleAtoms, true);
		const normalize = (arr: typeof pairsBrute) =>
			arr.map((p) => `${p.i}-${p.j}`).sort();
		expect(normalize(pairsGrid)).toEqual(normalize(pairsBrute));
	});

	it('6. Mode B (priority subtraction), peg holes, plate orientation (minZ = 0), and navod.txt', async () => {
		const water = makeWaterCoords();

		// Mode B: O > H -> O stays full sphere, H gets concave cup subtracted
		const resPriority = await computeGluedSpheres(water, {
			quality: 50,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			config: makeDefaultConfig({
				mode: 'priority',
				priorityOrder: ['O', 'H'],
				mmPerUnit: 10,
				gap: 0
			})
		});
		expect(resPriority.parts.length).toBe(3);
		for (const p of resPriority.parts) {
			expect(p.isManifold).toBe(true);
		}
		const oPart = resPriority.parts.find((p) => p.partName === 'O_1')!;
		const expectedFullOVolume = (4 / 3) * Math.PI * Math.pow(oPart.radiusMm, 3);
		expect(Math.abs(oPart.volumeMm3 - expectedFullOVolume) / expectedFullOVolume).toBeLessThan(0.01);

		// Mode A with peg holes on water (at scale 15 mm/Å so cut circle is large enough for 1.9 mm peg hole)
		const resPegs = await computeGluedSpheres(water, {
			quality: 36,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			config: makeDefaultConfig({
				mode: 'radical',
				pegHolesEnabled: true,
				pegHoleDiameter: 1.9,
				pegHoleDepth: 3.0,
				mmPerUnit: 15
			})
		});
		expect(resPegs.stats.pegHolesCreatedCount).toBe(2);
		for (const p of resPegs.parts) {
			expect(p.isManifold).toBe(true);
			expect(p.pegHoleCount).toBeGreaterThan(0);
		}

		// Plate orientation: minZ == 0 for every oriented part and arranged plate group
		for (const p of resPegs.parts) {
			const oriented = orientPartGeometryForPlate(p);
			expect(oriented.boundingBox!.min.z).toBeCloseTo(0, 4);
		}
		const hParts = resPegs.parts.filter((p) => p.atomType === 'H');
		const plateLayout = arrangeElementPartsOnPlate(hParts, 3.0);
		expect(plateLayout.partTransforms.length).toBe(2);

		// Assembly guide navod.txt contains all part names and neighbor relations
		const guide = generateAssemblyGuideTxt(resPegs.parts, resPegs.stats, makeDefaultConfig());
		expect(guide).toContain('O_1');
		expect(guide).toContain('H_2');
		expect(guide).toContain('H_3');
	});

	it('7. Export: STL ZIP (assembled and plate modes) and 3MF export with named objects', async () => {
		const water = makeWaterCoords();
		const configAssembled = makeDefaultConfig({ exportMode: 'assembled', mmPerUnit: 10 });
		const res = await computeGluedSpheres(water, {
			quality: 32,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			config: configAssembled
		});

		const group = buildGroupFromGluedSpheresResult(res, configAssembled);
		expect(group.children.length).toBe(2); // Group_O and Group_H
		expect(validateGluedSpheresManifold().valid).toBe(true);

		// 1. Assembled ZIP: <Element>/<Element>_<id>.stl + navod.txt
		const zipAssembled = buildGluedSpheresZip(res, configAssembled, { author: 'test' });
		const assembledFiles = Object.keys(zipAssembled.files);
		expect(assembledFiles).toContain('O/O_1.stl');
		expect(assembledFiles).toContain('H/H_2.stl');
		expect(assembledFiles).toContain('H/H_3.stl');
		expect(assembledFiles).toContain('navod.txt');

		// 2. Plate ZIP: plate_<Element>.stl + navod.txt
		const configPlate = makeDefaultConfig({ exportMode: 'plate', plateSpacing: 3.0, mmPerUnit: 10 });
		const zipPlate = buildGluedSpheresZip(res, configPlate, { author: 'test' });
		const plateFiles = Object.keys(zipPlate.files);
		expect(plateFiles).toContain('plate_O.stl');
		expect(plateFiles).toContain('plate_H.stl');
		expect(plateFiles).toContain('navod.txt');

		// 3. 3MF Export: separate objects named O_1, H_2, H_3 + navod.txt
		const blob3mf = await generateModel3MFBlob('water_glued', { author: 'test' });
		expect(blob3mf).not.toBeNull();
		const arrayBuf = await blob3mf!.arrayBuffer();
		const loaded3mf = await JSZip.loadAsync(arrayBuf);
		expect(Object.keys(loaded3mf.files)).toContain('3D/3dmodel.model');
		expect(Object.keys(loaded3mf.files)).toContain('navod.txt');
		const modelXml = await loaded3mf.file('3D/3dmodel.model')!.async('string');
		expect(modelXml).toContain('name="O_1"');
		expect(modelXml).toContain('name="H_2"');
		expect(modelXml).toContain('name="H_3"');

		// 4. English locale ('en'): assembly_guide.txt with English text and guide_photos/ references
		const zipEn = buildGluedSpheresZip(res, configPlate, { author: 'test' }, 'en');
		const enFiles = Object.keys(zipEn.files);
		expect(enFiles).toContain('assembly_guide.txt');
		expect(enFiles).not.toContain('navod.txt');
		const enGuideText = await zipEn.file('assembly_guide.txt')!.async('string');
		expect(enGuideText).toContain('MODEL ASSEMBLY GUIDE');
		expect(enGuideText).toContain('guide_photos/1_front_view.png');
		expect(enGuideText).toContain('Neighbors:');
	});

	it('8. mergeSameElement: benzene 6-carbon cycle merges into single manifold part C_1-6 with zero overlap with hydrogens', async () => {
		const wasm = await getManifoldModule();
		const { Manifold, Mesh } = wasm;
		const benzene = makeBenzeneCoords();

		const resSplit = await computeGluedSpheres(benzene, {
			quality: 36,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			config: makeDefaultConfig({ mergeSameElement: false, mmPerUnit: 10 })
		});
		expect(resSplit.parts.length).toBe(12);

		const resMerged = await computeGluedSpheres(benzene, {
			quality: 36,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			config: makeDefaultConfig({ mergeSameElement: true, mmPerUnit: 10 })
		});

		// 6 carbons merge into 1 part ('C_1-6') + 6 hydrogens ('H_7'..'H_12') = 7 parts
		expect(resMerged.parts.length).toBe(7);
		const cPart = resMerged.parts.find((p) => p.atomType === 'C')!;
		expect(cPart).toBeDefined();
		expect(cPart.partName).toBe('C_1-6');
		expect(cPart.neighbors.length).toBe(6);

		// Every part must be manifold and total volume must match un-merged benzene
		let totalSplitVol = 0;
		for (const p of resSplit.parts) totalSplitVol += p.volumeMm3;

		let totalMergedVol = 0;
		const manifolds = resMerged.parts.map((p) => {
			expect(p.isManifold).toBe(true);
			expect(isMeshWatertightManifold(p.positions, p.indices)).toBe(true);
			totalMergedVol += p.volumeMm3;
			return new Manifold(
				new Mesh({
					numProp: 3,
					vertProperties: p.positions,
					triVerts: p.indices
				})
			);
		});
		expect(Math.abs(totalMergedVol - totalSplitVol) / totalSplitVol).toBeLessThan(1e-4);

		// Pairwise intersection between C_1-6 and each H must be ~0
		for (let i = 0; i < manifolds.length; i++) {
			for (let j = i + 1; j < manifolds.length; j++) {
				const inter = manifolds[i].intersect(manifolds[j]);
				expect(inter.volume()).toBeLessThan(1e-3);
				inter.delete();
			}
		}
		for (const m of manifolds) m.delete();
	});
});
