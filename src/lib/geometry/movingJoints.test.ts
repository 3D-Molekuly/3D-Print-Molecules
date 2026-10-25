import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {
	JOINT_PRESETS,
	buildMovingBond,
	checkJointParams,
	createJointGeometries,
	jointIsClear,
	jointLevels,
	paramsForRod,
	type CollisionAtom,
	type CollisionBond,
	type JointParams
} from '$lib/geometry/jointGeometry';
import {
	buildMoleculeGroup,
	createBallAndStickMovingJointsMesh,
	createTestJointSTLBuffer,
	exportGroupToSTLBuffer,
	isBondInRing,
	planMoleculeMovingJoints
} from '$lib/threejsFc/threejsMolecules3';
import type { AtomWithBonds } from '$lib/types';
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';

/** Signed volume of a closed BufferGeometry mesh using divergence theorem. */
function computeGeometryVolume(geom: THREE.BufferGeometry): number {
	const g = geom.index ? geom.toNonIndexed() : geom;
	const pos = g.getAttribute('position');
	let vol = 0;
	const a = new THREE.Vector3();
	const b = new THREE.Vector3();
	const c = new THREE.Vector3();
	for (let i = 0; i < pos.count; i += 3) {
		a.fromBufferAttribute(pos, i);
		b.fromBufferAttribute(pos, i + 1);
		c.fromBufferAttribute(pos, i + 2);
		vol += a.dot(b.cross(c)) / 6;
	}
	return Math.abs(vol);
}

/**
 * Parses a binary STL ArrayBuffer and groups triangles into connected components (shells)
 * by shared vertices (quantized to 1e-4 mm).
 */
function analyzeBinarySTL(buffer: ArrayBuffer): {
	triangleCount: number;
	shellCount: number;
	shells: { triangleCount: number; minY: number; maxY: number; box: THREE.Box3 }[];
} {
	const view = new DataView(buffer);
	assert.ok(buffer.byteLength >= 84, 'Binary STL must be at least 84 bytes');
	const triangleCount = view.getUint32(80, true);
	assert.equal(buffer.byteLength, 84 + triangleCount * 50, 'Binary STL size matches triangle count');

	const parent = new Int32Array(triangleCount);
	for (let i = 0; i < triangleCount; i++) parent[i] = i;
	const find = (x: number): number => {
		while (parent[x] !== x) {
			parent[x] = parent[parent[x]];
			x = parent[x];
		}
		return x;
	};
	const union = (a: number, b: number) => {
		const ra = find(a);
		const rb = find(b);
		if (ra !== rb) parent[ra] = rb;
	};

	const vertexToTri = new Map<string, number>();
	const triBoxes: THREE.Box3[] = [];

	for (let t = 0; t < triangleCount; t++) {
		const offset = 84 + t * 50;
		const box = new THREE.Box3();
		for (let v = 0; v < 3; v++) {
			const vOffset = offset + 12 + v * 12;
			const x = view.getFloat32(vOffset, true);
			const y = view.getFloat32(vOffset + 4, true);
			const z = view.getFloat32(vOffset + 8, true);
			box.expandByPoint(new THREE.Vector3(x, y, z));
			const key = `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;
			const prev = vertexToTri.get(key);
			if (prev !== undefined) {
				union(t, prev);
			} else {
				vertexToTri.set(key, t);
			}
		}
		triBoxes.push(box);
	}

	const compMap = new Map<number, { triangleCount: number; minY: number; maxY: number; box: THREE.Box3 }>();
	for (let t = 0; t < triangleCount; t++) {
		const r = find(t);
		let entry = compMap.get(r);
		if (!entry) {
			entry = {
				triangleCount: 0,
				minY: Infinity,
				maxY: -Infinity,
				box: new THREE.Box3()
			};
			compMap.set(r, entry);
		}
		entry.triangleCount++;
		entry.box.union(triBoxes[t]);
		entry.minY = Math.min(entry.minY, triBoxes[t].min.y);
		entry.maxY = Math.max(entry.maxY, triBoxes[t].max.y);
	}

	const shells = Array.from(compMap.values());
	return {
		triangleCount,
		shellCount: shells.length,
		shells
	};
}

test('1. createJointGeometries dimensions and volumes for FDM and SLA presets', () => {
	const fdm96 = createJointGeometries({ ...JOINT_PRESETS.fdm, radialSegments: 96 });
	assert.ok(Math.abs(fdm96.length - 10.30) < 1e-6, `Expected FDM length 10.30 mm, got ${fdm96.length}`);

	const fdmStatorVol = computeGeometryVolume(fdm96.stator);
	const fdmRotorVol = computeGeometryVolume(fdm96.rotor);
	assert.ok(
		Math.abs(fdmStatorVol - 324.9) < 0.5,
		`Expected FDM stator volume ~324.9 mm³, got ${fdmStatorVol.toFixed(2)}`
	);
	assert.ok(
		Math.abs(fdmRotorVol - 154.0) < 0.5,
		`Expected FDM rotor volume ~154.0 mm³, got ${fdmRotorVol.toFixed(2)}`
	);

	const sla96 = createJointGeometries({ ...JOINT_PRESETS.sla, radialSegments: 96 });
	assert.ok(Math.abs(sla96.length - 7.80) < 1e-6, `Expected SLA length 7.80 mm, got ${sla96.length}`);

	const slaStatorVol = computeGeometryVolume(sla96.stator);
	const slaRotorVol = computeGeometryVolume(sla96.rotor);
	assert.ok(
		Math.abs(slaStatorVol - 138.8) < 0.5,
		`Expected SLA stator volume ~138.8 mm³, got ${slaStatorVol.toFixed(2)}`
	);
	assert.ok(
		Math.abs(slaRotorVol - 66.9) < 0.5,
		`Expected SLA rotor volume ~66.9 mm³, got ${slaRotorVol.toFixed(2)}`
	);
});

test('2. Ethane buildMovingBond position and jointIsClear collision check', () => {
	// C1 at (0,0,0), C2 at (0,0,1.54), C-H = 1.09 Å tetrahedral
	const c1 = new THREE.Vector3(0, 0, 0);
	const c2 = new THREE.Vector3(0, 0, 1.54);
	const chLen = 1.09;
	const sinT = Math.sin((109.47 * Math.PI) / 180);
	const cosT = -Math.cos((109.47 * Math.PI) / 180); // ~0.3333

	const atoms: CollisionAtom[] = [
		{ index: 1, pos: c1, radius: 0.35 },
		{ index: 2, pos: c2, radius: 0.35 }
	];
	const bonds: CollisionBond[] = [{ a: 1, b: 2, radius: 0.12 }];

	for (let k = 0; k < 3; k++) {
		const phi1 = (k * 2 * Math.PI) / 3;
		const h1Id = 3 + k;
		atoms.push({
			index: h1Id,
			pos: new THREE.Vector3(
				chLen * sinT * Math.cos(phi1),
				chLen * sinT * Math.sin(phi1),
				-chLen * cosT
			),
			radius: 0.2
		});
		bonds.push({ a: 1, b: h1Id, radius: 0.12 });

		const phi2 = phi1 + Math.PI / 3; // staggered
		const h2Id = 6 + k;
		atoms.push({
			index: h2Id,
			pos: new THREE.Vector3(
				chLen * sinT * Math.cos(phi2),
				chLen * sinT * Math.sin(phi2),
				1.54 + chLen * cosT
			),
			radius: 0.2
		});
		bonds.push({ a: 2, b: h2Id, radius: 0.12 });
	}

	const mb = buildMovingBond(c1, c2, {
		rodRadius: 0.12,
		rA: 0.35,
		rB: 0.35,
		mmPerUnit: 10,
		params: JOINT_PRESETS.fdm
	});

	assert.notEqual(mb, null, 'buildMovingBond for ethane C-C must return non-null');
	if (!mb) return;

	// Joint start is at s0 along C1->C2; in mm that is s0 * 10 ≈ 2.55 mm (0.255 Å)
	const s0Scene = mb.frame.start.distanceTo(c1);
	const s0Mm = s0Scene * 10;
	assert.ok(Math.abs(s0Scene - 0.255) < 0.01, `Expected s0 ≈ 0.255 Å, got ${s0Scene.toFixed(4)} Å`);
	assert.ok(Math.abs(s0Mm - 2.55) < 0.1, `Expected s0 ≈ 2.55 mm, got ${s0Mm.toFixed(2)} mm`);

	// Check clearance with the 6 ethane hydrogens
	assert.equal(jointIsClear(mb, 1, 2, atoms, bonds), true, 'jointIsClear with 6 ethane hydrogens must be true');

	// Adding a foreign atom at (0.5, 0, 0.77) with radius 0.2 must trigger collision
	const collidingAtoms: CollisionAtom[] = [
		...atoms,
		{ index: 99, pos: new THREE.Vector3(0.5, 0, 0.77), radius: 0.2 }
	];
	assert.equal(
		jointIsClear(mb, 1, 2, collidingAtoms, bonds),
		false,
		'jointIsClear with foreign atom at (0.5, 0, 0.77) r=0.2 must be false'
	);
});

/** Helper to build ethane AtomCoordinate[] */
function makeEthaneCoords(): AtomCoordinate[] {
	const chLen = 1.09;
	const sinT = Math.sin((109.47 * Math.PI) / 180);
	const cosT = Math.cos(((180 - 109.47) * Math.PI) / 180);
	const coords: AtomWithBonds[] = [
		{
			id: 1,
			atomType: 'C',
			AtomicRadius: String(170 / 150),
			x: 0,
			y: 0,
			z: 0,
			bonds: [
				{ atomId: 2, bondType: 1 },
				{ atomId: 3, bondType: 1 },
				{ atomId: 4, bondType: 1 },
				{ atomId: 5, bondType: 1 }
			]
		},
		{
			id: 2,
			atomType: 'C',
			AtomicRadius: String(170 / 150),
			x: 0,
			y: 0,
			z: 1.54,
			bonds: [
				{ atomId: 1, bondType: 1 },
				{ atomId: 6, bondType: 1 },
				{ atomId: 7, bondType: 1 },
				{ atomId: 8, bondType: 1 }
			]
		}
	];
	for (let k = 0; k < 3; k++) {
		const phi1 = (k * 2 * Math.PI) / 3;
		coords.push({
			id: 3 + k,
			atomType: 'H',
			AtomicRadius: String(120 / 150),
			x: chLen * sinT * Math.cos(phi1),
			y: chLen * sinT * Math.sin(phi1),
			z: -chLen * cosT,
			bonds: [{ atomId: 1, bondType: 1 }]
		});
	}
	for (let k = 0; k < 3; k++) {
		const phi2 = (k * 2 * Math.PI) / 3 + Math.PI / 3;
		coords.push({
			id: 6 + k,
			atomType: 'H',
			AtomicRadius: String(120 / 150),
			x: chLen * sinT * Math.cos(phi2),
			y: chLen * sinT * Math.sin(phi2),
			z: 1.54 + chLen * cosT,
			bonds: [{ atomId: 2, bondType: 1 }]
		});
	}
	return coords;
}

test('3. Exported Group_C.stl of ethane contains disjoint bodies for side A and side B', () => {
	const coords = makeEthaneCoords();
	const { group, stats } = buildMoleculeGroup({
		coordinates: coords,
		quality: 32,
		showHydrogens: true,
		multiplicationFactor: 0.77,
		selectedGenerator: createBallAndStickMovingJointsMesh,
		bondDiameterMultiplicationFactor: 0.24,
		bondQuality: 24,
		groupBondsSeparately: false,
		uniformAtomDiameter: false,
		showMultipleBonds: false,
		movingJoints: {
			preset: 'fdm',
			params: { ...JOINT_PRESETS.fdm },
			preferT: 0.5,
			skipTerminal: true,
			jointsInRings: true,
			mmPerUnit: 10
		}
	});

	assert.notEqual(stats, null);
	assert.equal(stats?.insertedCount, 1);

	const groupC = group.children.find((ch) => ch.name === 'Group_C') as THREE.Group | undefined;
	assert.ok(groupC, 'Group_C must exist');

	const stlBuf = exportGroupToSTLBuffer(groupC, 10);
	const analysis = analyzeBinarySTL(stlBuf);
	assert.ok(analysis.triangleCount > 100, 'Group_C.stl must have triangles');
	assert.ok(analysis.shellCount >= 2, `Expected at least 2 disjoint shells in Group_C.stl, got ${analysis.shellCount}`);

	const meshes = groupC.children.filter((c): c is THREE.Mesh => c instanceof THREE.Mesh);
	const latheMeshes = meshes.filter((m) => m.geometry instanceof THREE.LatheGeometry);
	assert.equal(latheMeshes.length, 2, 'Group_C must contain exactly 2 LatheGeometry meshes (stator and rotor)');

	const [statorMesh, rotorMesh] = latheMeshes;
	const statorBox = new THREE.Box3().setFromObject(statorMesh);
	const rotorBox = new THREE.Box3().setFromObject(rotorMesh);
	assert.ok(statorBox.intersectsBox(rotorBox), 'Rotor head sits inside stator cavity');

	const combinedJointGroup = new THREE.Group();
	combinedJointGroup.add(statorMesh.clone(), rotorMesh.clone());
	const jointStl = analyzeBinarySTL(exportGroupToSTLBuffer(combinedJointGroup, 10));
	assert.equal(jointStl.shellCount, 2, 'Stator and rotor in Group_C must form 2 completely disjoint STL shells');
});

test('4. Preset switching, checkJointParams warnings, and Test Joint STL export (2 separate shells)', () => {
	// Preset FDM -> SLA switch
	let currentParams: JointParams = { ...JOINT_PRESETS.fdm };
	assert.equal(currentParams.R, 4.0);
	assert.equal(currentParams.c, 0.3);
	assert.ok(Math.abs(jointLevels(currentParams).length - 10.3) < 1e-9);
	assert.deepEqual(checkJointParams(currentParams), []);

	currentParams = { ...JOINT_PRESETS.sla };
	assert.equal(currentParams.R, 3.0);
	assert.equal(currentParams.c, 0.2);
	assert.ok(Math.abs(jointLevels(currentParams).length - 7.8) < 1e-9);
	assert.deepEqual(checkJointParams(currentParams), []);

	// Changing rh <= rs + c produces yellow warning from checkJointParams
	const invalidHeadParams: JointParams = {
		...JOINT_PRESETS.fdm,
		rh: JOINT_PRESETS.fdm.rs + JOINT_PRESETS.fdm.c // rh - rs - c = 0 < 0.4
	};
	const warnings = checkJointParams(invalidHeadParams);
	assert.ok(warnings.length > 0, 'Expected warning when rh <= rs + c');
	assert.ok(
		warnings.some((w) => w.includes('rotor může vypadnout')),
		`Expected head overhang warning, got: ${warnings.join('; ')}`
	);

	// paramsForRod enlarges R, rs, rh, neck, topLen proportionally while keeping c and wall fixed
	const enlarged = paramsForRod(6.0, JOINT_PRESETS.fdm);
	assert.equal(enlarged.R, 6.0);
	assert.equal(enlarged.c, JOINT_PRESETS.fdm.c);
	assert.equal(enlarged.wall, JOINT_PRESETS.fdm.wall);

	// Test joint binary STL export
	const testStlBuffer = createTestJointSTLBuffer(JOINT_PRESETS.fdm);
	const stlInfo = analyzeBinarySTL(testStlBuffer);
	assert.ok(stlInfo.triangleCount > 200, 'Test joint STL must be non-empty');
	assert.equal(stlInfo.shellCount, 2, 'Test joint STL must contain exactly 2 separate shells (stator+rodA, rotor+rodB)');
});

test('5. Verification on ethane, butane, cyclohexane, and ethene (double bond remains fixed)', () => {
	// 5a. Ethane with skipTerminal = true vs false
	const ethaneCoords = makeEthaneCoords() as AtomWithBonds[];
	const ethaneSkipTerm = planMoleculeMovingJoints(ethaneCoords, 0.77, 0.12, 24, false, {
		preset: 'fdm',
		params: { ...JOINT_PRESETS.fdm },
		preferT: 0.5,
		skipTerminal: true,
		jointsInRings: true,
		mmPerUnit: 10
	});
	assert.equal(ethaneSkipTerm.stats.eligibleSingleBondsCount, 1);
	assert.equal(ethaneSkipTerm.stats.insertedCount, 1);
	assert.equal(ethaneSkipTerm.stats.skippedCount, 0);

	// Ethane with skipTerminal = false (multiplicationFactor = 0.77 -> rC = 0.35, rH = 0.25):
	// 6 C-H bonds are eligible but too short (1.09 Å = 10.9 mm with spheres) -> skippedCount = 6
	const ethaneIncludeTerm = planMoleculeMovingJoints(ethaneCoords, 0.77, 0.12, 24, false, {
		preset: 'fdm',
		params: { ...JOINT_PRESETS.fdm },
		preferT: 0.5,
		skipTerminal: false,
		jointsInRings: true,
		mmPerUnit: 10
	});
	assert.equal(ethaneIncludeTerm.stats.eligibleSingleBondsCount, 7);
	assert.equal(ethaneIncludeTerm.stats.insertedCount, 1);
	assert.equal(ethaneIncludeTerm.stats.skippedCount, 6);
	assert.equal(ethaneIncludeTerm.stats.skippedBonds.length, 6);

	// 5b. Butane (C4H10 chain: C1-C2-C3-C4)
	const butaneCoords: AtomWithBonds[] = [
		{ id: 1, atomType: 'C', x: 0.0, y: 0.0, z: 0.0, bonds: [{ atomId: 2, bondType: 1 }] },
		{
			id: 2,
			atomType: 'C',
			x: 1.54,
			y: 0.0,
			z: 0.0,
			bonds: [
				{ atomId: 1, bondType: 1 },
				{ atomId: 3, bondType: 1 }
			]
		},
		{
			id: 3,
			atomType: 'C',
			x: 2.31,
			y: 1.33,
			z: 0.0,
			bonds: [
				{ atomId: 2, bondType: 1 },
				{ atomId: 4, bondType: 1 }
			]
		},
		{ id: 4, atomType: 'C', x: 3.85, y: 1.33, z: 0.0, bonds: [{ atomId: 3, bondType: 1 }] }
	];
	butaneCoords[0].bonds!.push({ atomId: 5, bondType: 1 });
	butaneCoords[3].bonds!.push({ atomId: 6, bondType: 1 });
	butaneCoords.push(
		{ id: 5, atomType: 'H', x: -0.6, y: -0.9, z: 0.0, bonds: [{ atomId: 1, bondType: 1 }] },
		{ id: 6, atomType: 'H', x: 4.45, y: 2.23, z: 0.0, bonds: [{ atomId: 4, bondType: 1 }] }
	);

	const butanePlan = planMoleculeMovingJoints(butaneCoords, 0.7, 0.12, 24, false, {
		preset: 'fdm',
		params: { ...JOINT_PRESETS.fdm },
		preferT: 0.5,
		skipTerminal: true,
		jointsInRings: true,
		mmPerUnit: 10
	});
	assert.equal(butanePlan.stats.eligibleSingleBondsCount, 3, 'Butane has 3 C-C non-terminal single bonds');
	assert.equal(butanePlan.stats.insertedCount, 3, 'All 3 C-C bonds in butane receive moving joints');
	// Check orientation rule: on C1-C2, C2 has 2 heavy neighbors (C1, C3) while C1 has 1 heavy neighbor (C2) -> atomAId must be 2!
	const bond12 = butanePlan.movingBondsMap.get('1-2');
	assert.ok(bond12, 'Bond 1-2 must be planned');
	assert.equal(bond12.atomAId, 2, 'Stator (side A) must be on C2 (more heavy neighbors than C1)');
	const bond34 = butanePlan.movingBondsMap.get('3-4');
	assert.ok(bond34, 'Bond 3-4 must be planned');
	assert.equal(bond34.atomAId, 3, 'Stator (side A) must be on C3 (more heavy neighbors than C4)');

	// 5c. Cyclohexane (6-membered chair ring C1..C6, C-C ≈ 1.54 Å)
	const rRing = 1.48;
	const zChair = 0.25;
	const cyclohexaneCoords: AtomWithBonds[] = [];
	for (let i = 0; i < 6; i++) {
		const angle = (i * Math.PI) / 3;
		const id = i + 1;
		const prevId = ((i + 5) % 6) + 1;
		const nextId = ((i + 1) % 6) + 1;
		cyclohexaneCoords.push({
			id,
			atomType: 'C',
			x: rRing * Math.cos(angle),
			y: rRing * Math.sin(angle),
			z: i % 2 === 0 ? zChair : -zChair,
			bonds: [
				{ atomId: prevId, bondType: 1 },
				{ atomId: nextId, bondType: 1 }
			]
		});
	}
	const ringAdj = new Map<number, Set<number>>();
	for (const a of cyclohexaneCoords) {
		ringAdj.set(
			a.id,
			new Set(a.bonds!.map((b) => b.atomId))
		);
	}
	assert.equal(isBondInRing(1, 2, ringAdj), true, 'Cyclohexane C1-C2 must be detected as in a ring');

	const cycloWithRings = planMoleculeMovingJoints(cyclohexaneCoords, 0.7, 0.12, 24, false, {
		preset: 'fdm',
		params: { ...JOINT_PRESETS.fdm },
		preferT: 0.5,
		skipTerminal: true,
		jointsInRings: true,
		mmPerUnit: 10
	});
	assert.equal(cycloWithRings.stats.eligibleSingleBondsCount, 6);
	assert.equal(cycloWithRings.stats.insertedCount, 6);

	const cycloWithoutRings = planMoleculeMovingJoints(cyclohexaneCoords, 0.7, 0.12, 24, false, {
		preset: 'fdm',
		params: { ...JOINT_PRESETS.fdm },
		preferT: 0.5,
		skipTerminal: true,
		jointsInRings: false,
		mmPerUnit: 10
	});
	assert.equal(cycloWithoutRings.stats.eligibleSingleBondsCount, 0);
	assert.equal(cycloWithoutRings.stats.insertedCount, 0);

	// 5d. Ethene (C2H4 with C=C double bond bondType = 2)
	const etheneCoords: AtomWithBonds[] = [
		{
			id: 1,
			atomType: 'C',
			x: 0,
			y: 0,
			z: 0,
			bonds: [
				{ atomId: 2, bondType: 2 },
				{ atomId: 3, bondType: 1 },
				{ atomId: 4, bondType: 1 }
			]
		},
		{
			id: 2,
			atomType: 'C',
			x: 0,
			y: 0,
			z: 1.34,
			bonds: [
				{ atomId: 1, bondType: 2 },
				{ atomId: 5, bondType: 1 },
				{ atomId: 6, bondType: 1 }
			]
		},
		{ id: 3, atomType: 'H', x: 0.94, y: 0, z: -0.54, bonds: [{ atomId: 1, bondType: 1 }] },
		{ id: 4, atomType: 'H', x: -0.94, y: 0, z: -0.54, bonds: [{ atomId: 1, bondType: 1 }] },
		{ id: 5, atomType: 'H', x: 0.94, y: 0, z: 1.88, bonds: [{ atomId: 2, bondType: 1 }] },
		{ id: 6, atomType: 'H', x: -0.94, y: 0, z: 1.88, bonds: [{ atomId: 2, bondType: 1 }] }
	];

	const etheneBuild = buildMoleculeGroup({
		coordinates: etheneCoords,
		quality: 24,
		showHydrogens: true,
		multiplicationFactor: 0.7,
		selectedGenerator: createBallAndStickMovingJointsMesh,
		bondDiameterMultiplicationFactor: 0.24,
		bondQuality: 24,
		groupBondsSeparately: false,
		uniformAtomDiameter: false,
		showMultipleBonds: true,
		movingJoints: {
			preset: 'fdm',
			params: { ...JOINT_PRESETS.fdm },
			preferT: 0.5,
			skipTerminal: true,
			jointsInRings: true,
			mmPerUnit: 10
		}
	});
	assert.notEqual(etheneBuild.stats, null);
	assert.equal(etheneBuild.stats?.eligibleSingleBondsCount, 0, 'Double bond in ethene must not be eligible for moving joint');
	assert.equal(etheneBuild.stats?.insertedCount, 0, 'No moving joint inserted into C=C double bond');

	// Verify Group_C of ethene has no LatheGeometry (only SphereGeometry and CylinderGeometry for fixed bonds)
	const etheneGroupC = etheneBuild.group.children.find((c) => c.name === 'Group_C') as THREE.Group | undefined;
	assert.ok(etheneGroupC);
	const etheneLathes = etheneGroupC.children.filter(
		(c): c is THREE.Mesh => c instanceof THREE.Mesh && c.geometry instanceof THREE.LatheGeometry
	);
	assert.equal(etheneLathes.length, 0, 'Ethene Group_C must not contain any LatheGeometry joint');
});
