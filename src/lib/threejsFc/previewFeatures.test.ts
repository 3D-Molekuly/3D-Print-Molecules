import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import {
	buildMoleculeGroup,
	createSphereMesh,
	createBallAndStickMesh,
	getModelBoundsMm,
	syncPreviewScaleMmPerUnit,
	getElementGroupsInfo,
	toggleElementGroupVisibility,
	showAllElementGroups,
	exportGroupToSTLBuffer,
	generateModel3MFBlob,
	buildPhotoDownloadFileName,
	dataUrlToPngBlob
} from './threejsMolecules3';
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';

const waterCoords: AtomCoordinate[] = [
	{
		id: 0,
		atomType: 'O',
		x: 0,
		y: 0,
		z: 0,
		bonds: [
			{ atomId: 1, bondType: 1 },
			{ atomId: 2, bondType: 1 }
		]
	},
	{
		id: 1,
		atomType: 'H',
		x: 0.96,
		y: 0,
		z: 0,
		bonds: [{ atomId: 0, bondType: 1 }]
	},
	{
		id: 2,
		atomType: 'H',
		x: -0.24,
		y: 0.93,
		z: 0,
		bonds: [{ atomId: 0, bondType: 1 }]
	}
];

describe('3D preview HUD & inspection helpers', () => {
	beforeEach(() => {
		showAllElementGroups();
	});

	it('computes physical dimensions in mm and updates live with syncPreviewScaleMmPerUnit', () => {
		buildMoleculeGroup({
			coordinates: waterCoords,
			quality: 16,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			selectedGenerator: createSphereMesh,
			mmPerUnit: 10
		});

		const bounds10 = getModelBoundsMm();
		expect(bounds10).not.toBeNull();
		expect(bounds10!.widthMm).toBeGreaterThan(20);
		expect(bounds10!.exceedsStandardPlate).toBe(false);

		const bounds25 = syncPreviewScaleMmPerUnit(25);
		expect(bounds25).not.toBeNull();
		expect(bounds25!.widthMm).toBeCloseTo(bounds10!.widthMm * 2.5, 3);
		expect(bounds25!.heightMm).toBeCloseTo(bounds10!.heightMm * 2.5, 3);

		// Excessive scale should trigger build plate warning
		const boundsHuge = syncPreviewScaleMmPerUnit(120);
		expect(boundsHuge!.exceedsStandardPlate).toBe(true);
	});

	it('lists element and bond groups, toggles visibility, and preserves full geometry on export', async () => {
		const { group } = buildMoleculeGroup({
			coordinates: waterCoords,
			quality: 12,
			showHydrogens: true,
			multiplicationFactor: 1.0,
			selectedGenerator: createBallAndStickMesh,
			bondDiameterMultiplicationFactor: 0.4,
			bondQuality: 12,
			groupBondsSeparately: true,
			mmPerUnit: 10
		});

		const groups = getElementGroupsInfo();
		expect(groups.map((g) => g.key)).toEqual(['Bonds', 'O', 'H']);
		expect(groups.find((g) => g.key === 'O')?.count).toBe(1);
		expect(groups.find((g) => g.key === 'H')?.count).toBe(2);
		expect(groups.every((g) => g.visible)).toBe(true);

		const fullStlByteLength = exportGroupToSTLBuffer(group).byteLength;
		expect(fullStlByteLength).toBeGreaterThan(84);

		// Hide Hydrogens in the preview
		const afterHide = toggleElementGroupVisibility('H');
		const hGroupInfo = afterHide.find((g) => g.key === 'H');
		expect(hGroupInfo?.visible).toBe(false);

		const hChild = group.children.find((c) => c.name === 'Group_H') as THREE.Group;
		expect(hChild.visible).toBe(false);

		// STL and 3MF exports must still include hidden preview groups and restore preview state afterwards
		const stlWhileHiddenByteLength = exportGroupToSTLBuffer(group).byteLength;
		expect(stlWhileHiddenByteLength).toBe(fullStlByteLength);
		expect(hChild.visible).toBe(false);

		const blob3mf = await generateModel3MFBlob('water_test');
		expect(blob3mf).not.toBeNull();
		expect(hChild.visible).toBe(false);

		// Bounds calculation also stays consistent while a group is hidden
		const boundsWhileHidden = getModelBoundsMm();
		const afterReset = showAllElementGroups();
		expect(afterReset.every((g) => g.visible)).toBe(true);
		expect(hChild.visible).toBe(true);
		const boundsAfterReset = getModelBoundsMm();
		expect(boundsWhileHidden?.widthMm).toBeCloseTo(boundsAfterReset!.widthMm, 4);
	});

	it('builds valid .png download filenames and decodes PNG data URLs to Blob', async () => {
		expect(buildPhotoDownloadFileName('Molecule_2519')).toBe('Photo_Molecule_2519.png');
		expect(buildPhotoDownloadFileName('Molecule_PDB_1CRN:A')).toBe('Photo_Molecule_PDB_1CRN_A.png');
		expect(buildPhotoDownloadFileName('Photo_Molecule_2244.png')).toBe('Photo_Molecule_2244.png');
		expect(buildPhotoDownloadFileName('')).toBe('Photo_molecule.png');

		// 1x1 transparent PNG base64
		const samplePngDataUrl =
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIAAAUAAeImBZsAAAAASUVORK5CYII=';
		const blob = dataUrlToPngBlob(samplePngDataUrl);
		expect(blob).not.toBeNull();
		expect(blob!.type).toBe('image/png');
		expect(blob!.size).toBeGreaterThan(20);
		const bytes = new Uint8Array(await blob!.arrayBuffer());
		// PNG magic header: 89 50 4E 47
		expect(Array.from(bytes.slice(0, 4))).toEqual([0x89, 0x50, 0x4e, 0x47]);

		expect(dataUrlToPngBlob('invalid-data-url')).toBeNull();
	});
});
