import * as THREE from "three";
import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';

export interface CreateAtomsParams {
    coordinates: AtomWithBonds[];
    quality: number;
    showHydrogens: boolean;
    multiplicationFactor: number;
    selectedGenerator: SelectedGeneratorParams;
    bondDiameterMultiplicationFactor?: number; // Added property for bond diameter
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