import * as THREE from 'three';
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
import type { JointParams, MovingBond } from '$lib/geometry/jointGeometry';

export type ModelStyleId =
    | 'spheres'
    | 'ball-and-stick'
    | 'ball-and-stick-moving-joints'
    | 'sticks'
    | 'minecraft';

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