// Client-side import of structures that need more than parsing: ChemDraw files (.cdx via
// ./cdx.ts, .cdxml via ./cdxml.ts) and 2D drawings (MDL .mol from ChemDraw, ChemSketch,
// Marvin ... with implicit hydrogens), which are turned into full 3D structures.
import { cdxToCdxml } from './cdx';
import { cdxmlToMolfile } from './cdxml';
import { fetchCactus3DSdf } from './inputs';
import { generate3DLocally, loadKekule, toSmiles, type KekuleNS } from './kekuleDraw';

export type ChemDrawFormat = 'cdx' | 'cdxml';

export interface Converted3D {
  sdf: string;
  smiles: string;
  /** Who produced the 3D coordinates. */
  generator: 'cactus' | 'openbabel';
  iupacName?: string;
  /** 2D depiction from CACTUS (online only). */
  imageUrl?: string;
}

/**
 * True when an MDL molfile / SDF record holds a 2D drawing rather than 3D coordinates:
 * the header says "2D" or every z coordinate is zero.
 */
export function molfileIsFlat(molfile: string): boolean {
  const lines = (molfile.split('$$$$')[0] ?? molfile).split(/\r?\n/);
  const dimension = (lines[1] ?? '').slice(20, 22).toUpperCase();
  if (dimension === '3D') return false;

  const zs: number[] = [];
  for (const line of lines) {
    const v3000 = /^M {2}V30 \d+ [A-Za-z*#]{1,3} (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/.exec(line);
    if (v3000) {
      zs.push(Number(v3000[3]));
      continue;
    }
    const v2000 = /^\s*-?\d+\.\d+\s+-?\d+\.\d+\s+(-?\d+\.\d+)\s+[A-Za-z*]/.exec(line);
    if (v2000) zs.push(Number(v2000[1]));
  }
  if (zs.length === 0) return false;
  if (dimension === '2D') return true;
  return zs.length > 1 && zs.every((z) => Math.abs(z) < 1e-4);
}

/** True when the text is ChemDraw's XML format. */
export function isCdxml(text: string): boolean {
  const head = text.slice(0, 600).replace(/^﻿/, '').trimStart();
  return /^<\?xml[^>]*>\s*(?:<!DOCTYPE\s+CDXML|<CDXML)/i.test(head) || /^<CDXML[\s>]/i.test(head);
}

/** True when the bytes are a binary ChemDraw document (magic "VjCD0100"). */
export function isCdxBinary(bytes: Uint8Array): boolean {
  const magic = 'VjCD0100';
  if (bytes.length < magic.length) return false;
  for (let i = 0; i < magic.length; i++) {
    if (bytes[i] !== magic.charCodeAt(i)) return false;
  }
  return true;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out.')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

/**
 * Builds a 3D structure (with explicit hydrogens) from a 2D molecule: NIH CACTUS when online,
 * OpenBabel (WASM, MMFF94) locally otherwise or when CACTUS fails.
 */
async function moleculeTo3D(Kekule: KekuleNS, mol: KekuleNS): Promise<Converted3D> {
  const smiles = toSmiles(Kekule, mol);
  if (smiles && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const loaded = await withTimeout(fetchCactus3DSdf(smiles), 15000);
      return { sdf: loaded.sdf, smiles, generator: 'cactus', iupacName: loaded.iupacName, imageUrl: loaded.imageUrl };
    } catch (e) {
      console.warn('CACTUS 3D generation failed, falling back to local OpenBabel:', e);
    }
  }
  const sdf = await generate3DLocally(Kekule, mol);
  return { sdf, smiles, generator: 'openbabel' };
}

/** Converts a 2D MDL molfile (e.g. exported from ChemDraw) into a 3D structure. */
export async function molfileTo3D(molfile: string): Promise<Converted3D> {
  const Kekule = await loadKekule();
  const mol = Kekule.IO.loadFormatData(molfile, 'mol');
  if (!mol) throw new Error('The molfile could not be read.');
  return moleculeTo3D(Kekule, mol);
}

/** Converts a ChemDraw document (.cdx bytes or .cdxml text) into a 3D structure. */
export async function chemDrawTo3D(data: Uint8Array | string, format: ChemDrawFormat): Promise<Converted3D> {
  const cdxml =
    format === 'cdx'
      ? cdxToCdxml(typeof data === 'string' ? new TextEncoder().encode(data) : data)
      : typeof data === 'string'
        ? data
        : new TextDecoder().decode(data);
  return molfileTo3D(cdxmlToMolfile(cdxml));
}

/** Converts a SMILES string to 3D (CACTUS online, OpenBabel offline). */
export async function smilesTo3D(smiles: string): Promise<Converted3D> {
  const Kekule = await loadKekule();
  const mol = Kekule.IO.loadFormatData(smiles, 'smi');
  if (!mol) throw new Error('The SMILES could not be read.');
  return moleculeTo3D(Kekule, mol);
}
