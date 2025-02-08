import * as THREE from "three";
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';

export interface CreateAtomsParams {
    coordinates: AtomCoordinate[];
    quality: number;
    showHydrogens: boolean;
    multiplicationFactor: number;
    selectedGenerator: (params: SelectedGeneratorParams) => THREE.Mesh;
}

export interface SelectedGeneratorParams {
    x: number;
    y: number;
    z: number;
    quality: number;
    size: number;
    color: number;
    multiplicationFactor: number;
    coordinates?: AtomWithBonds[]; // Added this optional parameter
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