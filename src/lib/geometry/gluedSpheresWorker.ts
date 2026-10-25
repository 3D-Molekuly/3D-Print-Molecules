import type { AtomCoordinate } from '$lib/molecules/molecularDataParser';
import type { GluedSpheresConfig } from '$lib/types';
import {
	computeGluedSpheres,
	type ComputeGluedSpheresResult
} from '$lib/geometry/gluedSpheres';

export interface GluedSpheresWorkerRequest {
	requestId: number;
	coordinates: AtomCoordinate[];
	quality: number;
	showHydrogens: boolean;
	multiplicationFactor: number;
	uniformAtomDiameter?: boolean;
	config: GluedSpheresConfig;
}

export type GluedSpheresWorkerResponse =
	| {
			type: 'progress';
			requestId: number;
			completed: number;
			total: number;
	  }
	| {
			type: 'result';
			requestId: number;
			result: ComputeGluedSpheresResult;
	  }
	| {
			type: 'error';
			requestId: number;
			message: string;
	  };

const workerSelf = self as unknown as {
	onmessage: ((event: MessageEvent<GluedSpheresWorkerRequest>) => void) | null;
	postMessage: (message: GluedSpheresWorkerResponse, transfer?: Transferable[]) => void;
};

workerSelf.onmessage = async (event: MessageEvent<GluedSpheresWorkerRequest>) => {
	const {
		requestId,
		coordinates,
		quality,
		showHydrogens,
		multiplicationFactor,
		uniformAtomDiameter,
		config
	} = event.data;

	try {
		const result = await computeGluedSpheres(coordinates, {
			quality,
			showHydrogens,
			multiplicationFactor,
			uniformAtomDiameter,
			config,
			onProgress: (completed, total) => {
				workerSelf.postMessage({
					type: 'progress',
					requestId,
					completed,
					total
				});
			}
		});

		const transferables: Transferable[] = [];
		for (const part of result.parts) {
			transferables.push(part.positions.buffer, part.indices.buffer);
		}

		workerSelf.postMessage(
			{
				type: 'result',
				requestId,
				result
			},
			transferables
		);
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		workerSelf.postMessage({
			type: 'error',
			requestId,
			message
		});
	}
};
