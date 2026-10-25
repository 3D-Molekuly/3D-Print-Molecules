import * as THREE from 'three';
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
import type { JointParams, MovingBond } from '$lib/geometry/jointGeometry';

export type ModelStyleId =
    | 'spheres'
    | 'spheres-glued'
    | 'ball-and-stick'
    | 'ball-and-stick-moving-joints'
    | 'sticks'
    | 'minecraft';

export type GluedSpheresMode = 'radical' | 'priority';
export type GluedSpheresExportMode = 'assembled' | 'plate';

export interface GluedSpheresConfig {
    mode: GluedSpheresMode;
    /** Element symbols ordered from highest priority to lowest (used in 'priority' mode). */
    priorityOrder: string[];
    /** Merge overlapping atoms of the same element into a single connected manifold part. */
    mergeSameElement?: boolean;
    /** Clearance gap in mm (default 0, range 0..0.3). */
    gap: number;
    /** Enable filament peg holes on flat cut faces (only in 'radical' mode). */
    pegHolesEnabled: boolean;
    /** Peg hole diameter in mm (default 1.9). */
    pegHoleDiameter: number;
    /** Peg hole depth in mm (default 3.0). */
    pegHoleDepth: number;
    /** Export layout mode: 'assembled' or 'plate'. */
    exportMode: GluedSpheresExportMode;
    /** Grid spacing between parts on build plate in mm (default 3.0). */
    plateSpacing: number;
    /** Exploded view factor 0..1 (0..100%). */
    explodedFactor: number;
    /** Show 3D part ID labels in preview. */
    showPartLabels: boolean;
    /** Scale in mm / Å. */
    mmPerUnit: number;
    /** UI language locale ('cs' | 'en') for localized guide text and ZIP filenames. */
    locale?: 'cs' | 'en';
}

export interface GluedSpheresStats {
    totalAtoms: number;
    generatedPartsCount: number;
    swallowedAtoms: string[];
    smallParts: string[];
    skippedPegHoles: string[];
    duplicateAtoms: string[];
    nonManifoldParts: string[];
    largeMoleculeWarning: boolean;
    pegHolesCreatedCount: number;
}

export type JointPresetId = 'fdm' | 'sla';

export interface MovingJointsConfig {
    preset: JointPresetId;
    params: JointParams;
    preferT: number;
    skipTerminal: boolean;
    jointsInRings: boolean;
    mmPerUnit: number;
}

export interface MovingJointsStats {
    insertedCount: number;
    eligibleSingleBondsCount: number;
    skippedCount: number;
    skippedBonds: string[];
    firstJointParamsMm: JointParams | null;
}

export interface PlannedMovingBondEntry {
    atomAId: number;
    atomBId: number;
    mb: MovingBond;
}

export interface GeneratorResult {
    atomMesh: THREE.Mesh;
    bondMeshes: THREE.Group;
}

export type GeneratorFunction = (params: SelectedGeneratorParams) => GeneratorResult;

export interface CreateAtomsParams {
    coordinates: AtomCoordinate[];
    quality: number;
    showHydrogens: boolean;
    multiplicationFactor: number;
    selectedGenerator: GeneratorFunction;
    mmPerUnit?: number;
    bondDiameterMultiplicationFactor?: number;
    bondQuality?: number;
    groupBondsSeparately?: boolean;
    uniformAtomDiameter?: boolean;
    showMultipleBonds?: boolean;
    movingJoints?: MovingJointsConfig;
    gluedSpheres?: GluedSpheresConfig;
}

export interface SelectedGeneratorParams {
    x: number;
    y: number;
    z: number;
    quality: number;
    size: number;
    color: number;
    multiplicationFactor: number;
    coordinates?: AtomWithBonds[];
    originalCoordinates?: AtomWithBonds[];
    bondDiameterMultiplicationFactor?: number;
    bondQuality?: number;
    groupBondsSeparately?: boolean;
    uniformAtomDiameter?: boolean;
    showMultipleBonds?: boolean;
    movingBondsMap?: Map<string, PlannedMovingBondEntry>;
}

export interface AtomWithBonds extends AtomCoordinate {
    id: number;
    centeredX?: number;
    centeredY?: number;
    centeredZ?: number;
    bonds?: {
        atomId: number;
        bondType: number;
    }[];
}