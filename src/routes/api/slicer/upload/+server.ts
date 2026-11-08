import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { list, del } from '@vercel/blob';

// Serverless instances on Vercel don't share memory or /tmp, so models handed to a slicer
// via a URL are stored in Vercel Blob instead. The browser uploads directly to Blob (no
// 4.5 MB function body limit); this route only issues the short-lived client token.

const BLOB_PREFIX = 'slicer/';
const TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_SIZE_BYTES = 200 * 1024 * 1024;
const PATHNAME_RE = /^slicer\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9._-]+\.3mf$/;

async function cleanupExpired(token: string) {
	const cutoff = Date.now() - TTL_MS;
	let cursor: string | undefined;
	do {
		const page = await list({ prefix: BLOB_PREFIX, cursor, limit: 1000, token });
		const expired = page.blobs
			.filter((blob) => new Date(blob.uploadedAt).getTime() < cutoff)
			.map((blob) => blob.url);
		if (expired.length > 0) await del(expired, { token });
		cursor = page.hasMore ? page.cursor : undefined;
	} while (cursor);
}

export const POST: RequestHandler = async ({ request }) => {
	const token = env.BLOB_READ_WRITE_TOKEN;
	if (!token) {
		return json({ error: 'Blob storage is not configured' }, { status: 503 });
	}

	const body = (await request.json()) as HandleUploadBody;

	try {
		const result = await handleUpload({
			body,
			request,
			token,
			onBeforeGenerateToken: async (pathname) => {
				if (!PATHNAME_RE.test(pathname)) {
					throw new Error('Invalid pathname');
				}
				try {
					await cleanupExpired(token);
				} catch (err) {
					console.error('Slicer blob cleanup failed:', err);
				}
				return {
					allowedContentTypes: [
						'application/vnd.ms-package.3dmanufacturing-3dmodel+xml',
						'application/octet-stream'
					],
					maximumSizeInBytes: MAX_SIZE_BYTES,
					addRandomSuffix: true,
					validUntil: Date.now() + 5 * 60 * 1000
				};
			}
		});
		return json(result);
	} catch (err) {
		return json({ error: (err as Error).message }, { status: 400 });
	}
};
