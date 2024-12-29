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
}
