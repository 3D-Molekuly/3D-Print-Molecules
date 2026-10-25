import type { RequestHandler } from './$types';
import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

interface StoredModel {
	buffer: Buffer;
	filename: string;
	filePath?: string;
	expiresAt: number;
}

const TTL_MS = 10 * 60 * 1000; // 10 minutes
const modelStore = new Map<string, StoredModel>();

const MAC_SLICER_APPS: Record<string, string[]> = {
	prusaslicer: ['PrusaSlicer', 'Original Prusa Drivers'],
	orcaslicer: ['OrcaSlicer'],
	cura: ['UltiMaker Cura', 'Ultimaker Cura', 'Cura'],
	bambustudio: ['BambuStudio', 'Bambu Studio']
};

function cleanupExpired() {
	const now = Date.now();
	for (const [key, entry] of modelStore.entries()) {
		if (entry.expiresAt <= now) {
			modelStore.delete(key);
			try {
				const dirPath = join(tmpdir(), 'slicer_models', key);
				if (existsSync(dirPath)) rmSync(dirPath, { recursive: true, force: true });
			} catch {
				// Ignore cleanup errors
			}
		}
	}
}

function sanitizeId(id: string): string {
	return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

function sanitizeFilename(name: string): string {
	const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, '_');
	return cleaned.endsWith('.3mf') ? cleaned : `${cleaned}.3mf`;
}

function isLocalhostRequest(hostname: string): boolean {
	return (
		hostname === 'localhost' ||
		hostname === '127.0.0.1' ||
		hostname === '::1' ||
		hostname === '[::1]'
	);
}

async function tryOpenLocallyOnMac(slicerId: string, filePath: string): Promise<boolean> {
	const candidates = MAC_SLICER_APPS[slicerId] || [];
	for (const appName of candidates) {
		try {
			await execFileAsync('open', ['-a', appName, filePath]);
			return true;
		} catch {
			// Try next candidate app name
		}
	}
	return false;
}

export const POST: RequestHandler = async ({ params, request, url }) => {
	cleanupExpired();

	const safeId = sanitizeId(params.id || '');
	const safeFilename = sanitizeFilename(params.filename || 'molecule.3mf');
	const slicerId = (url.searchParams.get('slicer') || '').toLowerCase();

	if (!safeId) {
		return new Response(JSON.stringify({ error: 'Invalid ID' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const arrayBuffer = await request.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	let savedFilePath: string | undefined;
	try {
		const dirPath = join(tmpdir(), 'slicer_models', safeId);
		mkdirSync(dirPath, { recursive: true });
		savedFilePath = join(dirPath, safeFilename);
		writeFileSync(savedFilePath, buffer);
	} catch {
		// Fallback to in-memory store if tmpdir is unavailable
	}

	modelStore.set(safeId, {
		buffer,
		filename: safeFilename,
		filePath: savedFilePath,
		expiresAt: Date.now() + TTL_MS
	});

	let openedLocally = false;
	if (savedFilePath && slicerId && isLocalhostRequest(url.hostname) && process.platform === 'darwin') {
		openedLocally = await tryOpenLocallyOnMac(slicerId, savedFilePath);
	}

	return new Response(JSON.stringify({ ok: true, openedLocally }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};

export const GET: RequestHandler = async ({ params }) => {
	cleanupExpired();

	const safeId = sanitizeId(params.id || '');
	const safeFilename = sanitizeFilename(params.filename || 'molecule.3mf');

	let buffer: Buffer | null = null;
	const memEntry = modelStore.get(safeId);

	if (memEntry && memEntry.expiresAt > Date.now()) {
		buffer = memEntry.buffer;
	} else {
		try {
			const tmpPath = join(tmpdir(), 'slicer_models', safeId, safeFilename);
			if (existsSync(tmpPath)) {
				buffer = readFileSync(tmpPath);
			}
		} catch {
			// Ignore read errors
		}
	}

	if (!buffer) {
		return new Response('Model file not found or expired', { status: 404 });
	}

	return new Response(new Uint8Array(buffer), {
		status: 200,
		headers: {
			'Content-Type': 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
			'Content-Disposition': `attachment; filename="${safeFilename}"`,
			'Content-Length': String(buffer.byteLength),
			'Access-Control-Allow-Origin': '*',
			'Cache-Control': 'private, max-age=600'
		}
	});
};
